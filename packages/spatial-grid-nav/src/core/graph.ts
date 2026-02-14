import type { Direction, Selectors } from "./types.js";
import { rectCenter, findBestCandidate } from "./spatial.js";

/**
 * Checks if an element is hidden from navigation.
 */
function isHidden(el: HTMLElement): boolean {
  if (el.hidden) return true;
  if (el.getAttribute("aria-hidden") === "true") return true;
  const style = el.style;
  if (style.display === "none") return true;
  if (style.visibility === "hidden") return true;
  return false;
}

interface CachedGroup {
  element: HTMLElement;
  rect: DOMRect;
}

/**
 * SpatialGraph maintains a cached map of navigable groups and their
 * positions. Invalidated by DOMObserver, rebuilt lazily on next query.
 */
export class SpatialGraph {
  private selectors: Selectors;
  private groups: CachedGroup[] = [];
  private dirty = true;

  constructor(selectors: Selectors) {
    this.selectors = selectors;
  }

  /** Full rebuild: scan DOM and cache all group positions */
  build(scope: HTMLElement): void {
    const elements = Array.from(
      scope.querySelectorAll<HTMLElement>(this.selectors.group),
    );

    this.groups = elements
      .filter((el) => !isHidden(el))
      .map((element) => ({
        element,
        rect: element.getBoundingClientRect(),
      }));

    this.dirty = false;
  }

  /** Mark the graph as needing a rebuild */
  invalidate(): void {
    this.dirty = true;
  }

  /** Returns true if the graph needs rebuilding */
  isDirty(): boolean {
    return this.dirty;
  }

  /** Rebuild if dirty */
  ensureFresh(scope: HTMLElement): void {
    if (this.dirty) {
      this.build(scope);
    }
  }

  /** Get all cached group elements */
  getGroups(): HTMLElement[] {
    return this.groups.map((g) => g.element);
  }

  /** Find the best adjacent group in a direction from a source group */
  findAdjacent(from: HTMLElement, direction: Direction): HTMLElement | null {
    const fromEntry = this.groups.find((g) => g.element === from);
    if (!fromEntry) return null;

    const candidateRects = this.groups.map((g) => g.rect);
    const bestRect = findBestCandidate(fromEntry.rect, candidateRects, direction);
    if (!bestRect) return null;

    const match = this.groups.find((g) => g.rect === bestRect);
    return match?.element ?? null;
  }

  /** Find focusable items within a group */
  getItems(group: HTMLElement): HTMLElement[] {
    return Array.from(
      group.querySelectorAll<HTMLElement>(this.selectors.item),
    ).filter((el) => !isHidden(el));
  }

  /** Check if any element in scope has data-sgn-capture="true" */
  isCaptured(activeElement: Element | null): boolean {
    if (!activeElement) return false;
    return activeElement.closest(this.selectors.capture) !== null;
  }
}
