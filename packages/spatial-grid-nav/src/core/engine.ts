import type {
  Direction,
  GroupStrategy,
  EngineConfig,
  EngineEvent,
  EngineEventMap,
  NavigationAction,
  Middleware,
  Selectors,
  KeyBindings,
} from "./types.js";
import {
  DEFAULT_SELECTORS,
  DEFAULT_KEY_BINDINGS,
} from "./types.js";
import { SpatialGraph } from "./graph.js";
import { FocusManager } from "./focus.js";
import { DOMObserver } from "./observer.js";
import { resolveAction, type KeyAction } from "./keyboard.js";
import { runMiddleware } from "./middleware.js";

type EventHandler<E extends EngineEvent> = EngineEventMap[E];
type EventHandlers = {
  [E in EngineEvent]: Set<EventHandler<E>>;
};

export class NavigationEngine {
  private root: HTMLElement;
  private selectors: Selectors;
  private keyBindings: KeyBindings;
  private middleware: Middleware[];

  private graph: SpatialGraph;
  private focus: FocusManager;
  private observer: DOMObserver | null = null;

  private activeSection: string = "";
  private attached = false;
  private destroyed = false;

  private handlers: EventHandlers = {
    willNavigate: new Set(),
    didNavigate: new Set(),
    sectionChange: new Set(),
    sectionNav: new Set(),
    groupChange: new Set(),
    focusRestore: new Set(),
  };

  private handleKeyDown: (e: KeyboardEvent) => void;
  private handleFocusIn: (e: FocusEvent) => void;

  constructor(root: HTMLElement, config: EngineConfig = {}) {
    this.root = root;
    this.selectors = { ...DEFAULT_SELECTORS, ...config.selectors };
    this.keyBindings = { ...DEFAULT_KEY_BINDINGS, ...config.keyBindings };
    this.middleware = config.middleware ?? [];

    this.graph = new SpatialGraph(this.selectors);
    this.focus = new FocusManager(this.selectors);

    this.handleKeyDown = this.onKeyDown.bind(this);
    this.handleFocusIn = this.onFocusIn.bind(this);
  }

  // ── Lifecycle ──

  attach(): void {
    if (this.attached || this.destroyed) return;
    this.attached = true;

    window.addEventListener("keydown", this.handleKeyDown, true);
    window.addEventListener("focusin", this.handleFocusIn);

    this.observer = new DOMObserver(this.root, () => {
      this.graph.invalidate();
    });
    this.observer.observe();

    this.rebuildGraph();
  }

  detach(): void {
    if (!this.attached) return;
    this.attached = false;

    window.removeEventListener("keydown", this.handleKeyDown, true);
    window.removeEventListener("focusin", this.handleFocusIn);

    this.observer?.disconnect();
    this.observer = null;
  }

  destroy(): void {
    this.detach();
    this.destroyed = true;
    this.focus.clearActiveGroup();
    for (const set of Object.values(this.handlers)) {
      set.clear();
    }
  }

  // ── Navigation API ──

  navigate(direction: Direction): void {
    this.ensureGraph();
    const currentGroup = this.focus.getActiveGroup();
    if (!currentGroup) return;

    const nextGroup = this.graph.findAdjacent(currentGroup, direction);
    if (!nextGroup) return;

    const action = this.makeAction("navigate", nextGroup, direction);
    if (this.runAction(action)) {
      this.activateGroup(nextGroup);
    }
  }

  focusGroup(strategy: GroupStrategy): void {
    this.ensureGraph();
    const groups = this.graph.getGroups();
    if (groups.length === 0) return;

    const current = this.focus.getActiveGroup();
    let target: HTMLElement | null = null;

    switch (strategy) {
      case "first":
        target = groups[0] ?? null;
        break;
      case "last":
        target = groups[groups.length - 1] ?? null;
        break;
      case "next": {
        const idx = current ? groups.indexOf(current) : -1;
        target = groups[(idx + 1) % groups.length] ?? null;
        break;
      }
      case "prev": {
        const idx = current ? groups.indexOf(current) : 0;
        target = groups[(idx - 1 + groups.length) % groups.length] ?? null;
        break;
      }
    }

    if (target) {
      const action = this.makeAction("focusGroup", target);
      if (this.runAction(action)) {
        this.activateGroup(target);
      }
    }
  }

  enterGroup(): void {
    const group = this.focus.getActiveGroup();
    if (!group) return;

    const action = this.makeAction("enterGroup", group);
    if (this.runAction(action)) {
      this.focus.enterGroup(group);
    }
  }

  exitGroup(): void {
    const group = this.focus.getActiveGroup();
    if (!group) return;

    const action = this.makeAction("exitGroup", null);
    if (this.runAction(action)) {
      this.focus.clearActiveGroup();
      group.focus({ preventScroll: true });
    }
  }

  // ── Section API ──

