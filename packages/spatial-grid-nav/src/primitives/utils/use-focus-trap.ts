import { useEffect, useRef } from "react";

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "area[href]",
  "input:not([disabled]):not([type=hidden])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "button:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
  "audio[controls]",
  "video[controls]",
  "[contenteditable]:not([contenteditable=false])",
].join(",");

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    (el) => !el.hasAttribute("disabled") && el.offsetParent !== null,
  );
}

export function useFocusTrap(
  container: HTMLElement | null,
  active: boolean,
) {
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!container || !active) return;

    // Store the element that had focus before the trap
    previousFocusRef.current = document.activeElement as HTMLElement;

    // Focus the first focusable element in the container
    const focusables = getFocusableElements(container);
    if (focusables.length > 0) {
      focusables[0].focus();
    } else {
      // If no focusable elements, focus the container itself
      container.setAttribute("tabindex", "-1");
      container.focus();
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "Tab" || !container) return;

      const focusables = getFocusableElements(container);
      if (focusables.length === 0) {
        event.preventDefault();
        return;
      }

      const active = document.activeElement as HTMLElement;

      // Check if focus is inside the container (not in a portal)
      if (!container.contains(active)) return;

      const first = focusables[0];
      const last = focusables[focusables.length - 1];

      if (event.shiftKey) {
        if (active === first) {
          event.preventDefault();
          last.focus();
        }
      } else {
        if (active === last) {
          event.preventDefault();
          first.focus();
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown, true);

    return () => {
      document.removeEventListener("keydown", handleKeyDown, true);
      // Restore focus to the previously focused element
      previousFocusRef.current?.focus();
    };
  }, [container, active]);
}
