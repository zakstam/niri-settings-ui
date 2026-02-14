import * as React from "react";
import { useRef, useState, useEffect, useCallback } from "react";
import { cn } from "./utils/cn.ts";

export interface ScrollAreaProps extends React.ComponentProps<"div"> {
  orientation?: "vertical" | "horizontal" | "both";
}

function ScrollArea({
  className,
  children,
  orientation = "vertical",
  ...props
}: ScrollAreaProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [showVertical, setShowVertical] = useState(false);
  const [showHorizontal, setShowHorizontal] = useState(false);
  const [verticalThumb, setVerticalThumb] = useState({ top: 0, height: 0 });
  const [horizontalThumb, setHorizontalThumb] = useState({
    left: 0,
    width: 0,
  });

  const updateScrollbars = useCallback(() => {
    const el = viewportRef.current;
    if (!el) return;

    const hasVertical = el.scrollHeight > el.clientHeight;
    const hasHorizontal = el.scrollWidth > el.clientWidth;

    setShowVertical(hasVertical && orientation !== "horizontal");
    setShowHorizontal(hasHorizontal && orientation !== "vertical");

    if (hasVertical) {
      const ratio = el.clientHeight / el.scrollHeight;
      const thumbHeight = Math.max(ratio * el.clientHeight, 20);
      const scrollRatio =
        el.scrollTop / (el.scrollHeight - el.clientHeight);
      const maxTop = el.clientHeight - thumbHeight;
      setVerticalThumb({
        top: scrollRatio * maxTop,
        height: thumbHeight,
      });
    }

    if (hasHorizontal) {
      const ratio = el.clientWidth / el.scrollWidth;
      const thumbWidth = Math.max(ratio * el.clientWidth, 20);
      const scrollRatio =
        el.scrollLeft / (el.scrollWidth - el.clientWidth);
      const maxLeft = el.clientWidth - thumbWidth;
      setHorizontalThumb({
        left: scrollRatio * maxLeft,
        width: thumbWidth,
      });
    }
  }, [orientation]);

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;

    updateScrollbars();

    el.addEventListener("scroll", updateScrollbars, { passive: true });
    const observer = new ResizeObserver(updateScrollbars);
    observer.observe(el);
    // Also observe the scroll content
    if (el.firstElementChild) {
      observer.observe(el.firstElementChild);
    }

    return () => {
      el.removeEventListener("scroll", updateScrollbars);
      observer.disconnect();
    };
  }, [updateScrollbars]);

  return (
    <div
      data-slot="scroll-area"
      className={cn("relative", className)}
      {...props}
    >
      <div
        ref={viewportRef}
        data-slot="scroll-area-viewport"
        tabIndex={-1}
        className="size-full rounded-[inherit] overflow-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {children}
      </div>
      {showVertical && (
        <ScrollBar
          orientation="vertical"
          thumbPosition={verticalThumb.top}
          thumbSize={verticalThumb.height}
          viewportRef={viewportRef}
        />
      )}
      {showHorizontal && (
        <ScrollBar
          orientation="horizontal"
          thumbPosition={horizontalThumb.left}
          thumbSize={horizontalThumb.width}
          viewportRef={viewportRef}
        />
      )}
    </div>
  );
}

interface ScrollBarProps extends React.ComponentProps<"div"> {
  orientation?: "vertical" | "horizontal";
  thumbPosition?: number;
  thumbSize?: number;
  viewportRef?: React.RefObject<HTMLDivElement | null>;
}

function ScrollBar({
  className,
  orientation = "vertical",
  thumbPosition = 0,
  thumbSize = 0,
  viewportRef,
  ...props
}: ScrollBarProps) {
  const isVertical = orientation === "vertical";
  const trackRef = useRef<HTMLDivElement>(null);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      const track = trackRef.current;
      const viewport = viewportRef?.current;
      if (!track || !viewport) return;

      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      const rect = track.getBoundingClientRect();
      const startPos = isVertical ? e.clientY : e.clientX;
      const startScroll = isVertical ? viewport.scrollTop : viewport.scrollLeft;

      function onMove(ev: PointerEvent) {
        const delta = (isVertical ? ev.clientY : ev.clientX) - startPos;
        const trackSize = isVertical ? rect.height : rect.width;
        const contentSize = isVertical
          ? viewport!.scrollHeight
          : viewport!.scrollWidth;
        const viewportSize = isVertical
          ? viewport!.clientHeight
          : viewport!.clientWidth;
        const scrollDelta = (delta / trackSize) * (contentSize - viewportSize);
        if (isVertical) {
          viewport!.scrollTop = startScroll + scrollDelta;
        } else {
          viewport!.scrollLeft = startScroll + scrollDelta;
        }
      }

      function onUp() {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
      }

      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
    },
    [isVertical, viewportRef],
  );

  return (
    <div
      ref={trackRef}
      data-slot="scroll-area-scrollbar"
      data-orientation={orientation}
      className={cn(
        "absolute touch-none p-px transition-colors select-none",
        isVertical
          ? "h-full w-2.5 border-l border-l-transparent right-0 top-0 flex"
          : "h-2.5 w-full border-t border-t-transparent bottom-0 left-0 flex flex-col",
        className,
      )}
      {...props}
    >
      <div
        data-slot="scroll-area-thumb"
        className="rounded-full bg-border relative flex-none cursor-pointer"
        style={
          isVertical
            ? { height: thumbSize, transform: `translateY(${thumbPosition}px)`, width: "100%" }
            : { width: thumbSize, transform: `translateX(${thumbPosition}px)`, height: "100%" }
        }
        onPointerDown={handlePointerDown}
      />
    </div>
  );
}

export { ScrollArea, ScrollBar };
