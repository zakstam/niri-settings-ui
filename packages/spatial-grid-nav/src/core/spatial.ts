import type { Direction } from "./types.js";

export interface Point {
  x: number;
  y: number;
}

const CROSS_AXIS_WEIGHT = 0.45;
const DIRECTION_THRESHOLD = 1;
const OVERLAP_PRIORITY_THRESHOLD = 0.15;

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
      return dy <= -DIRECTION_THRESHOLD;
    case "down":
      return dy >= DIRECTION_THRESHOLD;
    case "left":
      return dx <= -DIRECTION_THRESHOLD;
    case "right":
      return dx >= DIRECTION_THRESHOLD;
  }
}

function directionalOverlap(from: DOMRect, candidate: DOMRect, direction: Direction): number {
  if (direction === "left" || direction === "right") {
    const overlap = Math.max(
      0,
      Math.min(from.bottom, candidate.bottom) - Math.max(from.top, candidate.top),
    );
    const span = Math.max(from.height, candidate.height);
    return span > 0 ? overlap / span : 0;
  }

  const overlap = Math.max(
    0,
    Math.min(from.right, candidate.right) - Math.max(from.left, candidate.left),
  );
  const span = Math.max(from.width, candidate.width);
  return span > 0 ? overlap / span : 0;
}

export function scoreCandidates(
  origin: Point,
  candidate: Point,
  direction: Direction,
  crossAxisPenalty = CROSS_AXIS_WEIGHT,
): number {
  const dx = Math.abs(candidate.x - origin.x);
  const dy = Math.abs(candidate.y - origin.y);

  switch (direction) {
    case "up":
    case "down":
      return dy + dx * crossAxisPenalty;
    case "left":
    case "right":
      return dx + dy * crossAxisPenalty;
  }
}

export function findBestCandidate(
  from: DOMRect,
  candidates: DOMRect[],
  direction: Direction,
  crossAxisPenalty = CROSS_AXIS_WEIGHT,
): DOMRect | null {
  const origin = rectCenter(from);

  let alignedCandidate: DOMRect | null = null;
  let alignedScore = Infinity;
  let alignedOverlap = -1;
  let alignedIndex = Number.MAX_SAFE_INTEGER;
  let idx = 0;

  for (const candidate of candidates) {
    if (candidate === from) {
      idx++;
      continue;
    }

    const center = rectCenter(candidate);

    if (!isInDirection(origin, center, direction)) continue;

    const score = scoreCandidates(origin, center, direction, crossAxisPenalty);
    const overlap = directionalOverlap(from, candidate, direction);

    const isAligned = overlap >= OVERLAP_PRIORITY_THRESHOLD;
    if (
      isAligned &&
      (
        score < alignedScore ||
        (score === alignedScore && overlap > alignedOverlap) ||
        (score === alignedScore &&
          overlap === alignedOverlap &&
          idx < alignedIndex)
      )
    ) {
      alignedScore = score;
      alignedCandidate = candidate;
      alignedOverlap = overlap;
      alignedIndex = idx;
    }
    idx++;
  }

  return alignedCandidate ?? null;
}
