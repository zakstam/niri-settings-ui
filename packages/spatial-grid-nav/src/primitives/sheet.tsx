import * as React from "react";
import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
} from "react";
import { cn } from "./utils/cn.ts";
import { Portal } from "./utils/portal.tsx";
import { Button } from "./button.tsx";
import { useFocusTrap } from "./utils/use-focus-trap.ts";
import { useScrollLock } from "./utils/use-scroll-lock.ts";

const CloseIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </svg>
);

interface SheetContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const SheetContext = createContext<SheetContextValue>({
  open: false,
  setOpen: () => {},
});

export interface SheetProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

function Sheet({
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange,
  children,
}: SheetProps) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
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
    <SheetContext.Provider value={{ open, setOpen }}>
      {children}
    </SheetContext.Provider>
  );
}

function SheetTrigger({
  render,
  children,
  ...props
}: React.ComponentProps<"button"> & { render?: React.ReactElement<Record<string, unknown>> }) {
  const { setOpen } = useContext(SheetContext);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      props.onClick?.(e as React.MouseEvent<HTMLButtonElement>);
      setOpen(true);
    },
    [setOpen, props.onClick],
  );

  if (render) {
    return React.cloneElement(render, {
      "data-slot": "sheet-trigger",
      onClick: handleClick,
      ...render.props,
      children: children ?? render.props.children,
    });
  }

  return (
    <button
      type="button"
      data-slot="sheet-trigger"
      onClick={handleClick}
      {...props}
    >
      {children}
    </button>
  );
}

function SheetClose({
  render,
  children,
  ...props
}: React.ComponentProps<"button"> & { render?: React.ReactElement<Record<string, unknown>> }) {
  const { setOpen } = useContext(SheetContext);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      (props as React.ComponentProps<"button">).onClick?.(
        e as React.MouseEvent<HTMLButtonElement>,
      );
      setOpen(false);
    },
    [setOpen, props],
  );

  if (render) {
    return React.cloneElement(render, {
      "data-slot": "sheet-close",
      onClick: handleClick,
      ...render.props,
      children: children ?? render.props.children,
    });
  }

  return (
    <button
      type="button"
      data-slot="sheet-close"
      onClick={handleClick}
      {...props}
    >
      {children}
    </button>
  );
}

function SheetPortal({ children }: { children: React.ReactNode }) {
  return <Portal>{children}</Portal>;
}

function SheetOverlay({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const { setOpen } = useContext(SheetContext);

  return (
    <div
      data-slot="sheet-overlay"
      data-open=""
      className={cn(
        "data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0 bg-black/10 duration-100 supports-backdrop-filter:backdrop-blur-xs fixed inset-0 z-50",
        className,
      )}
      onClick={() => setOpen(false)}
      {...props}
    />
  );
}

export type SheetSide = "top" | "right" | "bottom" | "left";

export interface SheetContentProps extends React.ComponentProps<"div"> {
  side?: SheetSide;
  showCloseButton?: boolean;
}

function SheetContent({
  className,
  children,
  side = "right",
  showCloseButton = true,
  ...props
}: SheetContentProps) {
  const { open, setOpen } = useContext(SheetContext);
  const contentRef = useRef<HTMLDivElement>(null);

  useFocusTrap(contentRef.current, open);
  useScrollLock(open);

  useEffect(() => {
    if (!open) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, setOpen]);

  if (!open) return null;

  return (
    <SheetPortal>
      <SheetOverlay />
      <div
        ref={contentRef}
        data-slot="sheet-content"
        data-side={side}
        data-open=""
        className={cn(
          "bg-background data-open:animate-in data-closed:animate-out data-[side=right]:data-closed:slide-out-to-right-10 data-[side=right]:data-open:slide-in-from-right-10 data-[side=left]:data-closed:slide-out-to-left-10 data-[side=left]:data-open:slide-in-from-left-10 data-[side=top]:data-closed:slide-out-to-top-10 data-[side=top]:data-open:slide-in-from-top-10 data-closed:fade-out-0 data-open:fade-in-0 data-[side=bottom]:data-closed:slide-out-to-bottom-10 data-[side=bottom]:data-open:slide-in-from-bottom-10 fixed z-50 flex flex-col gap-4 bg-clip-padding text-sm shadow-lg transition duration-200 ease-in-out data-[side=bottom]:inset-x-0 data-[side=bottom]:bottom-0 data-[side=bottom]:h-auto data-[side=bottom]:border-t data-[side=left]:inset-y-0 data-[side=left]:left-0 data-[side=left]:h-full data-[side=left]:w-3/4 data-[side=left]:border-r data-[side=right]:inset-y-0 data-[side=right]:right-0 data-[side=right]:h-full data-[side=right]:w-3/4 data-[side=right]:border-l data-[side=top]:inset-x-0 data-[side=top]:top-0 data-[side=top]:h-auto data-[side=top]:border-b data-[side=left]:sm:max-w-sm data-[side=right]:sm:max-w-sm",
          className,
        )}
        {...props}
      >
        {children}
        {showCloseButton && (
          <SheetClose
            render={
              <Button
                variant="ghost"
                className="absolute top-3 right-3"
                size="icon-sm"
              />
            }
          >
            <CloseIcon />
            <span className="sr-only">Close</span>
          </SheetClose>
        )}
      </div>
    </SheetPortal>
  );
}

function SheetHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-header"
      className={cn("gap-0.5 p-4 flex flex-col", className)}
      {...props}
    />
  );
}

function SheetFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-footer"
      className={cn("gap-2 p-4 mt-auto flex flex-col", className)}
      {...props}
    />
  );
}

function SheetTitle({ className, ...props }: React.ComponentProps<"h2">) {
  return (
    <h2
      data-slot="sheet-title"
      className={cn("text-foreground text-base font-medium", className)}
      {...props}
    />
  );
}

function SheetDescription({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="sheet-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  );
}

export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
};
