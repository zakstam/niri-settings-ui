import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { DOMObserver } from "../observer.js";

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
