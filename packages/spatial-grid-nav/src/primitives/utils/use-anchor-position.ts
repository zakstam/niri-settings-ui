import { useRef, useEffect, useState, useCallback } from "react";
import {
  computePosition,
  flip,
  shift,
  offset,
  size,
  type Placement,
  type Side,
  type Alignment,
} from "@floating-ui/dom";

export type { Side, Alignment, Placement };

export interface UseAnchorPositionOptions {
  anchor: HTMLElement | null;
  floating: HTMLElement | null;
  side?: Side;
  align?: Alignment | "center";
  sideOffset?: number;
  alignOffset?: number;
  open?: boolean;
}

export interface AnchorPositionResult {
  x: number;
  y: number;
  placement: Placement;
  availableHeight: number;
  anchorWidth: number;
}

function toPlacement(side: Side, align: Alignment | "center"): Placement {
  if (align === "center") return side;
  return `${side}-${align}` as Placement;
}

export function useAnchorPosition(
  options: UseAnchorPositionOptions,
): AnchorPositionResult {
  const {
    anchor,
    floating,
    side = "bottom",
    align = "center",
    sideOffset = 0,
    alignOffset = 0,
    open = true,
  } = options;

  const [result, setResult] = useState<AnchorPositionResult>({
    x: 0,
    y: 0,
    placement: toPlacement(side, align),
    availableHeight: 300,
    anchorWidth: 0,
  });

  const cleanupRef = useRef<(() => void) | null>(null);

  const update = useCallback(() => {
    if (!anchor || !floating || !open) return;

    const placement = toPlacement(side, align);

    computePosition(anchor, floating, {
      placement,
      middleware: [
        offset({ mainAxis: sideOffset, crossAxis: alignOffset }),
        flip({ padding: 8 }),
        shift({ padding: 8 }),
        size({
          padding: 8,
          apply({ availableHeight }) {
            Object.assign(floating.style, {
              maxHeight: `${availableHeight}px`,
            });
          },
        }),
      ],
    }).then(({ x, y, placement: finalPlacement }) => {
      setResult({
        x,
        y,
        placement: finalPlacement,
        availableHeight: window.innerHeight - y - 8,
        anchorWidth: anchor.offsetWidth,
      });
    });
  }, [anchor, floating, side, align, sideOffset, alignOffset, open]);

  useEffect(() => {
    if (!anchor || !floating || !open) return;

    update();

    // Update on scroll/resize
    const handleUpdate = () => update();
    window.addEventListener("scroll", handleUpdate, true);
    window.addEventListener("resize", handleUpdate);

    return () => {
      window.removeEventListener("scroll", handleUpdate, true);
      window.removeEventListener("resize", handleUpdate);
      cleanupRef.current?.();
      cleanupRef.current = null;
    };
  }, [anchor, floating, open, update]);

  return result;
}
