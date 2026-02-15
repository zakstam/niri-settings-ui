import type {
  FocusMode,
  Direction,
  EngineConfig,
  EngineEvent,
  EngineEventMap,
  GroupStrategy,
  KeyBindings,
  Middleware,
  NavigationAction,
  NavigationFailureReason,
  NavigationResult,
  NavigationTuning,
  Selectors,
} from "./types.js";
import {
  DEFAULT_KEY_BINDINGS,
  DEFAULT_SELECTORS,
} from "./types.js";
import { SpatialGraph } from "./graph.js";
import { FocusManager } from "./focus.js";
import { DOMObserver } from "./observer.js";
import { TabIndexEnforcer } from "./tabindex-enforcer.js";
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
  private tuning: NavigationTuning;

  private graph: SpatialGraph;
  private focus: FocusManager;
  private observer: DOMObserver | null = null;
  private tabEnforcer: TabIndexEnforcer;

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
    focusStateChange: new Set(),
  };

  private handleKeyDown: (e: KeyboardEvent) => void;
  private handleFocusIn: (e: FocusEvent) => void;

  constructor(root: HTMLElement, config: EngineConfig = {}) {
    this.root = root;
    this.selectors = { ...DEFAULT_SELECTORS, ...config.selectors };
    this.keyBindings = { ...DEFAULT_KEY_BINDINGS, ...config.keyBindings };
    this.middleware = config.middleware ?? [];
    this.tuning = { ...config.tuning };

    this.graph = new SpatialGraph(this.selectors);
    this.focus = new FocusManager(this.selectors);
    this.tabEnforcer = new TabIndexEnforcer();

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
    this.tabEnforcer.enforce(this.getSectionScope());
  }

  detach(): void {
    if (!this.attached) return;
    this.attached = false;

    window.removeEventListener("keydown", this.handleKeyDown, true);
    window.removeEventListener("focusin", this.handleFocusIn);

    this.observer?.disconnect();
    this.observer = null;
    this.tabEnforcer.restore();
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

  navigate(direction: Direction): NavigationResult {
    if (!this.attached) {
      return this.navigationFailure(null, null, "not-attached");
    }

    this.ensureGraph();
    const currentGroup = this.focus.getActiveGroup();
    const groups = this.graph.getGroups();

    if (groups.length === 0) {
      return this.navigationFailure(currentGroup, null, "no-groups");
    }

    if (!currentGroup) {
      const strategy = direction === "left" || direction === "up" ? "prev" : "next";
      return this.focusGroup(strategy);
    }

    const nextGroup = this.graph.findAdjacent(
      currentGroup,
      direction,
      this.tuning.crossAxisPenalty,
    );
    if (!nextGroup) {
      return this.navigationFailure(currentGroup, null, "no-candidate");
    }

    const action = this.makeAction("navigate", nextGroup, direction);
    if (!this.runAction(action)) {
      return this.navigationFailure(currentGroup, nextGroup, "action-blocked");
    }

    if (nextGroup === currentGroup) {
      return this.navigationFailure(currentGroup, nextGroup, "already-at-target");
    }

    this.activateGroup(nextGroup);
    return this.navigationSuccess(currentGroup, nextGroup);
  }

  focusGroup(strategy: GroupStrategy): NavigationResult {
    this.ensureGraph();
    const groups = this.graph.getGroups();
    if (groups.length === 0) {
      return this.navigationFailure(this.focus.getActiveGroup(), null, "no-groups");
    }

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

    if (!target) {
      return this.navigationFailure(current, null, "no-group");
    }

    if (target === current) {
      return this.navigationFailure(current, target, "already-at-target");
    }

    const action = this.makeAction("focusGroup", target);
    if (!this.runAction(action)) {
      return this.navigationFailure(current, target, "action-blocked");
    }

    this.activateGroup(target);
    return this.navigationSuccess(current, target);
  }

  enterGroup(fromEnd = false): NavigationResult {
    const group = this.focus.getActiveGroup();
    if (!group) {
      return this.navigationFailure(null, null, "no-group");
    }

    const action = this.makeAction("enterGroup", group);
    if (!this.runAction(action)) {
      return this.navigationFailure(group, group, "action-blocked");
    }

    const entered = this.focus.enterGroup(group, fromEnd);
    if (!entered) {
      return this.navigationFailure(group, group, "no-candidate");
    }

    this.emitFocusStateChange("item");
    return this.navigationSuccess(group, group);
  }

  exitGroup(): NavigationResult {
    const group = this.focus.getActiveGroup();
    if (!group) {
      return this.navigationFailure(null, null, "no-group");
    }

    const action = this.makeAction("exitGroup", null);
    if (!this.runAction(action)) {
      return this.navigationFailure(group, null, "action-blocked");
    }

    this.focus.clearActiveItem();
    this.focus.setActiveGroup(group);
    this.focusElement(group);
    this.emitFocusStateChange("group");
    return this.navigationSuccess(group, null);
  }

  // ── Section API ──

  setActiveSection(sectionId: string): void {
    // Save current focus before leaving
    if (this.activeSection) {
      const group = this.focus.getActiveGroup();
      const item = this.focus.getActiveItem() as Element | null;
      if (group) {
        this.focus.saveFocusHistory(
          this.activeSection,
          group,
          item ?? (document.activeElement as Element | null),
        );
      }
    }

    if (!this.hasSection(sectionId)) {
      return;
    }

    const section = this.getSectionScope(sectionId);
    this.activeSection = sectionId;
    this.focus.clearActiveGroup();
    this.graph.invalidate();
    this.rebuildGraph();
    this.tabEnforcer.enforce(section);
    this.emitFocusStateChange("group");
    this.emit("sectionChange", sectionId);
  }

  restoreFocus(sectionId: string): void {
    this.activeSection = sectionId;
    this.graph.invalidate();
    this.rebuildGraph();
    this.tabEnforcer.enforce(this.getSectionScope());

    const entry = this.focus.getFocusHistory(sectionId);
    if (entry && document.contains(entry.groupElement as Node)) {
      this.activateGroupInternal(entry.groupElement as HTMLElement, {
        persistHistory: false,
      });

      if (
        entry.itemElement &&
        document.contains(entry.itemElement as Node)
      ) {
        this.focus.setActiveItem(entry.itemElement as HTMLElement);
        this.focusElement(entry.itemElement as HTMLElement);
        this.emitFocusStateChange("item");
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
    this.activateGroupInternal(group);
  }

  private activateGroupInternal(
    group: HTMLElement,
    options: { persistHistory?: boolean } = {},
  ): void {
    const previousGroup = this.focus.getActiveGroup();
    this.focus.setActiveGroup(group);
    this.focusElement(group);

    if (previousGroup !== group) {
      this.emit("groupChange", group);
    }

    // Save to history
    if (this.activeSection && group !== previousGroup && options.persistHistory !== false) {
      this.focus.saveFocusHistory(this.activeSection, group, null);
    }

    this.emitFocusStateChange("group");
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
        item: this.focus.getActiveItem() ?? (document.activeElement as Element | null),
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

  private getSectionScope(sectionId: string = this.activeSection): HTMLElement {
    if (sectionId) {
      const section = this.root.querySelector<HTMLElement>(
        `[data-sgn-section="${sectionId}"]`,
      );
      return section ?? this.root;
    }
    return this.root;
  }

  private hasSection(sectionId: string): boolean {
    if (!sectionId) return true;
    return this.root.querySelector(`[data-sgn-section="${sectionId}"]`) !== null;
  }

  private navigationSuccess(
    from: Element | null,
    to: Element | null,
  ): NavigationResult {
    return { moved: true, from, to };
  }

  private navigationFailure(
    from: Element | null,
    to: Element | null,
    reason: NavigationFailureReason,
  ): NavigationResult {
    return { moved: false, from, to, reason };
  }

  private focusElement(element: HTMLElement): void {
    const options = { preventScroll: true, focusVisible: true } as FocusOptions;
    try {
      element.focus(options);
    } catch {
      element.focus({ preventScroll: true });
    }
  }

  private onKeyDown(event: KeyboardEvent): void {
    if (!this.attached) return;

    const action = resolveAction(event, this.keyBindings);
    if (!action) return;

    // Yield to elements with data-sgn-capture (sliders, selects, etc.)
    if (this.graph.isCaptured(document.activeElement)) return;

    // For item cycling, only intercept arrows matching the group's orientation
    if (action.type === "itemCycle") {
      const group = this.focus.getActiveGroup();
      if (group) {
        const orientation = group.dataset.sgnOrientation ?? "vertical";
        const key = event.key;
        if (orientation === "vertical" && (key === "ArrowLeft" || key === "ArrowRight")) return;
        if (orientation === "horizontal" && (key === "ArrowDown" || key === "ArrowUp")) return;
      }
    }

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
      case "itemCycle":
        this.handleItemCycle(action.forward);
        break;
      case "escape":
        this.exitGroup();
        break;
    }
  }

  private handleItemCycle(forward: boolean): void {
    const activeGroup = this.focus.getActiveGroup();
    if (!activeGroup) {
      this.focusGroup("first");
      return;
    }

    const activeItem = this.focus.getActiveItem();
    const activeItemInGroup = activeItem
      ? activeItem.closest(this.selectors.group) === activeGroup
      : false;
    const isOnGroupContainer = document.activeElement === activeGroup;
    if (!activeItemInGroup || isOnGroupContainer) {
      const entered = this.focus.enterGroup(activeGroup, !forward);
      if (entered) {
        this.emitFocusStateChange("item");
      }
      return;
    }

    this.focus.cycleItem(activeGroup, forward, activeItem);
    this.emitFocusStateChange("item");
  }

  private onFocusIn(event: FocusEvent): void {
    if (!this.attached) return;
    const target = event.target as HTMLElement;
    if (!target) return;

    // Find the closest group ancestor
    const group = target.closest<HTMLElement>(this.selectors.group);
    const previousGroup = this.focus.getActiveGroup();
    const previousItem = this.focus.getActiveItem();
    if (group && group !== this.focus.getActiveGroup()) {
      this.focus.setActiveGroup(group);
      this.emit("groupChange", group);

      if (this.activeSection) {
        this.focus.saveFocusHistory(this.activeSection, group, target);
      }
    }

    if (group) {
      const item = target.matches(this.selectors.item)
        ? target
        : target.closest<HTMLElement>(this.selectors.item);
      this.focus.setActiveItem(item && group.contains(item) ? item : null);
    } else {
      this.focus.clearActiveItem();
      this.focus.clearActiveGroup();
    }

    if (
      previousGroup !== this.focus.getActiveGroup() ||
      previousItem !== this.focus.getActiveItem()
    ) {
      this.emitFocusStateChange(this.focus.getActiveItem() ? "item" : "group");
    }
  }

  private emitFocusStateChange(mode: FocusMode): void {
    this.emit(
      "focusStateChange",
      this.activeSection,
      this.focus.getActiveGroup(),
      this.focus.getActiveItem(),
      mode,
    );
  }
}
