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
  | { type: "itemCycle"; forward: boolean }
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
  // Plain arrows cycle items within a group (filtered by orientation in engine)
  if (
    (event.key === "ArrowDown" || event.key === "ArrowUp" ||
     event.key === "ArrowLeft" || event.key === "ArrowRight") &&
    !event.ctrlKey &&
    !event.altKey &&
    !event.shiftKey &&
    !event.metaKey
  ) {
    const forward = event.key === "ArrowDown" || event.key === "ArrowRight";
    return { type: "itemCycle", forward };
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
