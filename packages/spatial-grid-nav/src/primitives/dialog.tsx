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

// Inline close icon SVG to avoid icon library dependency
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

interface DialogContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const DialogContext = createContext<DialogContextValue>({
  open: false,
  setOpen: () => {},
});

export interface DialogProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

function Dialog({
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange,
  children,
}: DialogProps) {
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
    <DialogContext.Provider value={{ open, setOpen }}>
      {children}
    </DialogContext.Provider>
  );
}

export interface DialogTriggerProps extends React.ComponentProps<"button"> {
  render?: React.ReactElement<Record<string, unknown>>;
}

function DialogTrigger({ render, children, ...props }: DialogTriggerProps) {
  const { setOpen } = useContext(DialogContext);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      props.onClick?.(e as React.MouseEvent<HTMLButtonElement>);
      setOpen(true);
    },
    [setOpen, props.onClick],
  );

  if (render) {
    return React.cloneElement(render, {
      "data-slot": "dialog-trigger",
      onClick: handleClick,
      ...render.props,
      children: children ?? render.props.children,
    });
  }

  return (
    <button
      type="button"
      data-slot="dialog-trigger"
      onClick={handleClick}
      {...props}
    >
      {children}
    </button>
  );
}

function DialogPortal({ children }: { children: React.ReactNode }) {
  return <Portal>{children}</Portal>;
}

function DialogClose({
  render,
  children,
  ...props
}: React.ComponentProps<"button"> & { render?: React.ReactElement<Record<string, unknown>> }) {
  const { setOpen } = useContext(DialogContext);

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
      "data-slot": "dialog-close",
      onClick: handleClick,
      ...render.props,
      children: children ?? render.props.children,
    });
  }

  return (
    <button
      type="button"
      data-slot="dialog-close"
      onClick={handleClick}
      {...props}
    >
      {children}
    </button>
  );
}

function DialogOverlay({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const { setOpen } = useContext(DialogContext);

  return (
    <div
      data-slot="dialog-overlay"
      data-open=""
      className={cn(
        "data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0 bg-black/10 duration-100 supports-backdrop-filter:backdrop-blur-xs fixed inset-0 isolate z-50",
        className,
      )}
      onClick={() => setOpen(false)}
      {...props}
    />
  );
}

export interface DialogContentProps extends React.ComponentProps<"div"> {
  showCloseButton?: boolean;
}

function DialogContent({
  className,
  children,
  showCloseButton = true,
  ...props
}: DialogContentProps) {
  const { open, setOpen } = useContext(DialogContext);
  const contentRef = useRef<HTMLDivElement>(null);

  useFocusTrap(contentRef.current, open);
  useScrollLock(open);

  // Escape key handler
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
    <DialogPortal>
      <DialogOverlay />
      <div
        ref={contentRef}
        data-slot="dialog-content"
        data-open=""
        className={cn(
          "bg-background data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0 data-closed:zoom-out-95 data-open:zoom-in-95 ring-foreground/10 grid max-w-[calc(100%-2rem)] gap-4 rounded-xl p-4 text-sm ring-1 duration-100 sm:max-w-sm fixed top-1/2 left-1/2 z-50 w-full -translate-x-1/2 -translate-y-1/2 outline-none",
          className,
        )}
        {...props}
      >
        {children}
        {showCloseButton && (
          <DialogClose
            render={
              <Button
                variant="ghost"
                className="absolute top-2 right-2"
                size="icon-sm"
              />
            }
          >
            <CloseIcon />
            <span className="sr-only">Close</span>
          </DialogClose>
        )}
      </div>
    </DialogPortal>
  );
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-header"
      className={cn("gap-2 flex flex-col", className)}
      {...props}
    />
  );
}

function DialogFooter({
  className,
  showCloseButton = false,
  children,
  ...props
}: React.ComponentProps<"div"> & { showCloseButton?: boolean }) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        "bg-muted/50 -mx-4 -mb-4 rounded-b-xl border-t p-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
        className,
      )}
      {...props}
    >
      {children}
      {showCloseButton && (
        <DialogClose render={<Button variant="outline" />}>Close</DialogClose>
      )}
    </div>
  );
}

function DialogTitle({
  className,
  ...props
}: React.ComponentProps<"h2">) {
  return (
    <h2
      data-slot="dialog-title"
      className={cn("text-base leading-none font-medium", className)}
      {...props}
    />
  );
}

function DialogDescription({
  className,
  ...props
}: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="dialog-description"
      className={cn(
        "text-muted-foreground *:[a]:hover:text-foreground text-sm *:[a]:underline *:[a]:underline-offset-3",
        className,
      )}
      {...props}
    />
  );
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
};
