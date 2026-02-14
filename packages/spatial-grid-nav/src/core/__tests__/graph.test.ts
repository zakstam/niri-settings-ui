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
