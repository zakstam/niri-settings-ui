import type { Direction, GraphNode, Selectors } from "./types.js";
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
  center: { x: number; y: number };
  sectionId: string | null;
  parentGroup: HTMLElement | null;
}

function getSectionIdForGroup(element: HTMLElement, sectionSelector: string): string | null {
  const section = element.closest<HTMLElement>(sectionSelector);
  return section ? section.getAttribute("data-sgn-section") : null;
}

function containsPoint(point: { x: number; y: number }, rect: DOMRect): boolean {
  return (
    point.x >= rect.left &&
    point.x <= rect.right &&
    point.y >= rect.top &&
    point.y <= rect.bottom
  );
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
    const elements = Array.from(scope.querySelectorAll<HTMLElement>(this.selectors.group));
    this.groups = elements
      .filter((el) => !isHidden(el))
      .map((element) => {
        const rect = element.getBoundingClientRect();
        return {
          element,
          rect,
          center: rectCenter(rect),
          sectionId: getSectionIdForGroup(element, this.selectors.section),
          parentGroup: element.parentElement,
        };
      });
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
    if (this.dirty) this.build(scope);
  }

  /** Get all cached group elements */
  getGroups(): HTMLElement[] {
    return this.groups.map((g) => g.element);
  }

  /** Get full graph nodes for inspection */
  getNodes(): GraphNode[] {
    return this.groups.map((entry) => ({
      element: entry.element,
      rect: entry.rect,
      center: entry.center,
      sectionId: entry.sectionId,
      parentGroup: entry.parentGroup,
    }));
  }

  /** Find the best adjacent group in a direction from a source group */
  findAdjacent(
    from: HTMLElement,
    direction: Direction,
    crossAxisPenalty?: number,
  ): HTMLElement | null {
    let fromEntry = this.groups.find((g) => g.element === from);
    const candidateGroups = this.groups.filter((g) => g.element !== from);

    if (!candidateGroups.length) return null;

    if (!fromEntry) {
      const fallbackRect = from.getBoundingClientRect();
      const point = { x: fallbackRect.left + fallbackRect.width / 2, y: fallbackRect.top + fallbackRect.height / 2 };
      fromEntry = this.groups.find((candidate) => containsPoint(point, candidate.rect));
      if (!fromEntry) return candidateGroups[0]!.element;
    }

    const candidateRects = candidateGroups.map((g) => g.rect);
    const bestRect = findBestCandidate(
      fromEntry.rect,
      candidateRects,
      direction,
      crossAxisPenalty,
    );
    if (!bestRect) return null;

    const matched = candidateGroups.find((g) => g.rect === bestRect);
    if (matched) return matched.element;

    const candidateIdx = candidateRects.indexOf(bestRect);
    const fallbackMatch = candidateGroups[candidateIdx];
    return fallbackMatch?.element ?? null;
  }

  /** Find focusable items within a group */
  getItems(group: HTMLElement): HTMLElement[] {
    return Array.from(group.querySelectorAll<HTMLElement>(this.selectors.item)).filter(
      (el) => !isHidden(el),
    );
  }

  /** Check if any element in scope has data-sgn-capture="true" */
  isCaptured(activeElement: Element | null): boolean {
    if (!activeElement) return false;
    return activeElement.closest(this.selectors.capture) !== null;
  }
}
