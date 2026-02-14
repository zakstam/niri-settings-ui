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
    const mw2: Middleware = () => { order.push(2); };
    const mw3: Middleware = (_action, next) => { order.push(3); next(); };
    const action = makeAction();
    runMiddleware(action, [mw1, mw2, mw3]);
    expect(order).toEqual([1, 2]);
  });

  it("allows middleware to cancel the action", () => {
    const canceller: Middleware = (action) => { action.cancelled = true; };
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
    const modifier: Middleware = (action, next) => { action.to.section = "modified"; next(); };
    const action = makeAction();
    runMiddleware(action, [modifier]);
    expect(action.to.section).toBe("modified");
  });
});
