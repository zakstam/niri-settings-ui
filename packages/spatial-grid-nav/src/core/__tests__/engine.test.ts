import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NavigationEngine } from "../engine.js";

// jsdom does not provide ResizeObserver, so we stub it
if (typeof globalThis.ResizeObserver === "undefined") {
  globalThis.ResizeObserver = class ResizeObserver {
    private cb: ResizeObserverCallback;
    constructor(cb: ResizeObserverCallback) {
      this.cb = cb;
    }
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

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
      // Only block navigate actions, let focusGroup through
      if (action.type === "navigate") {
        action.cancelled = true;
        // intentionally not calling next
      } else {
        _next();
      }
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
