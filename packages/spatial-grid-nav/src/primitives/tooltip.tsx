import * as React from "react";
import {
  createContext,
  useContext,
  useState,
  useRef,
  useCallback,
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
  triggerRef: React.MutableRefObject<HTMLButtonElement | null>;
  delay: number;
}

const TooltipContext = createContext<TooltipContextValue>({
  open: false,
  setOpen: () => {},
  triggerRef: { current: null },
  delay: 0,
} as TooltipContextValue);

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
  const triggerRef = useRef<HTMLButtonElement | null>(null);

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
  const { ref: externalRef, ...triggerProps } = props as React.ComponentProps<"button"> & {
    ref?: React.Ref<HTMLButtonElement>;
  };

  const handleEnter = useCallback(
    (currentTarget: HTMLButtonElement) => {
      triggerRef.current = currentTarget;

      if (delay > 0) {
        timerRef.current = setTimeout(() => setOpen(true), delay);
      } else {
        setOpen(true);
      }
    },
    [delay, setOpen],
  );

  const handleLeave = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setOpen(false);
  }, [setOpen]);

  const mergedTriggerProps = {
    "data-slot": "tooltip-trigger",
    onMouseEnter: (event: React.MouseEvent<HTMLButtonElement>) =>
      handleEnter(event.currentTarget),
    onMouseLeave: handleLeave,
    onFocus: (event: React.FocusEvent<HTMLButtonElement>) =>
      handleEnter(event.currentTarget),
    onBlur: handleLeave,
    ...triggerProps,
  } as React.ComponentPropsWithoutRef<"button"> & {
    "data-slot"?: string;
  };

  const mergedRef = (node: HTMLButtonElement | null) => {
    triggerRef.current = node;

    if (!externalRef) return;

    if (typeof externalRef === "function") {
      externalRef(node);
    } else {
      (externalRef as React.MutableRefObject<HTMLButtonElement | null>).current =
        node;
    }
  };

  if (render) {
    const renderProps = render.props as React.ComponentProps<"button"> & {
      ref?: React.Ref<HTMLButtonElement>;
    };

    const mergedMouseEnter: React.MouseEventHandler<HTMLButtonElement> = (e) => {
      mergedTriggerProps.onMouseEnter?.(e);
      renderProps.onMouseEnter?.(e);
    };

    const mergedMouseLeave: React.MouseEventHandler<HTMLButtonElement> = (e) => {
      mergedTriggerProps.onMouseLeave?.(e);
      renderProps.onMouseLeave?.(e);
    };

    const mergedFocus: React.FocusEventHandler<HTMLButtonElement> = (e) => {
      mergedTriggerProps.onFocus?.(e);
      renderProps.onFocus?.(e);
    };

    const mergedBlur: React.FocusEventHandler<HTMLButtonElement> = (e) => {
      mergedTriggerProps.onBlur?.(e);
      renderProps.onBlur?.(e);
    };

    return React.cloneElement(
      render,
      {
        ...render.props,
        "data-slot": "tooltip-trigger",
        ref: mergedRef,
        onMouseEnter: mergedMouseEnter,
        onMouseLeave: mergedMouseLeave,
      onFocus: mergedFocus,
      onBlur: mergedBlur,
      ...mergedTriggerProps,
      children: children ?? render.props.children,
    } as unknown as React.ComponentPropsWithoutRef<"button">,
    );
  }

  return (
    <button type="button" ref={mergedRef} {...mergedTriggerProps}>
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

  const { x, y, placement, ready } = useAnchorPosition({
    anchor: triggerRef,
    floating: floatingRef,
    side,
    align: align === "center" ? "center" : align,
    sideOffset,
    alignOffset,
    open,
  });

  if (!open || !ready) return null;

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
