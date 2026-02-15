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

  it("sets and moves active item marker", () => {
    const group = addGroup("a");
    const firstItem = addItem(group);
    const secondItem = addItem(group);

    fm.setActiveGroup(group);
    fm.enterGroup(group);

    expect(fm.getActiveItem()).toBe(firstItem);
    expect(firstItem.hasAttribute("data-sgn-active-item")).toBe(true);

    fm.cycleItem(group, true);
    expect(fm.getActiveItem()).toBe(secondItem);
    expect(firstItem.hasAttribute("data-sgn-active-item")).toBe(false);
    expect(secondItem.hasAttribute("data-sgn-active-item")).toBe(true);
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
