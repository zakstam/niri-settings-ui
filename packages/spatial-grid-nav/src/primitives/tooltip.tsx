import * as React from "react";
import {
  createContext,
  useContext,
  useState,
  useRef,
  useCallback,
  useEffect,
} from "react";
import { cn } from "./utils/cn.ts";
import { Portal } from "./utils/portal.tsx";
import { useAnchorPosition, type Side } from "./utils/use-anchor-position.ts";

// Provider context for shared delay
interface TooltipProviderContextValue {
  delay: number;
}

const TooltipProviderContext = createContext<TooltipProviderContextValue>({
  delay: 0,
});

export interface TooltipProviderProps {
  delay?: number;
  children: React.ReactNode;
}

function TooltipProvider({ delay = 0, children }: TooltipProviderProps) {
  return (
    <TooltipProviderContext.Provider value={{ delay }}>
      {children}
    </TooltipProviderContext.Provider>
  );
}

// Individual tooltip context
interface TooltipContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  triggerRef: React.RefObject<HTMLElement | null>;
  delay: number;
}

const TooltipContext = createContext<TooltipContextValue>({
  open: false,
  setOpen: () => {},
  triggerRef: { current: null },
  delay: 0,
});

export interface TooltipProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

function Tooltip({
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange,
  children,
}: TooltipProps) {
  const providerCtx = useContext(TooltipProviderContext);
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const triggerRef = useRef<HTMLElement>(null);

  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;

  const setOpen = useCallback(
    (value: boolean) => {
      if (!isControlled) setInternalOpen(value);
      onOpenChange?.(value);
    },
    [isControlled, onOpenChange],
  );

  return (
    <TooltipContext.Provider
      value={{ open, setOpen, triggerRef, delay: providerCtx.delay }}
    >
      {children}
    </TooltipContext.Provider>
  );
}

export interface TooltipTriggerProps extends React.ComponentProps<"button"> {
  render?: React.ReactElement<Record<string, unknown>>;
}

function TooltipTrigger({ render, children, ...props }: TooltipTriggerProps) {
  const { setOpen, triggerRef, delay } = useContext(TooltipContext);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleEnter = useCallback(() => {
    if (delay > 0) {
      timerRef.current = setTimeout(() => setOpen(true), delay);
    } else {
      setOpen(true);
    }
  }, [delay, setOpen]);

  const handleLeave = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setOpen(false);
  }, [setOpen]);

  const triggerProps = {
    "data-slot": "tooltip-trigger",
    ref: triggerRef as React.Ref<HTMLButtonElement>,
    onMouseEnter: handleEnter,
    onMouseLeave: handleLeave,
    onFocus: handleEnter,
    onBlur: handleLeave,
    ...props,
  };

  if (render) {
    return React.cloneElement(render, {
      ...triggerProps,
      ...render.props,
      children: children ?? render.props.children,
    });
  }

  return (
    <button type="button" {...triggerProps}>
      {children}
    </button>
  );
}

export interface TooltipContentProps extends React.ComponentProps<"div"> {
  side?: Side;
  sideOffset?: number;
  align?: "start" | "end" | "center";
  alignOffset?: number;
}

function TooltipContent({
  className,
  side = "top",
  sideOffset = 4,
  align = "center",
  alignOffset = 0,
  children,
  ...props
}: TooltipContentProps) {
  const { open, triggerRef } = useContext(TooltipContext);
  const floatingRef = useRef<HTMLDivElement>(null);

  const { x, y, placement } = useAnchorPosition({
    anchor: triggerRef.current,
    floating: floatingRef.current,
    side,
    align: align === "center" ? "center" : align,
    sideOffset,
    alignOffset,
    open,
  });

  if (!open) return null;

  const actualSide = placement.split("-")[0];

  return (
    <Portal>
      <div
        ref={floatingRef}
        data-slot="tooltip-content"
        data-open=""
        data-side={actualSide}
        className={cn(
          "data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 rounded-md px-3 py-1.5 text-xs bg-foreground text-background z-50 w-fit max-w-xs",
          className,
        )}
        style={{
          position: "fixed",
          left: x,
          top: y,
        }}
        {...props}
      >
        {children}
      </div>
    </Portal>
  );
}

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };
