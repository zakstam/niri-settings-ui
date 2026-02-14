import { describe, it, expect } from "vitest";
import {
  isInDirection,
  scoreCandidates,
  findBestCandidate,
} from "../spatial.js";

// Helper to create a mock rect
function mockRect(
  x: number,
  y: number,
  w: number,
  h: number,
): DOMRect {
  return {
    x,
    y,
    width: w,
    height: h,
    top: y,
    left: x,
    right: x + w,
    bottom: y + h,
    toJSON() {
      return this;
    },
  } as DOMRect;
}

describe("isInDirection", () => {
  const origin = { x: 100, y: 100 };

  it("returns true for a point directly above", () => {
    expect(isInDirection(origin, { x: 100, y: 50 }, "up")).toBe(true);
  });

  it("returns true for a point directly below", () => {
    expect(isInDirection(origin, { x: 100, y: 150 }, "down")).toBe(true);
  });

  it("returns true for a point directly left", () => {
    expect(isInDirection(origin, { x: 50, y: 100 }, "left")).toBe(true);
  });

  it("returns true for a point directly right", () => {
    expect(isInDirection(origin, { x: 150, y: 100 }, "right")).toBe(true);
  });

  it("returns false for a point in the wrong direction", () => {
    expect(isInDirection(origin, { x: 100, y: 150 }, "up")).toBe(false);
  });

  it("returns false for same position", () => {
    expect(isInDirection(origin, { x: 100, y: 100 }, "up")).toBe(false);
  });

  it("accepts diagonal candidates within cone angle", () => {
    expect(isInDirection(origin, { x: 130, y: 50 }, "up")).toBe(true);
  });
});

describe("scoreCandidates", () => {
  it("scores closer candidates lower (better)", () => {
    const origin = { x: 100, y: 100 };
    const close = { x: 120, y: 50 };
    const far = { x: 200, y: 10 };

    const closeScore = scoreCandidates(origin, close, "up");
    const farScore = scoreCandidates(origin, far, "up");

    expect(closeScore).toBeLessThan(farScore);
  });

  it("weights primary axis more than secondary axis", () => {
    const origin = { x: 100, y: 100 };
    const aligned = { x: 100, y: 50 };
    const offset = { x: 200, y: 50 };

    const alignedScore = scoreCandidates(origin, aligned, "up");
    const offsetScore = scoreCandidates(origin, offset, "up");

    expect(alignedScore).toBeLessThan(offsetScore);
  });
});

describe("findBestCandidate", () => {
  it("returns the nearest group in the given direction", () => {
    const from = mockRect(100, 100, 80, 40);
    const near = mockRect(100, 20, 80, 40);
    const far = mockRect(100, 0, 80, 10);

    const result = findBestCandidate(from, [near, far], "up");
    expect(result).toBe(near);
  });

  it("returns null when no candidates in direction", () => {
    const from = mockRect(100, 100, 80, 40);
    const below = mockRect(100, 200, 80, 40);

    const result = findBestCandidate(from, [below], "up");
    expect(result).toBeNull();
  });

  it("prefers aligned candidates over closer but offset ones", () => {
    const from = mockRect(100, 200, 80, 40);
    const aligned = mockRect(100, 50, 80, 40);
    const offset = mockRect(400, 150, 80, 40);

    const result = findBestCandidate(from, [aligned, offset], "up");
    expect(result).toBe(aligned);
  });

  it("ignores the 'from' rect if it appears in candidates", () => {
    const from = mockRect(100, 100, 80, 40);
    const above = mockRect(100, 20, 80, 40);

    const result = findBestCandidate(from, [from, above], "up");
    expect(result).toBe(above);
  });
});
