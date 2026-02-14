import { useEffect, useMemo, useRef, useState } from "react";
import { useConfig } from "@/lib/config-context";
import { Card, CardContent, CardHeader, CardTitle, Badge, Switch } from "spatial-grid-nav/primitives";
import type { OutputConfig } from "@/lib/types";
import { IconArrowsMove } from "@tabler/icons-react";

const DEFAULT_NODE_WIDTH = 1280;
const DEFAULT_NODE_HEIGHT = 720;
const CANVAS_PADDING = 24;
const DEFAULT_NODE_GAP = 16;
const MAX_SCALE = 1;
const SNAP_DISTANCE = 12;
const MAX_OVERLAP_RESOLVE_ITERATIONS = 6;

interface ResolvedOutput {
  output: OutputConfig;
  index: number;
  displayX: number;
  displayY: number;
  width: number;
  height: number;
}

interface CanvasTransform {
  minX: number;
  minY: number;
  scale: number;
  offsetX: number;
  offsetY: number;
}

interface DragState {
  index: number;
  pointerId: number;
  startPointerX: number;
  startPointerY: number;
  startX: number;
  startY: number;
  baseMinX: number;
  baseMinY: number;
  baseScale: number;
  baseOffsetX: number;
  baseOffsetY: number;
}

interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

const MODE_RE = /^\s*(\d+)\s*x\s*(\d+)\b/;

function clampScale(value: number | null): number {
  if (value === null || !Number.isFinite(value) || value <= 0) return 1;
  return value;
}

function parseModeDimensions(mode: string | null): { width: number; height: number } | null {
  if (!mode) return null;
  const match = mode.match(MODE_RE);
  if (!match) return null;
  const width = Number.parseInt(match[1], 10);
  const height = Number.parseInt(match[2], 10);
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    return null;
  }
  return { width, height };
}

function isPortraitTransform(transform: string | null): boolean {
  if (transform === null) return false;
  return transform === "90" || transform === "270" || transform === "flipped-90" || transform === "flipped-270";
}

function getLogicalDisplaySize(output: OutputConfig): { width: number; height: number } {
  const base = parseModeDimensions(output.mode) ?? {
    width: DEFAULT_NODE_WIDTH,
    height: DEFAULT_NODE_HEIGHT,
  };
  const scale = clampScale(output.scale);
  const logicalWidth = base.width / scale;
  const logicalHeight = base.height / scale;
  if (isPortraitTransform(output.transform)) {
    return {
      width: logicalHeight,
      height: logicalWidth,
    };
  }
  return {
    width: logicalWidth,
    height: logicalHeight,
  };
}

function rangesOverlap(aStart: number, aLength: number, bStart: number, bLength: number): boolean {
  return aStart < bStart + bLength && aStart + aLength > bStart;
}

function rectsOverlap(a: Rect, b: Rect): boolean {
  return rangesOverlap(a.x, a.width, b.x, b.width) && rangesOverlap(a.y, a.height, b.y, b.height);
}

function resolveSnappedPosition(
  candidate: Rect,
  others: Rect[],
  snapDistance: number,
): Rect {
  let nextX = candidate.x;
  let nextY = candidate.y;
  let bestXDistance = Number.POSITIVE_INFINITY;
  let bestYDistance = Number.POSITIVE_INFINITY;

  for (const other of others) {
    const otherLeft = other.x;
    const otherRight = other.x + other.width;
    const otherTop = other.y;
    const otherBottom = other.y + other.height;

    const xCandidates = [
      { value: otherLeft, distance: Math.abs(candidate.x - otherLeft) },
      { value: otherRight, distance: Math.abs(candidate.x - otherRight) },
      { value: otherLeft - candidate.width, distance: Math.abs(candidate.x + candidate.width - otherLeft) },
      {
        value: otherRight - candidate.width,
        distance: Math.abs(candidate.x + candidate.width - otherRight),
      },
    ];

    const yCandidates = [
      { value: otherTop, distance: Math.abs(candidate.y - otherTop) },
      { value: otherBottom, distance: Math.abs(candidate.y - otherBottom) },
      { value: otherTop - candidate.height, distance: Math.abs(candidate.y + candidate.height - otherTop) },
      {
        value: otherBottom - candidate.height,
        distance: Math.abs(candidate.y + candidate.height - otherBottom),
      },
    ];

    for (const item of xCandidates) {
      if (item.distance < bestXDistance && item.distance <= snapDistance) {
        bestXDistance = item.distance;
        nextX = item.value;
      }
    }

    for (const item of yCandidates) {
      if (item.distance < bestYDistance && item.distance <= snapDistance) {
        bestYDistance = item.distance;
        nextY = item.value;
      }
    }
  }

  return { ...candidate, x: nextX, y: nextY };
}

