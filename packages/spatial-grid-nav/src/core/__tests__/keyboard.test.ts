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
