import { useEffect } from "react";

export function useScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return;

    const body = document.body;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    const originalOverflow = body.style.overflow;
    const originalPaddingRight = body.style.paddingRight;

    body.style.overflow = "hidden";
    if (scrollbarWidth > 0) {
      body.style.paddingRight = `${scrollbarWidth}px`;
    }

    return () => {
      body.style.overflow = originalOverflow;
      body.style.paddingRight = originalPaddingRight;
    };
  }, [active]);
}