function resolveNoOverlap(candidate: Rect, others: Rect[]): Rect {
  let x = candidate.x;
  let y = candidate.y;

  for (let i = 0; i < MAX_OVERLAP_RESOLVE_ITERATIONS; i++) {
    let changed = false;
    const active: Rect = {
      x,
      y,
      width: candidate.width,
      height: candidate.height,
    };

    for (const other of others) {
      if (!rectsOverlap(active, other)) continue;

      const moveLeft = (other.x - candidate.width) - active.x;
      const moveRight = (other.x + other.width) - active.x;
      const moveTop = (other.y - candidate.height) - active.y;
      const moveBottom = (other.y + other.height) - active.y;

      const bestX = Math.abs(moveLeft) <= Math.abs(moveRight) ? moveLeft : moveRight;
      const bestY = Math.abs(moveTop) <= Math.abs(moveBottom) ? moveTop : moveBottom;

      if (Math.abs(bestX) <= Math.abs(bestY)) {
        x += bestX;
      } else {
        y += bestY;
      }

      changed = true;
    }

    if (!changed) break;
  }

  return { ...candidate, x, y };
}

function resolveOutputPositions(outputs: OutputConfig[]): ResolvedOutput[] {
  let cursorX = 0;
  return outputs.map((output, index) => {
    const { width, height } = getLogicalDisplaySize(output);
    const displayX = index === 0 ? 0 : output.positionX ?? cursorX;
    const displayY = index === 0 ? 0 : output.positionY ?? 0;
    cursorX = Math.max(cursorX, displayX + width + DEFAULT_NODE_GAP);

    return {
      output,
      index,
      displayX,
      displayY,
      width,
      height,
    };
  });
}

function resolveCanvasTransform(
  outputs: ResolvedOutput[],
  canvasWidth: number,
  canvasHeight: number,
): CanvasTransform {
  if (outputs.length === 0) {
    return {
      minX: 0,
      minY: 0,
      scale: 1,
      offsetX: 0,
      offsetY: 0,
    };
  }

  const valuesX = outputs.map((output) => output.displayX);
  const valuesY = outputs.map((output) => output.displayY);
  const valuesX2 = outputs.map((output) => output.displayX + output.width);
  const valuesY2 = outputs.map((output) => output.displayY + output.height);

  const minX = Math.min(...valuesX);
  const maxX = Math.max(...valuesX2);
  const minY = Math.min(...valuesY);
  const maxY = Math.max(...valuesY2);

  const worldWidth = Math.max(1, maxX - minX);
  const worldHeight = Math.max(1, maxY - minY);
  const availableWidth = Math.max(220, canvasWidth - CANVAS_PADDING * 2);
  const availableHeight = Math.max(140, canvasHeight - CANVAS_PADDING * 2);
  const scale = Math.min(MAX_SCALE, availableWidth / worldWidth, availableHeight / worldHeight);
  const contentWidth = worldWidth * scale;
  const contentHeight = worldHeight * scale;
  const offsetX = (availableWidth - contentWidth) / 2;
  const offsetY = (availableHeight - contentHeight) / 2;

  return {
    minX,
    minY,
    scale,
    offsetX: Math.max(0, offsetX),
    offsetY: Math.max(0, offsetY),
  };
}

function formatCoordinate(value: number | null): string {
  if (value === null) return "auto";
  return value.toString();
}

