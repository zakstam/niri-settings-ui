import type { NavigationAction, Middleware } from "./types.js";

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
