import type { Direction } from "./types.js";

export interface Point {
  x: number;
  y: number;
}

const CROSS_AXIS_WEIGHT = 0.4;
const DIRECTION_THRESHOLD = 1;

export function rectCenter(rect: DOMRect): Point {
  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2,
  };
}

export function isInDirection(
  origin: Point,
  candidate: Point,
  direction: Direction,
): boolean {
  const dx = candidate.x - origin.x;
  const dy = candidate.y - origin.y;

  switch (direction) {
    case "up":
      return dy < -DIRECTION_THRESHOLD;
    case "down":
      return dy > DIRECTION_THRESHOLD;
    case "left":
      return dx < -DIRECTION_THRESHOLD;
    case "right":
      return dx > DIRECTION_THRESHOLD;
  }
}

export function scoreCandidates(
  origin: Point,
  candidate: Point,
  direction: Direction,
): number {
  const dx = Math.abs(candidate.x - origin.x);
  const dy = Math.abs(candidate.y - origin.y);

  switch (direction) {
    case "up":
    case "down":
      return dy + dx * CROSS_AXIS_WEIGHT;
    case "left":
    case "right":
      return dx + dy * CROSS_AXIS_WEIGHT;
  }
}

export function findBestCandidate(
  from: DOMRect,
  candidates: DOMRect[],
  direction: Direction,
): DOMRect | null {
  const origin = rectCenter(from);

  let bestCandidate: DOMRect | null = null;
  let bestScore = Infinity;

  for (const candidate of candidates) {
    if (candidate === from) continue;

    const center = rectCenter(candidate);

    if (!isInDirection(origin, center, direction)) continue;

    const score = scoreCandidates(origin, center, direction);
    if (score < bestScore) {
      bestScore = score;
      bestCandidate = candidate;
    }
  }

  return bestCandidate;
}

// ── Legacy helpers (used by focus.ts / index.ts until they are refactored) ──

export function nextIndex(
  currentIndex: number,
  total: number,
  direction: 1 | -1,
): number {
  if (total === 0) return -1;
  if (currentIndex < 0) return direction === 1 ? 0 : total - 1;
  if (direction === 1) return Math.min(total - 1, currentIndex + 1);
  return Math.max(0, currentIndex - 1);
}

export function findAdjacentGroup(
  currentGroup: HTMLElement,
  groups: HTMLElement[],
  direction: Direction,
): HTMLElement | null {
  const currentRect = currentGroup.getBoundingClientRect();
  const rects = groups.map((g) => g.getBoundingClientRect());
  const bestRect = findBestCandidate(currentRect, rects, direction);
  if (!bestRect) return null;
  const idx = rects.indexOf(bestRect);
  return idx >= 0 ? groups[idx] : null;
}