  setActiveSection(sectionId: string): void {
    // Save current focus before leaving
    if (this.activeSection) {
      const group = this.focus.getActiveGroup();
      if (group) {
        this.focus.saveFocusHistory(
          this.activeSection,
          group,
          document.activeElement as Element | null,
        );
      }
    }

    this.activeSection = sectionId;
    this.focus.clearActiveGroup();
    this.graph.invalidate();
    this.rebuildGraph();
    this.emit("sectionChange", sectionId);
  }

  restoreFocus(sectionId: string): void {
    this.activeSection = sectionId;
    this.graph.invalidate();
    this.rebuildGraph();

    const entry = this.focus.getFocusHistory(sectionId);
    if (entry && document.contains(entry.groupElement as Node)) {
      this.activateGroup(entry.groupElement as HTMLElement);
      if (
        entry.itemElement &&
        document.contains(entry.itemElement as Node)
      ) {
        (entry.itemElement as HTMLElement).focus({ preventScroll: true });
      }
      this.emit("focusRestore", sectionId, entry.groupElement as HTMLElement);
    } else {
      this.focusGroup("first");
    }
  }

  // ── State Queries ──

  getActiveGroup(): HTMLElement | null {
    return this.focus.getActiveGroup();
  }

  getActiveSection(): string {
    return this.activeSection;
  }

  // ── Events ──

  on<E extends EngineEvent>(
    event: E,
    handler: EventHandler<E>,
  ): () => void {
    const set = this.handlers[event] as Set<EventHandler<E>>;
    set.add(handler);
    return () => {
      set.delete(handler);
    };
  }

  // ── Private ──

  private emit<E extends EngineEvent>(
    event: E,
    ...args: Parameters<EngineEventMap[E]>
  ): void {
    const set = this.handlers[event] as Set<(...a: any[]) => void>;
    for (const handler of set) {
      handler(...args);
    }
  }

  private activateGroup(group: HTMLElement): void {
    this.focus.setActiveGroup(group);
    group.focus({ preventScroll: true });
    this.emit("groupChange", group);

    // Save to history
    if (this.activeSection) {
      this.focus.saveFocusHistory(this.activeSection, group, null);
    }
  }

  private makeAction(
    type: NavigationAction["type"],
    toGroup: HTMLElement | null,
    direction?: Direction,
  ): NavigationAction {
    const currentGroup = this.focus.getActiveGroup();
    return {
      type,
      direction,
      from: {
        group: currentGroup,
        item: document.activeElement,
        section: this.activeSection,
      },
      to: {
        group: toGroup,
        item: null,
        section: this.activeSection,
      },
      cancelled: false,
    };
  }

  private runAction(action: NavigationAction): boolean {
    this.emit("willNavigate", action);
    runMiddleware(action, this.middleware);
    if (action.cancelled) return false;
    this.emit("didNavigate", action);
    return true;
  }

  private ensureGraph(): void {
    const scope = this.getSectionScope();
    this.graph.ensureFresh(scope);
  }

  private rebuildGraph(): void {
    const scope = this.getSectionScope();
    this.graph.build(scope);
  }

  private getSectionScope(): HTMLElement {
    if (this.activeSection) {
      const section = this.root.querySelector<HTMLElement>(
        `[data-sgn-section="${this.activeSection}"]`,
      );
      if (section) return section;
    }
    return this.root;
  }

  private onKeyDown(event: KeyboardEvent): void {
    if (!this.attached) return;

    // Yield to elements with data-sgn-capture
    if (this.graph.isCaptured(document.activeElement)) return;

    const action = resolveAction(event, this.keyBindings);
    if (!action) return;

    event.preventDefault();
    event.stopPropagation();

    this.handleAction(action);
  }

  private handleAction(action: KeyAction): void {
    switch (action.type) {
      case "groupDirection":
        this.navigate(action.direction);
        break;
      case "groupStrategy":
        this.focusGroup(action.strategy);
        break;
      case "sectionNav":
        this.emit("sectionNav", action.direction);
        break;
      case "tab":
        this.handleTab(action.forward);
        break;
      case "escape":
        this.exitGroup();
        break;
    }
  }

  private handleTab(forward: boolean): void {
    const activeGroup = this.focus.getActiveGroup();

    if (!activeGroup) {
      // No active group — focus the first group
      this.focusGroup("first");
      return;
    }

    const isOnGroupContainer = document.activeElement === activeGroup;
    if (isOnGroupContainer) {
      // On group container — enter it
      this.focus.enterGroup(activeGroup, !forward);
      return;
    }

    // Inside a group — cycle items
    this.focus.cycleItem(activeGroup, forward);
  }

  private onFocusIn(event: FocusEvent): void {
    if (!this.attached) return;
    const target = event.target as HTMLElement;
    if (!target) return;

    // Find the closest group ancestor
    const group = target.closest<HTMLElement>(this.selectors.group);
    if (group && group !== this.focus.getActiveGroup()) {
      this.focus.setActiveGroup(group);
      this.emit("groupChange", group);

      if (this.activeSection) {
        this.focus.saveFocusHistory(this.activeSection, group, target);
      }
    }
  }
}
