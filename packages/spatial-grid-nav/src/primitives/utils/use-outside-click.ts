import { useEffect, useRef } from "react";

export function useOutsideClick(
  refs: Array<React.RefObject<HTMLElement | null> | HTMLElement | null>,
  active: boolean,
  handler: (event: MouseEvent) => void,
) {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    if (!active) return;

    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node;

      for (const ref of refs) {
        const el = ref && "current" in ref ? ref.current : ref;
        if (el?.contains(target)) return;
      }

      // Check if target is inside a portal (floating element outside the container)
      // by checking if the target is inside any [data-slot] popup
      const targetEl = target as HTMLElement;
      if (targetEl.closest?.("[data-floating-portal]")) return;

      handlerRef.current(event);
    }

    document.addEventListener("mousedown", handlePointerDown, true);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown, true);
    };
  }, [active, refs]);
}
