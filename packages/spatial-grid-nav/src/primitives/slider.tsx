import * as React from "react";
import { useState, useRef, useCallback, useEffect } from "react";
import { cn } from "./utils/cn.ts";
import { useControllable } from "./utils/use-controllable.ts";

export interface SliderProps
  extends Omit<React.ComponentProps<"div">, "defaultValue" | "onChange"> {
  value?: number[];
  defaultValue?: number[];
  onValueChange?: (value: number[]) => void;
  onValueCommitted?: (value: number[]) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  orientation?: "horizontal" | "vertical";
}

function clampValue(value: number, min: number, max: number, step: number) {
  const clamped = Math.min(max, Math.max(min, value));
  const stepped = Math.round((clamped - min) / step) * step + min;
  return Math.min(max, Math.max(min, stepped));
}

function Slider({
  className,
  value: controlledValue,
  defaultValue,
  onValueChange,
  onValueCommitted,
  min = 0,
  max = 100,
  step = 1,
  disabled = false,
  orientation = "horizontal",
  ...props
}: SliderProps) {
  const initialValue = defaultValue ?? [min];
  const [values, setValues] = useControllable(
    controlledValue,
    initialValue,
    onValueChange,
  );

  const trackRef = useRef<HTMLDivElement>(null);
  const [activeThumb, setActiveThumb] = useState<number | null>(null);

  const getValueFromPosition = useCallback(
    (clientX: number, clientY: number) => {
      const track = trackRef.current;
      if (!track) return min;

      const rect = track.getBoundingClientRect();
      let ratio: number;
      if (orientation === "vertical") {
        ratio = 1 - (clientY - rect.top) / rect.height;
      } else {
        ratio = (clientX - rect.left) / rect.width;
      }
      ratio = Math.max(0, Math.min(1, ratio));
      return clampValue(min + ratio * (max - min), min, max, step);
    },
    [min, max, step, orientation],
  );

  const getPercent = useCallback(
    (value: number) => ((value - min) / (max - min)) * 100,
    [min, max],
  );

  // Drag handling
  useEffect(() => {
    if (activeThumb === null) return;

    function handleMove(e: PointerEvent) {
      const newValue = getValueFromPosition(e.clientX, e.clientY);
      setValues((prev) => {
        const next = [...prev];
        next[activeThumb!] = newValue;
        return next;
      });
    }

    function handleUp(e: PointerEvent) {
      const newValue = getValueFromPosition(e.clientX, e.clientY);
      const finalValues = [...values];
      finalValues[activeThumb!] = newValue;
      onValueCommitted?.(finalValues);
      setActiveThumb(null);
    }

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
    };
  }, [activeThumb, getValueFromPosition, setValues, values, onValueCommitted]);

  // Calculate indicator bounds
  const minPercent = values.length === 1 ? 0 : getPercent(Math.min(...values));
  const maxPercent = getPercent(Math.max(...values));

  const isHorizontal = orientation === "horizontal";

  return (
    <div
      data-slot="slider"
      data-orientation={orientation}
      data-disabled={disabled ? "" : undefined}
      className={cn(
        "data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full",
        className,
      )}
      {...props}
    >
      <div
        className={cn(
          "relative flex w-full touch-none items-center select-none data-[disabled]:opacity-50",
          isHorizontal
            ? "data-[orientation=horizontal]:min-h-5"
            : "data-[orientation=vertical]:min-h-40 data-[orientation=vertical]:w-auto data-[orientation=vertical]:flex-col",
        )}
        data-orientation={orientation}
        data-disabled={disabled ? "" : undefined}
      >
        <div
          ref={trackRef}
          data-slot="slider-track"
          className={cn(
            "bg-muted rounded-full relative grow overflow-hidden select-none",
            isHorizontal ? "h-1 w-full" : "h-full w-1",
          )}
          onPointerDown={(e) => {
            if (disabled) return;
            e.preventDefault();
            const newValue = getValueFromPosition(e.clientX, e.clientY);
            // Find closest thumb
            let closestIdx = 0;
            let closestDist = Infinity;
            values.forEach((v, i) => {
              const dist = Math.abs(v - newValue);
              if (dist < closestDist) {
                closestDist = dist;
                closestIdx = i;
              }
            });
            const next = [...values];
            next[closestIdx] = newValue;
            setValues(next);
            setActiveThumb(closestIdx);
            (e.target as HTMLElement).setPointerCapture(e.pointerId);
          }}
        >
          <div
            data-slot="slider-range"
            className="bg-primary select-none absolute"
            style={
              isHorizontal
                ? {
                    left: `${minPercent}%`,
                    right: `${100 - maxPercent}%`,
                    height: "100%",
                  }
                : {
                    bottom: `${minPercent}%`,
                    top: `${100 - maxPercent}%`,
                    width: "100%",
                  }
            }
          />
        </div>
        {values.map((value, index) => (
          <div
            key={index}
            data-slot="slider-thumb"
            data-sgn-capture="true"
            role="slider"
            aria-valuemin={min}
            aria-valuemax={max}
            aria-valuenow={value}
            aria-orientation={orientation}
            aria-disabled={disabled}
            tabIndex={-1}
            className="border-ring ring-ring/50 relative size-3 rounded-full border bg-white transition-[color,box-shadow] after:absolute after:-inset-2 hover:ring-3 focus-visible:ring-3 focus-visible:outline-hidden active:ring-3 block shrink-0 select-none disabled:pointer-events-none disabled:opacity-50"
            style={{
              position: "absolute",
              ...(isHorizontal
                ? { left: `${getPercent(value)}%`, transform: "translateX(-50%)" }
                : {
                    bottom: `${getPercent(value)}%`,
                    transform: "translateY(50%)",
                  }),
            }}
            onPointerDown={(e) => {
              if (disabled) return;
              e.preventDefault();
              e.stopPropagation();
              setActiveThumb(index);
              (e.target as HTMLElement).setPointerCapture(e.pointerId);
            }}
            onKeyDown={(e) => {
              if (disabled) return;
              let newValue = value;
              switch (e.key) {
                case "ArrowRight":
                case "ArrowUp":
                  newValue = clampValue(value + step, min, max, step);
                  break;
                case "ArrowLeft":
                case "ArrowDown":
                  newValue = clampValue(value - step, min, max, step);
                  break;
                case "Home":
                  newValue = min;
                  break;
                case "End":
                  newValue = max;
                  break;
                case "PageUp":
                  newValue = clampValue(
                    value + step * 10,
                    min,
                    max,
                    step,
                  );
                  break;
                case "PageDown":
                  newValue = clampValue(
                    value - step * 10,
                    min,
                    max,
                    step,
                  );
                  break;
                default:
                  return;
              }
              e.preventDefault();
              const next = [...values];
              next[index] = newValue;
              setValues(next);
            }}
          />
        ))}
      </div>
    </div>
  );
}

export { Slider };