export function OutputLayoutGraph() {
  const { config, updateConfig } = useConfig();
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [snappingEnabled, setSnappingEnabled] = useState(true);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [canvasWidth, setCanvasWidth] = useState(720);
  const [canvasHeight, setCanvasHeight] = useState(300);

  const outputs = config?.outputs ?? [];
  const resolvedOutputs = useMemo(() => resolveOutputPositions(outputs), [outputs]);
  const { minX, minY, scale, offsetX, offsetY } = useMemo(
    () => resolveCanvasTransform(resolvedOutputs, canvasWidth, canvasHeight),
    [resolvedOutputs, canvasWidth, canvasHeight],
  );

  useEffect(() => {
    const node = canvasRef.current;
    if (!node) return;

    const updateCanvasSize = () => {
      setCanvasWidth(node.clientWidth);
      setCanvasHeight(node.clientHeight);
    };

    updateCanvasSize();
    const observer = new ResizeObserver(updateCanvasSize);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!dragState) return;

    const handlePointerMove = (event: PointerEvent) => {
      if (event.pointerId !== dragState.pointerId) return;
      const draggingOutput = resolvedOutputs.find((output) => output.index === dragState.index);
      if (!draggingOutput) return;

      const rawX =
        dragState.startX + (event.clientX - dragState.startPointerX) / dragState.baseScale;
      const rawY =
        dragState.startY + (event.clientY - dragState.startPointerY) / dragState.baseScale;

      const others = resolvedOutputs
        .filter((output) => output.index !== dragState.index)
        .map((output) => ({
          x: output.displayX,
          y: output.displayY,
          width: output.width,
          height: output.height,
        }));

      const isPrimary = dragState.index === 0;
      const candidate = {
        x: isPrimary ? 0 : Math.round(rawX),
        y: isPrimary ? 0 : Math.round(rawY),
        width: draggingOutput.width,
        height: draggingOutput.height,
      };
      const snapDistance = SNAP_DISTANCE / Math.max(dragState.baseScale, 0.25);
      let resolved = snappingEnabled
        ? resolveSnappedPosition(candidate, others, snapDistance)
        : candidate;

      resolved = resolveNoOverlap(resolved, others);

      if (snappingEnabled) {
        resolved = resolveSnappedPosition(resolved, others, snapDistance);
      }
      resolved = resolveNoOverlap(resolved, others);

      updateConfig((prev) => ({
        ...prev,
        outputs: prev.outputs.map((output, outputIndex) =>
          outputIndex === dragState.index
            ? {
                ...output,
                positionX: dragState.index === 0 ? 0 : resolved.x,
                positionY: dragState.index === 0 ? 0 : resolved.y,
              }
            : output,
        ),
      }));
    };

    const handlePointerUp = (event: PointerEvent) => {
      if (event.pointerId !== dragState.pointerId) return;
      setDragState(null);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp, { once: true });
    window.addEventListener("pointercancel", handlePointerUp, { once: true });
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);
    };
  }, [dragState, resolvedOutputs, snappingEnabled, updateConfig]);

  useEffect(() => {
    if (!config || config.outputs.length === 0) return;
    const first = config.outputs[0];
    if ((first.positionX ?? 0) === 0 && (first.positionY ?? 0) === 0) return;

    updateConfig((prev) => ({
      ...prev,
      outputs: prev.outputs.map((output, index) =>
        index === 0
          ? {
              ...output,
              positionX: 0,
              positionY: 0,
            }
          : output,
      ),
    }));
  }, [config, updateConfig]);

  if (!config) return null;
  if (config.outputs.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Monitor Layout</CardTitle>
        <p className="text-sm text-muted-foreground">
          Drag a monitor to position it. Edits update positionX/positionY.
        </p>
        <div className="mt-2 flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Snapping</span>
          <Switch
            checked={snappingEnabled}
            onCheckedChange={setSnappingEnabled}
            aria-label="Enable snapping"
          />
        </div>
      </CardHeader>
      <CardContent>
        <div
          ref={canvasRef}
          className="relative h-[280px] w-full overflow-hidden rounded-lg border border-border bg-muted/40 p-2"
        >
          {resolvedOutputs.map(({ output, displayX, displayY, width, height, index }) => {
            const drawMinX = dragState?.baseMinX ?? minX;
              const drawMinY = dragState?.baseMinY ?? minY;
              const drawScale = dragState?.baseScale ?? scale;
              const drawOffsetX = dragState?.baseOffsetX ?? offsetX;
              const drawOffsetY = dragState?.baseOffsetY ?? offsetY;
              const left = (displayX - drawMinX) * drawScale + CANVAS_PADDING + drawOffsetX;
              const top = (displayY - drawMinY) * drawScale + CANVAS_PADDING + drawOffsetY;
              const pixelWidth = Math.max(72, width * drawScale);
              const pixelHeight = Math.max(48, height * drawScale);

              return (
                <div
                  key={`${output.name}-${index}`}
                  className="absolute inline-flex items-center justify-center rounded-lg border bg-background p-3 shadow"
                  style={{
                    width: pixelWidth,
                    height: pixelHeight,
                    transform: `translate(${left}px, ${top}px)`,
                    cursor: index === 0
                      ? "not-allowed"
                      : dragState?.index === index
                        ? "grabbing"
                        : "grab",
                    transition:
                      dragState?.index === index ? "none" : "transform 80ms linear",
                  }}
                  onPointerDown={(event) => {
                    if (index === 0) {
                      return;
                    }

                    event.preventDefault();
                    const rectX = output.positionX ?? displayX;
                    const rectY = output.positionY ?? displayY;
                    event.currentTarget.setPointerCapture(event.pointerId);
                    setDragState({
                      index,
                      pointerId: event.pointerId,
                      startPointerX: event.clientX,
                      startPointerY: event.clientY,
                      startX: rectX,
                      startY: rectY,
                      baseMinX: minX,
                      baseMinY: minY,
                      baseScale: scale,
                      baseOffsetX: offsetX,
                      baseOffsetY: offsetY,
                    });
                  }}
                  title={index === 0 ? `${output.name} (locked at 0, 0)` : `${output.name} (drag to move)`}
                >
                  <div className="w-full">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-medium">{output.name}</p>
                      <IconArrowsMove size={16} className="text-muted-foreground" />
                    </div>
                    <div className="grid gap-1 text-xs text-muted-foreground">
                      <span>X: {formatCoordinate(output.positionX)}</span>
                      <span>Y: {formatCoordinate(output.positionY)}</span>
                    </div>
                    {output.off && (
                      <Badge variant="secondary" className="mt-2">
                        Disabled
                      </Badge>
                    )}
                  </div>
                </div>
              );
            },
          )}
        </div>
      </CardContent>
    </Card>
  );
}
