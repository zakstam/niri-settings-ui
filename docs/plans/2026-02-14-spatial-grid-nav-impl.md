# spatial-grid-nav Engine Rewrite Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Clean rewrite of the `packages/spatial-grid-nav` package as a general-purpose, framework-agnostic spatial navigation library with React bindings and 40+ UI primitives.

**Architecture:** Event-driven `NavigationEngine` class owns a `SpatialGraph` (cached DOM positions), a middleware pipeline (intercept/cancel navigation), and per-section focus stacks (restoration). Framework-agnostic core in pure TypeScript. React bindings as thin bridge. Existing 40+ primitives ported with `data-sgn-capture` support for engine yielding.

**Tech Stack:** TypeScript, tsup (bundler), vitest (testing), React 19, Tailwind CSS 4, @floating-ui/dom

---

## Phase 0: Setup

### Task 1: Install vitest and set up test infrastructure

**Files:**
- Modify: `packages/spatial-grid-nav/package.json`
- Create: `packages/spatial-grid-nav/vitest.config.ts`

**Step 1: Install vitest and jsdom**

Run:
```bash
cd /home/zak/Projects/niri-settings-ui && pnpm add -D vitest jsdom @testing-library/react @testing-library/jest-dom --filter spatial-grid-nav
```

**Step 2: Create vitest config**

Create `packages/spatial-grid-nav/vitest.config.ts`:

```typescript
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
  },
});
```

**Step 3: Add test script to package.json**

In `packages/spatial-grid-nav/package.json`, add to scripts:
```json
"test": "vitest run",
"test:watch": "vitest"
```

**Step 4: Verify vitest runs**

Run: `cd /home/zak/Projects/niri-settings-ui/packages/spatial-grid-nav && pnpm test`
Expected: "No test files found" (no tests yet, but vitest runs)

**Step 5: Commit**

```bash
git add packages/spatial-grid-nav/package.json packages/spatial-grid-nav/vitest.config.ts
git commit -m "chore(spatial-grid-nav): add vitest test infrastructure"
```

---

### Task 2: Scaffold new directory structure

Before writing new code, create the new directory structure alongside the existing code. The old code stays in place until the new engine is ready.

**Files:**
- Create: `packages/spatial-grid-nav/src/core/types.ts`
- Create: `packages/spatial-grid-nav/src/core/spatial.ts`
- Create: `packages/spatial-grid-nav/src/core/graph.ts`
- Create: `packages/spatial-grid-nav/src/core/focus.ts`
- Create: `packages/spatial-grid-nav/src/core/keyboard.ts`
- Create: `packages/spatial-grid-nav/src/core/middleware.ts`
- Create: `packages/spatial-grid-nav/src/core/observer.ts`
- Create: `packages/spatial-grid-nav/src/core/engine.ts`

**Step 1: Create empty core files with placeholder exports**

Create each file with a placeholder comment:

`packages/spatial-grid-nav/src/core/types.ts`:
```typescript
// Core types for spatial-grid-nav engine
// This file will be populated in Task 3
export {};
```

Do the same for each other core file (`spatial.ts`, `graph.ts`, `focus.ts`, `keyboard.ts`, `middleware.ts`, `observer.ts`, `engine.ts`).

**Step 2: Verify the directory structure**

Run: `ls packages/spatial-grid-nav/src/core/`
Expected: All 8 files listed

**Step 3: Commit**

```bash
git add packages/spatial-grid-nav/src/core/
git commit -m "chore(spatial-grid-nav): scaffold new core engine directory structure"
```

---

## Phase 1: Core Types

### Task 3: Define all core types

**Files:**
- Modify: `packages/spatial-grid-nav/src/core/types.ts`

**Step 1: Write the type definitions**

Replace `packages/spatial-grid-nav/src/core/types.ts` with:

```typescript
// ── Directions & Strategies ──

export type Direction = "up" | "down" | "left" | "right";

export type GroupStrategy = "first" | "last" | "next" | "prev";

// ── Selectors ──

export interface Selectors {
  group: string;
  item: string;
  section: string;
  capture: string;
}

export const DEFAULT_SELECTORS: Selectors = {
  group: "[data-sgn-group]",
  item: [
    "a[href]",
    "button:not([disabled])",
    "input:not([disabled]):not([type='hidden'])",
    "select:not([disabled])",
    "textarea:not([disabled])",
    "[tabindex]:not([tabindex='-1'])",
    "[role='button']:not([disabled])",
    "[role='switch']:not([disabled])",
    "[role='checkbox']:not([disabled])",
    "[role='radio']:not([disabled])",
    "[role='slider']:not([disabled])",
    "[role='combobox']:not([disabled])",
    "[role='tab']:not([disabled])",
  ].join(", "),
  section: "[data-sgn-section]",
  capture: "[data-sgn-capture='true']",
};

// ── Key Bindings ──

export interface KeyBindings {
  groupUp: string;
  groupDown: string;
  groupLeft: string;
  groupRight: string;
  groupFirst: string;
  groupLast: string;
  sectionNext: string;
  sectionPrev: string;
}

export const DEFAULT_KEY_BINDINGS: KeyBindings = {
  groupUp: "Alt+ArrowUp",
  groupDown: "Alt+ArrowDown",
  groupLeft: "Alt+ArrowLeft",
  groupRight: "Alt+ArrowRight",
  groupFirst: "Alt+Home",
  groupLast: "Alt+End",
  sectionNext: "Ctrl+ArrowRight",
  sectionPrev: "Ctrl+ArrowLeft",
};

// ── Spatial Graph ──

export interface GraphNode {
  element: HTMLElement;
  rect: DOMRect;
  center: { x: number; y: number };
  sectionId: string | null;
  parentGroup: HTMLElement | null;
}

// ── Navigation Actions & Middleware ──

export interface NavigationEndpoint {
  group: Element | null;
  item: Element | null;
  section: string;
}

export interface NavigationAction {
  type: "navigate" | "enterGroup" | "exitGroup" | "focusGroup" | "sectionChange";
  direction?: Direction;
  from: NavigationEndpoint;
  to: NavigationEndpoint;
  cancelled: boolean;
}

export type Middleware = (action: NavigationAction, next: () => void) => void;

// ── Engine Events ──

export type EngineEventMap = {
  willNavigate: (action: NavigationAction) => void;
  didNavigate: (action: NavigationAction) => void;
  sectionChange: (sectionId: string) => void;
  groupChange: (group: HTMLElement | null) => void;
  focusRestore: (sectionId: string, group: HTMLElement) => void;
};

export type EngineEvent = keyof EngineEventMap;

// ── Focus History ──

export interface FocusHistoryEntry {
  groupElement: Element;
  itemElement: Element | null;
}

// ── Engine Config ──

export interface EngineConfig {
  selectors?: Partial<Selectors>;
  keyBindings?: Partial<KeyBindings>;
  middleware?: Middleware[];
}
```

**Step 2: Verify it compiles**

Run: `cd /home/zak/Projects/niri-settings-ui/packages/spatial-grid-nav && npx tsc --noEmit src/core/types.ts`
Expected: No errors

**Step 3: Commit**

```bash
git add packages/spatial-grid-nav/src/core/types.ts
git commit -m "feat(spatial-grid-nav): define all core types for engine rewrite"
```

---

## Phase 2: Spatial Algorithm & Graph

### Task 4: Implement spatial algorithms

**Files:**
- Modify: `packages/spatial-grid-nav/src/core/spatial.ts`
- Create: `packages/spatial-grid-nav/src/core/__tests__/spatial.test.ts`

**Step 1: Write failing tests**

Create `packages/spatial-grid-nav/src/core/__tests__/spatial.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from "vitest";
import {
  isInDirection,
  scoreCandidates,
  findBestCandidate,
} from "../spatial.js";
import type { Direction } from "../types.js";

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
    // Point at 45 degrees up-right should still count as "up"
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
    // Same primary distance, different cross-axis
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
    const aligned = mockRect(100, 50, 80, 40); // directly above, farther
    const offset = mockRect(400, 150, 80, 40); // slightly above, far right

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
```

**Step 2: Run tests to verify they fail**

Run: `cd /home/zak/Projects/niri-settings-ui/packages/spatial-grid-nav && pnpm test`
Expected: FAIL — module `../spatial.js` has no exports

**Step 3: Implement spatial algorithms**

Replace `packages/spatial-grid-nav/src/core/spatial.ts` with:

```typescript
import type { Direction } from "./types.js";

export interface Point {
  x: number;
  y: number;
}

/**
 * Cross-axis weight factor. Lower = more lenient on cross-axis offset.
 * 0.3 means cross-axis distance counts 30% as much as primary axis distance.
 */
const CROSS_AXIS_WEIGHT = 0.3;

/** Minimum pixel difference to consider a point "in a direction" */
const DIRECTION_THRESHOLD = 1;

/** Calculate center point of a DOMRect */
export function rectCenter(rect: DOMRect): Point {
  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2,
  };
}

/**
 * Check if `candidate` is in the given `direction` from `origin`.
 * Uses a threshold to reject same-position and a wide cone angle.
 */
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

/**
 * Score a candidate relative to an origin in a given direction.
 * Lower score = better candidate. Primary axis weighted more than cross axis.
 */
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

/**
 * Find the best candidate rect in a given direction from a source rect.
 * Returns the candidate DOMRect or null if none found.
 */
export function findBestCandidate(
  from: DOMRect,
  candidates: DOMRect[],
  direction: Direction,
): DOMRect | null {
  const origin = rectCenter(from);

  let bestCandidate: DOMRect | null = null;
  let bestScore = Infinity;

  for (const candidate of candidates) {
    // Skip self
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
```

**Step 4: Run tests to verify they pass**

Run: `cd /home/zak/Projects/niri-settings-ui/packages/spatial-grid-nav && pnpm test`
Expected: All tests PASS

**Step 5: Commit**

```bash
git add packages/spatial-grid-nav/src/core/spatial.ts packages/spatial-grid-nav/src/core/__tests__/spatial.test.ts
git commit -m "feat(spatial-grid-nav): implement spatial algorithms with tests"
```

---

### Task 5: Implement DOM observer for cache invalidation

**Files:**
- Modify: `packages/spatial-grid-nav/src/core/observer.ts`
- Create: `packages/spatial-grid-nav/src/core/__tests__/observer.test.ts`

**Step 1: Write failing tests**

Create `packages/spatial-grid-nav/src/core/__tests__/observer.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { DOMObserver } from "../observer.js";

describe("DOMObserver", () => {
  let root: HTMLDivElement;
  let onInvalidate: ReturnType<typeof vi.fn>;
  let observer: DOMObserver;

  beforeEach(() => {
    root = document.createElement("div");
    document.body.appendChild(root);
    onInvalidate = vi.fn();
    observer = new DOMObserver(root, onInvalidate);
  });

  afterEach(() => {
    observer.disconnect();
    document.body.removeChild(root);
  });

  it("creates without errors", () => {
    expect(observer).toBeDefined();
  });

  it("calls onInvalidate when a child is added", async () => {
    observer.observe();
    const child = document.createElement("div");
    root.appendChild(child);

    // MutationObserver is async, wait for microtask
    await new Promise((r) => setTimeout(r, 0));
    expect(onInvalidate).toHaveBeenCalled();
  });

  it("calls onInvalidate when a child is removed", async () => {
    const child = document.createElement("div");
    root.appendChild(child);
    observer.observe();

    root.removeChild(child);
    await new Promise((r) => setTimeout(r, 0));
    expect(onInvalidate).toHaveBeenCalled();
  });

  it("does not call onInvalidate after disconnect", async () => {
    observer.observe();
    observer.disconnect();

    const child = document.createElement("div");
    root.appendChild(child);
    await new Promise((r) => setTimeout(r, 0));

    expect(onInvalidate).not.toHaveBeenCalled();
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `cd /home/zak/Projects/niri-settings-ui/packages/spatial-grid-nav && pnpm test`
Expected: FAIL

**Step 3: Implement DOMObserver**

Replace `packages/spatial-grid-nav/src/core/observer.ts` with:

```typescript
/**
 * Watches a root element for DOM mutations and resize changes
 * that would invalidate the spatial graph cache.
 */
export class DOMObserver {
  private root: HTMLElement;
  private onInvalidate: () => void;
  private mutationObserver: MutationObserver | null = null;
  private resizeObserver: ResizeObserver | null = null;

  constructor(root: HTMLElement, onInvalidate: () => void) {
    this.root = root;
    this.onInvalidate = onInvalidate;
  }

  observe(): void {
    this.mutationObserver = new MutationObserver(() => {
      this.onInvalidate();
    });

    this.mutationObserver.observe(this.root, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: [
        "data-sgn-group",
        "data-sgn-section",
        "data-sgn-capture",
        "hidden",
        "aria-hidden",
        "disabled",
      ],
    });

    this.resizeObserver = new ResizeObserver(() => {
      this.onInvalidate();
    });

    this.resizeObserver.observe(this.root);
  }

  disconnect(): void {
    this.mutationObserver?.disconnect();
    this.mutationObserver = null;
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
  }
}
```

**Step 4: Run tests to verify they pass**

Run: `cd /home/zak/Projects/niri-settings-ui/packages/spatial-grid-nav && pnpm test`
Expected: All tests PASS

**Step 5: Commit**

```bash
git add packages/spatial-grid-nav/src/core/observer.ts packages/spatial-grid-nav/src/core/__tests__/observer.test.ts
git commit -m "feat(spatial-grid-nav): implement DOMObserver for cache invalidation"
```

---

### Task 6: Implement SpatialGraph

**Files:**
- Modify: `packages/spatial-grid-nav/src/core/graph.ts`
- Create: `packages/spatial-grid-nav/src/core/__tests__/graph.test.ts`

**Step 1: Write failing tests**

Create `packages/spatial-grid-nav/src/core/__tests__/graph.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { SpatialGraph } from "../graph.js";
import { DEFAULT_SELECTORS } from "../types.js";

