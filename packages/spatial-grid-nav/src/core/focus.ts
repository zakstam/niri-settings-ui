import type { Selectors, FocusHistoryEntry } from "./types.js";

/**
 * Manages active group/item state, data attributes, and per-section
 * focus history for restoration.
 */
export class FocusManager {
  private selectors: Selectors;
  private activeGroup: HTMLElement | null = null;
  private activeItem: HTMLElement | null = null;
  private focusHistory = new Map<string, FocusHistoryEntry>();

  constructor(selectors: Selectors) {
    this.selectors = selectors;
  }

  // ── Active Group & Item ──

  getActiveGroup(): HTMLElement | null {
    return this.activeGroup;
  }

  setActiveGroup(group: HTMLElement | null): void {
    if (this.activeGroup === group) {
      if (!group) {
        this.clearActiveItem();
      }
      return;
    }

    // Remove attributes from previous group
    if (this.activeGroup) {
      this.activeGroup.removeAttribute("data-sgn-active");
      this.activeGroup.removeAttribute("data-sgn-active-group");
      this.activeGroup.removeAttribute("data-sgn-trapped");
    }

    this.clearActiveItem();
    this.activeGroup = group;

    // Set attributes on new group
    if (group) {
      group.setAttribute("data-sgn-active", "");
      group.setAttribute("data-sgn-active-group", "");
      group.setAttribute("data-sgn-trapped", "");
    }
  }

  clearActiveGroup(): void {
    this.setActiveGroup(null);
  }

  getActiveItem(): HTMLElement | null {
    return this.activeItem;
  }

  setActiveItem(item: HTMLElement | null): void {
    if (this.activeItem === item) return;

    if (this.activeItem) {
      this.activeItem.removeAttribute("data-sgn-active-item");
    }

    this.activeItem = item;

    if (item) {
      item.setAttribute("data-sgn-active-item", "");
    }
  }

  clearActiveItem(): void {
    this.setActiveItem(null);
  }

  // ── Focus History ──

  saveFocusHistory(
    sectionId: string,
    group: Element,
    item: Element | null,
  ): void {
    this.focusHistory.set(sectionId, {
      groupElement: group,
      itemElement: item,
    });
  }

  getFocusHistory(sectionId: string): FocusHistoryEntry | null {
    return this.focusHistory.get(sectionId) ?? null;
  }

  clearFocusHistory(sectionId: string): void {
    this.focusHistory.delete(sectionId);
  }

  // ── Item Discovery ──

  getItems(group: HTMLElement): HTMLElement[] {
    return Array.from(
      group.querySelectorAll<HTMLElement>(this.selectors.item),
    ).filter((el) => !this.isHidden(el));
  }

  // ── Focus Actions ──

  /** Focus the first or last item in a group */
  enterGroup(group: HTMLElement, fromEnd = false): boolean {
    const items = this.getItems(group);
    if (items.length === 0) return false;

    const target = fromEnd ? items[items.length - 1]! : items[0]!;
    this.focusItem(target);
    return true;
  }

  /** Cycle to next/prev item within a group */
  cycleItem(
    group: HTMLElement,
    forward: boolean,
    fromItem?: HTMLElement | null,
  ): boolean {
    const items = this.getItems(group);
    if (items.length === 0) return false;

    const preferredActive = fromItem ?? this.activeItem;
    const currentIndex = preferredActive ? items.indexOf(preferredActive) : -1;

    const nextIndex = currentIndex === -1
      ? (forward ? 0 : items.length - 1)
      : forward
        ? (currentIndex + 1) % items.length
        : (currentIndex - 1 + items.length) % items.length;

    this.focusItem(items[nextIndex]!);
    return true;
  }

  focusItem(item: HTMLElement): void {
    this.setActiveItem(item);
    this.focusElement(item);
  }

  private focusElement(element: HTMLElement): void {
    const options = { preventScroll: true, focusVisible: true } as FocusOptions;
    try {
      element.focus(options);
    } catch {
      element.focus({ preventScroll: true });
    }
  }

  // ── Helpers ──

  private isHidden(el: HTMLElement): boolean {
    if (el.hidden) return true;
    if (el.getAttribute("aria-hidden") === "true") return true;
    if (el.style.display === "none") return true;
    if (el.style.visibility === "hidden") return true;
    return false;
  }
}
