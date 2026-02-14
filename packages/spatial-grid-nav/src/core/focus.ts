import type { Selectors, FocusHistoryEntry } from "./types.js";

/**
 * Manages active group state, data attributes, and per-section
 * focus history for restoration.
 */
export class FocusManager {
  private selectors: Selectors;
  private activeGroup: HTMLElement | null = null;
  private focusHistory = new Map<string, FocusHistoryEntry>();

  constructor(selectors: Selectors) {
    this.selectors = selectors;
  }

  // ── Active Group ──

  getActiveGroup(): HTMLElement | null {
    return this.activeGroup;
  }

  setActiveGroup(group: HTMLElement | null): void {
    if (this.activeGroup === group) return;

    // Remove attributes from previous
    if (this.activeGroup) {
      this.activeGroup.removeAttribute("data-sgn-active");
      this.activeGroup.removeAttribute("data-sgn-trapped");
    }

    this.activeGroup = group;

    // Set attributes on new
    if (group) {
      group.setAttribute("data-sgn-active", "");
      group.setAttribute("data-sgn-trapped", "");
    }
  }

  clearActiveGroup(): void {
    this.setActiveGroup(null);
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
    target.focus({ preventScroll: true });
    return true;
  }

  /** Cycle to next/prev item within a group */
  cycleItem(group: HTMLElement, forward: boolean): boolean {
    const items = this.getItems(group);
    if (items.length === 0) return false;

    const active = document.activeElement as HTMLElement;
    const currentIndex = items.indexOf(active);

    let nextIndex: number;
    if (currentIndex === -1) {
      nextIndex = forward ? 0 : items.length - 1;
    } else {
      nextIndex = forward
        ? (currentIndex + 1) % items.length
        : (currentIndex - 1 + items.length) % items.length;
    }

    items[nextIndex]!.focus({ preventScroll: true });
    return true;
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