describe("SpatialGraph", () => {
  let root: HTMLDivElement;
  let graph: SpatialGraph;

  function addGroup(id: string, x: number, y: number, w = 100, h = 40): HTMLDivElement {
    const group = document.createElement("div");
    group.setAttribute("data-sgn-group", "");
    group.setAttribute("data-testid", id);
    // jsdom doesn't support layout, so we mock getBoundingClientRect
    group.getBoundingClientRect = () => ({
      x, y, width: w, height: h,
      top: y, left: x, right: x + w, bottom: y + h,
      toJSON() { return this; },
    } as DOMRect);
    root.appendChild(group);
    return group;
  }

  beforeEach(() => {
    root = document.createElement("div");
    document.body.appendChild(root);
    graph = new SpatialGraph(DEFAULT_SELECTORS);
  });

  afterEach(() => {
    document.body.removeChild(root);
  });

  it("builds an empty graph for an empty root", () => {
    graph.build(root);
    expect(graph.getGroups()).toEqual([]);
  });

  it("discovers groups within root", () => {
    addGroup("a", 0, 0);
    addGroup("b", 0, 100);
    graph.build(root);
    expect(graph.getGroups()).toHaveLength(2);
  });

  it("marks graph as dirty after invalidate()", () => {
    graph.build(root);
    expect(graph.isDirty()).toBe(false);
    graph.invalidate();
    expect(graph.isDirty()).toBe(true);
  });

  it("rebuilds lazily on ensureFresh()", () => {
    addGroup("a", 0, 0);
    graph.build(root);
    expect(graph.getGroups()).toHaveLength(1);

    addGroup("b", 0, 100);
    graph.invalidate();
    graph.ensureFresh(root);
    expect(graph.getGroups()).toHaveLength(2);
  });

  it("finds adjacent group in a direction", () => {
    const top = addGroup("top", 50, 0);
    const bottom = addGroup("bottom", 50, 100);
    graph.build(root);

    const result = graph.findAdjacent(top, "down");
    expect(result).toBe(bottom);
  });

  it("returns null when no adjacent group in direction", () => {
    const only = addGroup("only", 50, 50);
    graph.build(root);

    const result = graph.findAdjacent(only, "up");
    expect(result).toBeNull();
  });

  it("filters hidden groups", () => {
    const visible = addGroup("visible", 0, 0);
    const hidden = addGroup("hidden", 0, 100);
    hidden.setAttribute("aria-hidden", "true");
    graph.build(root);
    expect(graph.getGroups()).toHaveLength(1);
    expect(graph.getGroups()[0]).toBe(visible);
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `cd /home/zak/Projects/niri-settings-ui/packages/spatial-grid-nav && pnpm test`
Expected: FAIL

**Step 3: Implement SpatialGraph**

Replace `packages/spatial-grid-nav/src/core/graph.ts` with:

```typescript
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
```

**Step 4: Run tests to verify they pass**

Run: `cd /home/zak/Projects/niri-settings-ui/packages/spatial-grid-nav && pnpm test`
Expected: All tests PASS

**Step 5: Commit**

```bash
git add packages/spatial-grid-nav/src/core/graph.ts packages/spatial-grid-nav/src/core/__tests__/graph.test.ts
git commit -m "feat(spatial-grid-nav): implement SpatialGraph with caching and lazy rebuild"
```

---

## Phase 3: Keyboard, Focus, Middleware

### Task 7: Implement keyboard binding resolution

**Files:**
- Modify: `packages/spatial-grid-nav/src/core/keyboard.ts`
- Create: `packages/spatial-grid-nav/src/core/__tests__/keyboard.test.ts`

**Step 1: Write failing tests**

Create `packages/spatial-grid-nav/src/core/__tests__/keyboard.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { parseBinding, matchesBinding, resolveAction } from "../keyboard.js";
import { DEFAULT_KEY_BINDINGS } from "../types.js";

describe("parseBinding", () => {
  it("parses a simple key", () => {
    expect(parseBinding("Tab")).toEqual({
      ctrl: false, alt: false, shift: false, meta: false, key: "Tab",
    });
  });

  it("parses modifier + key", () => {
    expect(parseBinding("Alt+ArrowUp")).toEqual({
      ctrl: false, alt: true, shift: false, meta: false, key: "ArrowUp",
    });
  });

  it("parses multiple modifiers", () => {
    expect(parseBinding("Ctrl+Shift+Enter")).toEqual({
      ctrl: true, alt: false, shift: true, meta: false, key: "Enter",
    });
  });
});

describe("matchesBinding", () => {
  it("matches a simple key event", () => {
    const event = new KeyboardEvent("keydown", { key: "Tab" });
    expect(matchesBinding(event, "Tab")).toBe(true);
  });

  it("matches modifier + key", () => {
    const event = new KeyboardEvent("keydown", { key: "ArrowUp", altKey: true });
    expect(matchesBinding(event, "Alt+ArrowUp")).toBe(true);
  });

  it("rejects when modifier is missing", () => {
    const event = new KeyboardEvent("keydown", { key: "ArrowUp" });
    expect(matchesBinding(event, "Alt+ArrowUp")).toBe(false);
  });

  it("rejects when extra modifier is present", () => {
    const event = new KeyboardEvent("keydown", { key: "ArrowUp", altKey: true, ctrlKey: true });
    expect(matchesBinding(event, "Alt+ArrowUp")).toBe(false);
  });
});

describe("resolveAction", () => {
  it("resolves Alt+ArrowUp to groupDirection up", () => {
    const event = new KeyboardEvent("keydown", { key: "ArrowUp", altKey: true });
    const action = resolveAction(event, DEFAULT_KEY_BINDINGS);
    expect(action).toEqual({ type: "groupDirection", direction: "up" });
  });

  it("resolves Ctrl+ArrowRight to sectionNav next", () => {
    const event = new KeyboardEvent("keydown", { key: "ArrowRight", ctrlKey: true });
    const action = resolveAction(event, DEFAULT_KEY_BINDINGS);
    expect(action).toEqual({ type: "sectionNav", direction: "next" });
  });

  it("resolves Tab to tab action", () => {
    const event = new KeyboardEvent("keydown", { key: "Tab" });
    const action = resolveAction(event, DEFAULT_KEY_BINDINGS);
    expect(action).toEqual({ type: "tab", forward: true });
  });

  it("resolves Shift+Tab to tab backward", () => {
    const event = new KeyboardEvent("keydown", { key: "Tab", shiftKey: true });
    const action = resolveAction(event, DEFAULT_KEY_BINDINGS);
    expect(action).toEqual({ type: "tab", forward: false });
  });

  it("resolves Escape to escape action", () => {
    const event = new KeyboardEvent("keydown", { key: "Escape" });
    const action = resolveAction(event, DEFAULT_KEY_BINDINGS);
    expect(action).toEqual({ type: "escape" });
  });

  it("returns null for unbound keys", () => {
    const event = new KeyboardEvent("keydown", { key: "a" });
    const action = resolveAction(event, DEFAULT_KEY_BINDINGS);
    expect(action).toBeNull();
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `cd /home/zak/Projects/niri-settings-ui/packages/spatial-grid-nav && pnpm test`
Expected: FAIL

**Step 3: Implement keyboard handling**

Replace `packages/spatial-grid-nav/src/core/keyboard.ts` with:

```typescript
import type { KeyBindings, Direction } from "./types.js";

interface ParsedBinding {
  ctrl: boolean;
  alt: boolean;
  shift: boolean;
  meta: boolean;
  key: string;
}

export type KeyAction =
  | { type: "groupDirection"; direction: Direction }
  | { type: "groupStrategy"; strategy: "first" | "last" }
  | { type: "sectionNav"; direction: "next" | "prev" }
  | { type: "tab"; forward: boolean }
  | { type: "escape" };

export function parseBinding(binding: string): ParsedBinding {
  const parts = binding.split("+");
  const key = parts.pop()!;
  const modifiers = new Set(parts.map((p) => p.toLowerCase()));

  return {
    ctrl: modifiers.has("ctrl"),
    alt: modifiers.has("alt"),
    shift: modifiers.has("shift"),
    meta: modifiers.has("meta"),
    key,
  };
}

export function matchesBinding(
  event: KeyboardEvent,
  binding: string,
): boolean {
  const parsed = parseBinding(binding);

  return (
    event.key === parsed.key &&
    event.ctrlKey === parsed.ctrl &&
    event.altKey === parsed.alt &&
    event.shiftKey === parsed.shift &&
    event.metaKey === parsed.meta
  );
}

export function resolveAction(
  event: KeyboardEvent,
  bindings: KeyBindings,
): KeyAction | null {
  // Tab / Shift+Tab (hardcoded, not configurable)
  if (event.key === "Tab" && !event.ctrlKey && !event.altKey && !event.metaKey) {
    return { type: "tab", forward: !event.shiftKey };
  }

  // Escape (hardcoded)
  if (event.key === "Escape" && !event.ctrlKey && !event.altKey && !event.shiftKey && !event.metaKey) {
    return { type: "escape" };
  }

  // Group direction
  if (matchesBinding(event, bindings.groupUp))
    return { type: "groupDirection", direction: "up" };
  if (matchesBinding(event, bindings.groupDown))
    return { type: "groupDirection", direction: "down" };
  if (matchesBinding(event, bindings.groupLeft))
    return { type: "groupDirection", direction: "left" };
  if (matchesBinding(event, bindings.groupRight))
    return { type: "groupDirection", direction: "right" };

  // Group strategy
  if (matchesBinding(event, bindings.groupFirst))
    return { type: "groupStrategy", strategy: "first" };
  if (matchesBinding(event, bindings.groupLast))
    return { type: "groupStrategy", strategy: "last" };

  // Section nav
  if (matchesBinding(event, bindings.sectionNext))
    return { type: "sectionNav", direction: "next" };
  if (matchesBinding(event, bindings.sectionPrev))
    return { type: "sectionNav", direction: "prev" };

  return null;
}
```

**Step 4: Run tests to verify they pass**

Run: `cd /home/zak/Projects/niri-settings-ui/packages/spatial-grid-nav && pnpm test`
Expected: All tests PASS

**Step 5: Commit**

```bash
git add packages/spatial-grid-nav/src/core/keyboard.ts packages/spatial-grid-nav/src/core/__tests__/keyboard.test.ts
git commit -m "feat(spatial-grid-nav): implement keyboard binding parser and action resolver"
```

---

### Task 8: Implement middleware pipeline

**Files:**
- Modify: `packages/spatial-grid-nav/src/core/middleware.ts`
- Create: `packages/spatial-grid-nav/src/core/__tests__/middleware.test.ts`

**Step 1: Write failing tests**

Create `packages/spatial-grid-nav/src/core/__tests__/middleware.test.ts`:

```typescript
import { describe, it, expect, vi } from "vitest";
import { runMiddleware } from "../middleware.js";
import type { NavigationAction, Middleware } from "../types.js";

function makeAction(type: NavigationAction["type"] = "navigate"): NavigationAction {
  return {
    type,
    from: { group: null, item: null, section: "" },
    to: { group: null, item: null, section: "" },
    cancelled: false,
  };
}

describe("runMiddleware", () => {
  it("calls middleware in order", () => {
    const order: number[] = [];

    const mw1: Middleware = (_action, next) => { order.push(1); next(); };
    const mw2: Middleware = (_action, next) => { order.push(2); next(); };
    const mw3: Middleware = (_action, next) => { order.push(3); next(); };

    const action = makeAction();
    runMiddleware(action, [mw1, mw2, mw3]);

    expect(order).toEqual([1, 2, 3]);
  });

  it("stops chain when middleware does not call next", () => {
    const order: number[] = [];

    const mw1: Middleware = (_action, next) => { order.push(1); next(); };
    const mw2: Middleware = () => { order.push(2); /* no next() */ };
    const mw3: Middleware = (_action, next) => { order.push(3); next(); };

    const action = makeAction();
    runMiddleware(action, [mw1, mw2, mw3]);

    expect(order).toEqual([1, 2]);
  });

  it("allows middleware to cancel the action", () => {
    const canceller: Middleware = (action) => {
      action.cancelled = true;
    };

    const action = makeAction();
    runMiddleware(action, [canceller]);

    expect(action.cancelled).toBe(true);
  });

  it("returns the action unchanged when no middleware", () => {
    const action = makeAction();
    runMiddleware(action, []);
    expect(action.cancelled).toBe(false);
  });

  it("allows middleware to modify the action", () => {
    const modifier: Middleware = (action, next) => {
      action.to.section = "modified";
      next();
    };

    const action = makeAction();
    runMiddleware(action, [modifier]);
    expect(action.to.section).toBe("modified");
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `cd /home/zak/Projects/niri-settings-ui/packages/spatial-grid-nav && pnpm test`
Expected: FAIL

**Step 3: Implement middleware runner**

Replace `packages/spatial-grid-nav/src/core/middleware.ts` with:

```typescript
import type { NavigationAction, Middleware } from "./types.js";

/**
 * Run a navigation action through a middleware pipeline.
 * Each middleware receives the action and a `next` function.
 * If a middleware doesn't call `next()`, the remaining middleware
 * and the final action are skipped.
 */
export function runMiddleware(
  action: NavigationAction,
  middleware: Middleware[],
): void {
  let index = 0;

  function next(): void {
    if (action.cancelled) return;
    if (index >= middleware.length) return;

    const mw = middleware[index]!;
    index++;
    mw(action, next);
  }

  next();
}
```

**Step 4: Run tests to verify they pass**

Run: `cd /home/zak/Projects/niri-settings-ui/packages/spatial-grid-nav && pnpm test`
Expected: All tests PASS

**Step 5: Commit**

```bash
git add packages/spatial-grid-nav/src/core/middleware.ts packages/spatial-grid-nav/src/core/__tests__/middleware.test.ts
git commit -m "feat(spatial-grid-nav): implement middleware pipeline"
```

---

### Task 9: Implement focus management with focus stacks

**Files:**
- Modify: `packages/spatial-grid-nav/src/core/focus.ts`
- Create: `packages/spatial-grid-nav/src/core/__tests__/focus.test.ts`

**Step 1: Write failing tests**

Create `packages/spatial-grid-nav/src/core/__tests__/focus.test.ts`:

```typescript
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { FocusManager } from "../focus.js";
import { DEFAULT_SELECTORS } from "../types.js";

describe("FocusManager", () => {
  let root: HTMLDivElement;
  let fm: FocusManager;

  function addGroup(id: string): HTMLDivElement {
    const group = document.createElement("div");
    group.setAttribute("data-sgn-group", "");
    group.setAttribute("data-testid", id);
    group.tabIndex = 0;
    root.appendChild(group);
    return group;
  }

  function addItem(parent: HTMLElement, tag = "button"): HTMLElement {
    const item = document.createElement(tag);
    parent.appendChild(item);
    return item;
  }

  beforeEach(() => {
    root = document.createElement("div");
    document.body.appendChild(root);
    fm = new FocusManager(DEFAULT_SELECTORS);
  });

  afterEach(() => {
    document.body.removeChild(root);
  });

  it("sets and gets active group", () => {
    const group = addGroup("a");
    fm.setActiveGroup(group);
    expect(fm.getActiveGroup()).toBe(group);
  });

  it("clears active group", () => {
    const group = addGroup("a");
    fm.setActiveGroup(group);
    fm.clearActiveGroup();
    expect(fm.getActiveGroup()).toBeNull();
  });

  it("sets data-sgn-active on active group", () => {
    const group = addGroup("a");
    fm.setActiveGroup(group);
    expect(group.hasAttribute("data-sgn-active")).toBe(true);
  });

  it("removes data-sgn-active from previous group", () => {
    const a = addGroup("a");
    const b = addGroup("b");
    fm.setActiveGroup(a);
    fm.setActiveGroup(b);
    expect(a.hasAttribute("data-sgn-active")).toBe(false);
    expect(b.hasAttribute("data-sgn-active")).toBe(true);
  });

  it("saves focus history for a section", () => {
    const group = addGroup("a");
    const item = addItem(group);
    fm.saveFocusHistory("section-1", group, item);
    const entry = fm.getFocusHistory("section-1");
    expect(entry?.groupElement).toBe(group);
    expect(entry?.itemElement).toBe(item);
  });

  it("returns null for sections with no history", () => {
    expect(fm.getFocusHistory("unknown")).toBeNull();
  });

  it("returns items within a group", () => {
    const group = addGroup("a");
    const btn1 = addItem(group);
    const btn2 = addItem(group);
    const items = fm.getItems(group);
    expect(items).toContain(btn1);
    expect(items).toContain(btn2);
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `cd /home/zak/Projects/niri-settings-ui/packages/spatial-grid-nav && pnpm test`
Expected: FAIL

**Step 3: Implement FocusManager**

Replace `packages/spatial-grid-nav/src/core/focus.ts` with:

```typescript
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
```

**Step 4: Run tests to verify they pass**

Run: `cd /home/zak/Projects/niri-settings-ui/packages/spatial-grid-nav && pnpm test`
Expected: All tests PASS

**Step 5: Commit**

```bash
git add packages/spatial-grid-nav/src/core/focus.ts packages/spatial-grid-nav/src/core/__tests__/focus.test.ts
git commit -m "feat(spatial-grid-nav): implement FocusManager with focus stacks"
```

---

## Phase 4: NavigationEngine

### Task 10: Implement NavigationEngine

This is the central class that ties all subsystems together.

**Files:**
- Modify: `packages/spatial-grid-nav/src/core/engine.ts`
- Create: `packages/spatial-grid-nav/src/core/__tests__/engine.test.ts`

**Step 1: Write failing tests**

Create `packages/spatial-grid-nav/src/core/__tests__/engine.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NavigationEngine } from "../engine.js";

describe("NavigationEngine", () => {
  let root: HTMLDivElement;

  function addSection(id: string): HTMLDivElement {
    const section = document.createElement("div");
    section.setAttribute("data-sgn-section", id);
    root.appendChild(section);
    return section;
  }

  function addGroup(parent: HTMLElement, id: string, x = 0, y = 0): HTMLDivElement {
    const group = document.createElement("div");
    group.setAttribute("data-sgn-group", "");
    group.setAttribute("data-testid", id);
    group.tabIndex = 0;
    group.getBoundingClientRect = () => ({
      x, y, width: 100, height: 40,
      top: y, left: x, right: x + 100, bottom: y + 40,
      toJSON() { return this; },
    } as DOMRect);
    parent.appendChild(group);
    return group;
  }

  function addButton(parent: HTMLElement, label = "btn"): HTMLButtonElement {
    const btn = document.createElement("button");
    btn.textContent = label;
    parent.appendChild(btn);
    return btn;
  }

  beforeEach(() => {
    root = document.createElement("div");
    document.body.appendChild(root);
  });

  afterEach(() => {
    document.body.removeChild(root);
  });

  it("creates and attaches without errors", () => {
    const engine = new NavigationEngine(root);
    engine.attach();
    engine.detach();
  });

  it("navigates between groups", () => {
    const section = addSection("s1");
    const top = addGroup(section, "top", 0, 0);
    const bottom = addGroup(section, "bottom", 0, 100);
    addButton(top, "a");
    addButton(bottom, "b");

    const engine = new NavigationEngine(root);
    engine.attach();
    engine.setActiveSection("s1");

    engine.focusGroup("first");
    expect(engine.getActiveGroup()).toBe(top);

    engine.navigate("down");
    expect(engine.getActiveGroup()).toBe(bottom);

    engine.detach();
  });

  it("emits groupChange event", () => {
    const section = addSection("s1");
    const group = addGroup(section, "g1");
    addButton(group);

    const engine = new NavigationEngine(root);
    const handler = vi.fn();
    engine.on("groupChange", handler);
    engine.attach();
    engine.setActiveSection("s1");
    engine.focusGroup("first");

    expect(handler).toHaveBeenCalledWith(group);
    engine.detach();
  });

  it("runs middleware before navigation", () => {
    const section = addSection("s1");
    const top = addGroup(section, "top", 0, 0);
    const bottom = addGroup(section, "bottom", 0, 100);
    addButton(top);
    addButton(bottom);

    const blocker = vi.fn((action, _next) => {
      action.cancelled = true;
      // intentionally not calling next
    });

    const engine = new NavigationEngine(root, { middleware: [blocker] });
    engine.attach();
    engine.setActiveSection("s1");
    engine.focusGroup("first");

    // Try to navigate down - should be blocked
    engine.navigate("down");
    expect(engine.getActiveGroup()).toBe(top); // didn't move
    expect(blocker).toHaveBeenCalled();
    engine.detach();
  });

  it("saves and restores focus history on section change", () => {
    const s1 = addSection("s1");
    const s2 = addSection("s2");
    const g1 = addGroup(s1, "g1", 0, 0);
    const g2 = addGroup(s1, "g2", 0, 100);
    const g3 = addGroup(s2, "g3", 0, 0);
    addButton(g1);
    addButton(g2);
    addButton(g3);

    const engine = new NavigationEngine(root);
    engine.attach();

    // Focus g2 in s1
    engine.setActiveSection("s1");
    engine.focusGroup("first");
    engine.navigate("down"); // now on g2

    // Switch to s2
    engine.setActiveSection("s2");
    engine.focusGroup("first");
    expect(engine.getActiveGroup()).toBe(g3);

    // Switch back to s1 — should restore to g2
    engine.restoreFocus("s1");
    expect(engine.getActiveGroup()).toBe(g2);

    engine.detach();
  });

  it("destroys cleanly", () => {
    const engine = new NavigationEngine(root);
    engine.attach();
    engine.destroy();
    // Should not throw on subsequent calls
    expect(() => engine.detach()).not.toThrow();
  });

  it("subscribes and unsubscribes from events", () => {
    const engine = new NavigationEngine(root);
    const handler = vi.fn();
    const unsub = engine.on("groupChange", handler);

    engine.attach();
    addSection("s1");
    const g = addGroup(root.querySelector("[data-sgn-section]")!, "g1");
    addButton(g);
    engine.setActiveSection("s1");
    engine.focusGroup("first");
    expect(handler).toHaveBeenCalled();

    handler.mockClear();
    unsub();
    engine.focusGroup("first");
    expect(handler).not.toHaveBeenCalled();
    engine.detach();
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `cd /home/zak/Projects/niri-settings-ui/packages/spatial-grid-nav && pnpm test`
Expected: FAIL

**Step 3: Implement NavigationEngine**

Replace `packages/spatial-grid-nav/src/core/engine.ts` with:

```typescript
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
  DEFAULT_SELECTORS,
  DEFAULT_KEY_BINDINGS,
} from "./types.js";
import {
  DEFAULT_SELECTORS as SELECTORS,
  DEFAULT_KEY_BINDINGS as BINDINGS,
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
    groupChange: new Set(),
    focusRestore: new Set(),
  };

  private handleKeyDown: (e: KeyboardEvent) => void;
  private handleFocusIn: (e: FocusEvent) => void;

  constructor(root: HTMLElement, config: EngineConfig = {}) {
    this.root = root;
    this.selectors = { ...SELECTORS, ...config.selectors };
    this.keyBindings = { ...BINDINGS, ...config.keyBindings };
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
        `${this.selectors.section}[data-sgn-section="${this.activeSection}"], [data-sgn-section="${this.activeSection}"]`,
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
        this.emit(
          "willNavigate",
          this.makeAction("sectionChange", null),
        );
        // Section nav is emitted as an event for the app to handle
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
```

**Step 4: Run tests to verify they pass**

Run: `cd /home/zak/Projects/niri-settings-ui/packages/spatial-grid-nav && pnpm test`
Expected: All tests PASS

**Step 5: Commit**

```bash
git add packages/spatial-grid-nav/src/core/engine.ts packages/spatial-grid-nav/src/core/__tests__/engine.test.ts
git commit -m "feat(spatial-grid-nav): implement NavigationEngine with all subsystems"
```

---

### Task 11: Wire up core exports and verify build

**Files:**
- Modify: `packages/spatial-grid-nav/src/index.ts`

**Step 1: Update the main index export**

Replace `packages/spatial-grid-nav/src/index.ts` with:

```typescript
export { NavigationEngine } from "./core/engine.js";
export { SpatialGraph } from "./core/graph.js";
export { FocusManager } from "./core/focus.js";
export { DOMObserver } from "./core/observer.js";
export { runMiddleware } from "./core/middleware.js";
export { parseBinding, matchesBinding, resolveAction } from "./core/keyboard.js";
export type { KeyAction } from "./core/keyboard.js";
export {
  DEFAULT_SELECTORS,
  DEFAULT_KEY_BINDINGS,
} from "./core/types.js";
export type {
  Direction,
  GroupStrategy,
  Selectors,
  KeyBindings,
  GraphNode,
  NavigationAction,
  NavigationEndpoint,
  Middleware,
  EngineEvent,
  EngineEventMap,
  EngineConfig,
  FocusHistoryEntry,
} from "./core/types.js";
```

**Step 2: Verify the build**

Run: `cd /home/zak/Projects/niri-settings-ui/packages/spatial-grid-nav && pnpm build`
Expected: Build succeeds. Check that `dist/index.js` and `dist/index.d.ts` are generated.

**Step 3: Run all tests one more time**

Run: `cd /home/zak/Projects/niri-settings-ui/packages/spatial-grid-nav && pnpm test`
Expected: All tests PASS

**Step 4: Commit**

```bash
git add packages/spatial-grid-nav/src/index.ts
git commit -m "feat(spatial-grid-nav): wire up core exports"
```

---

## Phase 5: React Bindings

### Task 12: Implement React provider, hooks, and NavigationGroup

**Files:**
- Modify: `packages/spatial-grid-nav/src/react/provider.tsx` (or create new)
- Modify: `packages/spatial-grid-nav/src/react/hooks.ts` (or create new)
- Modify: `packages/spatial-grid-nav/src/react/group.tsx` (or create new)
- Modify: `packages/spatial-grid-nav/src/react/index.ts`

Note: The existing React files use the old engine API. Replace them entirely.

**Step 1: Create the React context**

The existing `context.ts` is tiny — replace it or merge into provider. Create the new files:

`packages/spatial-grid-nav/src/react/context.ts`:
```typescript
import { createContext } from "react";
import type { NavigationEngine } from "../core/engine.js";

export const NavigationContext = createContext<NavigationEngine | null>(null);
```

**Step 2: Implement NavigationProvider**

Replace `packages/spatial-grid-nav/src/react/provider.tsx` with:

```typescript
import {
  useEffect,
  useRef,
  type ReactNode,
  type MutableRefObject,
} from "react";
import { NavigationEngine } from "../core/engine.js";
import type { EngineConfig } from "../core/types.js";
import { NavigationContext } from "./context.js";

export interface NavigationProviderProps {
  children: ReactNode;
  config?: EngineConfig;
  engineRef?: MutableRefObject<NavigationEngine | null>;
  onSectionNav?: (direction: "next" | "prev") => void;
  onActiveGroupChange?: (group: HTMLElement | null) => void;
}

export function NavigationProvider({
  children,
  config,
  engineRef,
  onSectionNav,
  onActiveGroupChange,
}: NavigationProviderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const engineInstance = useRef<NavigationEngine | null>(null);

  // Store callbacks in refs to avoid resubscribing
  const onSectionNavRef = useRef(onSectionNav);
  onSectionNavRef.current = onSectionNav;
  const onActiveGroupChangeRef = useRef(onActiveGroupChange);
  onActiveGroupChangeRef.current = onActiveGroupChange;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const engine = new NavigationEngine(container, config);
    engineInstance.current = engine;

    if (engineRef) {
      engineRef.current = engine;
    }

    // Subscribe to section nav events (Ctrl+Arrow)
    engine.on("willNavigate", (action) => {
      if (action.type === "sectionChange") {
        // The engine emits this for the app to handle
        // We need to listen for the actual keyboard event direction
      }
    });

    engine.on("groupChange", (group) => {
      onActiveGroupChangeRef.current?.(group);
    });

    engine.attach();

    return () => {
      engine.destroy();
      engineInstance.current = null;
      if (engineRef) {
        engineRef.current = null;
      }
    };
  }, []); // Engine lives for the lifetime of the provider

  return (
    <NavigationContext.Provider value={engineInstance.current}>
      <div ref={containerRef} style={{ display: "contents" }}>
        {children}
      </div>
    </NavigationContext.Provider>
  );
}
```

**Step 3: Implement hooks**

Replace `packages/spatial-grid-nav/src/react/hooks.ts` with:

```typescript
import { useContext, useCallback, useEffect, useSyncExternalStore } from "react";
import type { NavigationEngine } from "../core/engine.js";
import type { EngineEvent, EngineEventMap } from "../core/types.js";
import { NavigationContext } from "./context.js";

/** Get the NavigationEngine from context */
export function useNavigation(): NavigationEngine | null {
  return useContext(NavigationContext);
}

/** Subscribe to whether a ref's element is the active group */
export function useIsActiveGroup(
  elementRef: React.RefObject<HTMLElement | null>,
): boolean {
  const engine = useNavigation();

  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      if (!engine) return () => {};
      return engine.on("groupChange", onStoreChange);
    },
    [engine],
  );

  const getSnapshot = useCallback(() => {
    if (!engine || !elementRef.current) return false;
    return engine.getActiveGroup() === elementRef.current;
  }, [engine, elementRef]);

  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}

/** Subscribe to a specific engine event with auto-cleanup */
export function useNavigationEvent<E extends EngineEvent>(
  event: E,
  handler: EngineEventMap[E],
): void {
  const engine = useNavigation();
  const handlerRef = { current: handler };
  handlerRef.current = handler;

  useEffect(() => {
    if (!engine) return;
    // Wrap to always use latest handler ref
    const wrapper = ((...args: any[]) => {
      (handlerRef.current as any)(...args);
    }) as EngineEventMap[E];
    return engine.on(event, wrapper);
  }, [engine, event]);
}

/** Auto-save/restore focus when a section mounts/unmounts */
export function useFocusRestoration(sectionId: string): void {
  const engine = useNavigation();

  useEffect(() => {
    if (!engine) return;

    // On mount: restore focus if there's history
    engine.restoreFocus(sectionId);

    // On unmount: focus is auto-saved by the engine's setActiveSection
    return () => {
      // Nothing needed — engine saves on section change
    };
  }, [engine, sectionId]);
}
```

**Step 4: Implement NavigationGroup**

Replace `packages/spatial-grid-nav/src/react/group.tsx` with:

```typescript
import { forwardRef, useRef } from "react";
import { useIsActiveGroup } from "./hooks.js";

export interface NavigationGroupProps
  extends React.ComponentPropsWithRef<"div"> {
  label?: string;
}

export const NavigationGroup = forwardRef<HTMLDivElement, NavigationGroupProps>(
  function NavigationGroup({ label, children, className, ...props }, ref) {
    const localRef = useRef<HTMLDivElement>(null);
    const resolvedRef = (ref ?? localRef) as React.RefObject<HTMLDivElement>;
    const isActive = useIsActiveGroup(resolvedRef);

    return (
      <div
        ref={resolvedRef}
        data-sgn-group=""
        tabIndex={-1}
        role={label ? "region" : undefined}
        aria-label={label}
        data-sgn-active={isActive ? "" : undefined}
        className={className}
        {...props}
      >
        {children}
      </div>
    );
  },
);
```

**Step 5: Update React index exports**

Replace `packages/spatial-grid-nav/src/react/index.ts` with:

```typescript
export { NavigationProvider, type NavigationProviderProps } from "./provider.js";
export { NavigationGroup, type NavigationGroupProps } from "./group.js";
export {
  useNavigation,
  useIsActiveGroup,
  useNavigationEvent,
  useFocusRestoration,
} from "./hooks.js";
export { NavigationContext } from "./context.js";
```

**Step 6: Verify build**

Run: `cd /home/zak/Projects/niri-settings-ui/packages/spatial-grid-nav && pnpm build`
Expected: Build succeeds with `dist/react.js` and `dist/react.d.ts`

**Step 7: Commit**

```bash
git add packages/spatial-grid-nav/src/react/
git commit -m "feat(spatial-grid-nav): implement React bindings (provider, hooks, NavigationGroup)"
```

---

## Phase 6: Port Primitives & Layouts

### Task 13: Port utility hooks

The utility hooks (`useControllable`, `useFocusTrap`, `useScrollLock`, `useOutsideClick`, `useTypeahead`, `useAnchorPosition`, `cn`) are infrastructure that all primitives depend on. These are largely unchanged from the existing code.

**Files:**
- Keep existing: `packages/spatial-grid-nav/src/primitives/hooks/` (all files)
- Keep existing: `packages/spatial-grid-nav/src/primitives/utils.ts`

**Step 1: Verify existing utility hooks compile with new core**

The utility hooks don't import from the core engine, so they should work as-is.

Run: `cd /home/zak/Projects/niri-settings-ui/packages/spatial-grid-nav && pnpm build`
Expected: Build succeeds

**Step 2: Commit (if any changes were needed)**

```bash
git add -A packages/spatial-grid-nav/src/primitives/hooks/ packages/spatial-grid-nav/src/primitives/utils.ts
git commit -m "chore(spatial-grid-nav): verify utility hooks work with new engine"
```

---

### Task 14: Add `data-sgn-capture` support to interactive primitives

The key change for primitives: components that need their own arrow key handling (Slider, Select, Combobox) must set `data-sgn-capture="true"` when active so the engine yields control.

**Files to modify:**
- `packages/spatial-grid-nav/src/primitives/slider.tsx`
- `packages/spatial-grid-nav/src/primitives/select.tsx`
- `packages/spatial-grid-nav/src/primitives/combobox.tsx`
- `packages/spatial-grid-nav/src/primitives/dropdown-menu.tsx`

**Step 1: Add `data-sgn-capture` to Slider**

In `slider.tsx`, find the root element of the Slider component. Add `data-sgn-capture="true"` when the slider has focus:

```tsx
// In the Slider component, add to the root element:
data-sgn-capture={isFocused ? "true" : undefined}
```

If the slider doesn't track focus state, add a simple `onFocus`/`onBlur` pair:

```tsx
const [isFocused, setIsFocused] = useState(false);

// On the input/range element:
onFocus={(e) => { setIsFocused(true); props.onFocus?.(e); }}
onBlur={(e) => { setIsFocused(false); props.onBlur?.(e); }}
data-sgn-capture={isFocused ? "true" : undefined}
```

**Step 2: Add `data-sgn-capture` to Select**

In `select.tsx`, on the `SelectContent` component (the dropdown), add:

```tsx
// SelectContent already tracks `open` state
data-sgn-capture={open ? "true" : undefined}
```

**Step 3: Add `data-sgn-capture` to Combobox**

In `combobox.tsx`, on the root/input element:

```tsx
data-sgn-capture={open ? "true" : undefined}
```

**Step 4: Add `data-sgn-capture` to DropdownMenu**

In `dropdown-menu.tsx`, on the content element:

```tsx
data-sgn-capture={open ? "true" : undefined}
```

**Step 5: Verify build**

Run: `cd /home/zak/Projects/niri-settings-ui/packages/spatial-grid-nav && pnpm build`
Expected: Build succeeds

**Step 6: Commit**

```bash
git add packages/spatial-grid-nav/src/primitives/
git commit -m "feat(spatial-grid-nav): add data-sgn-capture to interactive primitives"
```

---

### Task 15: Port layout presets

**Files:**
- Modify: `packages/spatial-grid-nav/src/layouts/settings-group.tsx` — update import path for `NavigationGroup`
- Modify: `packages/spatial-grid-nav/src/layouts/index.ts` — verify exports

**Step 1: Verify layout imports point to new React bindings**

The layouts import `NavigationGroup` from the React module. Verify the import path is correct:

```typescript
import { NavigationGroup } from "../react/index.js";
```

If the existing code imports from a different path, update it.

**Step 2: Verify build**

Run: `cd /home/zak/Projects/niri-settings-ui/packages/spatial-grid-nav && pnpm build`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add packages/spatial-grid-nav/src/layouts/
git commit -m "chore(spatial-grid-nav): verify layouts work with new engine"
```

---

## Phase 7: Remove Old Engine & Final Integration

### Task 16: Remove old engine code

**Files to delete:**
- `packages/spatial-grid-nav/src/core/discovery.ts` (replaced by `SpatialGraph`)
- Any other old core files that were replaced

**Step 1: Identify old files**

Check which files in `src/core/` are from the old engine and no longer imported:

Run: `ls packages/spatial-grid-nav/src/core/`

Remove any files not in the new architecture: `types.ts`, `spatial.ts`, `graph.ts`, `focus.ts`, `keyboard.ts`, `middleware.ts`, `observer.ts`, `engine.ts`.

The old file `discovery.ts` should be removed.

**Step 2: Delete old files**

```bash
rm packages/spatial-grid-nav/src/core/discovery.ts
```

(Adjust based on what actually exists)

**Step 3: Verify build still passes**

Run: `cd /home/zak/Projects/niri-settings-ui/packages/spatial-grid-nav && pnpm build`
Expected: Build succeeds

**Step 4: Run all tests**

Run: `cd /home/zak/Projects/niri-settings-ui/packages/spatial-grid-nav && pnpm test`
Expected: All tests PASS

**Step 5: Commit**

```bash
git add -A packages/spatial-grid-nav/
git commit -m "chore(spatial-grid-nav): remove old engine code"
```

---

### Task 17: Verify full package build and test suite

**Step 1: Clean build**

```bash
cd /home/zak/Projects/niri-settings-ui/packages/spatial-grid-nav
rm -rf dist
pnpm build
```
Expected: Build succeeds. `dist/` contains `index.js`, `react.js`, `primitives.js`, `layouts.js` with corresponding `.d.ts` files.

**Step 2: Run full test suite**

```bash
pnpm test
```
Expected: All tests PASS

**Step 3: Verify the main app still builds**

```bash
cd /home/zak/Projects/niri-settings-ui && pnpm build
```
Expected: If there are import errors, note them — they'll be fixed in Task 18.

**Step 4: Commit if any fixes were needed**

```bash
git add -A
git commit -m "chore(spatial-grid-nav): verify full build and test suite"
```

---

### Task 18: Update app imports for new engine API

The main app (`src/App.tsx` and settings components) uses the old engine API. Update to the new one.

**Files to check and update:**
- `src/App.tsx` — NavigationProvider usage, engineRef, section switching
- `src/components/layout/sidebar.tsx` — if it uses engine
- Any settings component that imports from `spatial-grid-nav` directly

**Step 1: Update App.tsx**

The key API changes:
- Old: `engine.setActiveSection(sectionElement)` (takes Element)
- New: `engine.setActiveSection(sectionId)` (takes string ID)
- Old: `engine.focusGroupByStrategy("first")`
- New: `engine.focusGroup("first")`
- Old: `engine.on("sectionNav", handler)`
- New: The engine emits `willNavigate` with `type: "sectionChange"` — listen via NavigationProvider callback or `engine.on("willNavigate", ...)`

Update these call sites in `src/App.tsx`. The NavigationProvider props should largely work as-is since we maintained API compatibility.

**Step 2: Verify the app builds**

```bash
cd /home/zak/Projects/niri-settings-ui && pnpm build
```
Expected: Build succeeds

**Step 3: Verify the app runs**

```bash
cd /home/zak/Projects/niri-settings-ui && pnpm tauri dev
```
Expected: App launches and keyboard navigation works

**Step 4: Commit**

```bash
git add src/
git commit -m "feat: update app to use new spatial-grid-nav engine API"
```
