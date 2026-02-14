import * as React from "react";
import {
  createContext,
  useContext,
  useRef,
  useEffect,
  useState,
  useCallback,
} from "react";
import { useControllable } from "./utils/use-controllable.ts";

interface CollapsibleContextValue {
  open: boolean;
  toggle: () => void;
  disabled?: boolean;
}

const CollapsibleContext = createContext<CollapsibleContextValue>({
  open: false,
  toggle: () => {},
});

export interface CollapsibleProps extends React.ComponentProps<"div"> {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  disabled?: boolean;
}

function Collapsible({
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange,
  disabled,
  ...props
}: CollapsibleProps) {
  const [open, setOpen] = useControllable(
    controlledOpen,
    defaultOpen,
    onOpenChange,
  );

  const toggle = useCallback(() => {
    if (!disabled) setOpen(!open);
  }, [disabled, open, setOpen]);

  return (
    <CollapsibleContext.Provider value={{ open, toggle, disabled }}>
      <div
        data-slot="collapsible"
        data-open={open ? "" : undefined}
        data-closed={!open ? "" : undefined}
        data-disabled={disabled ? "" : undefined}
        {...props}
      />
    </CollapsibleContext.Provider>
  );
}

function CollapsibleTrigger({
  render,
  children,
  ...props
}: React.ComponentProps<"button"> & {
  render?: React.ReactElement<Record<string, unknown>>;
}) {
  const { open, toggle, disabled } = useContext(CollapsibleContext);

  const sharedProps = {
    "data-slot": "collapsible-trigger",
    "data-open": open ? "" : undefined,
    "data-closed": !open ? "" : undefined,
    "aria-expanded": open,
    disabled,
    onClick: toggle,
  };

  if (render) {
    return React.cloneElement(render, {
      ...sharedProps,
      ...render.props,
      onClick: (e: React.MouseEvent) => {
        const renderOnClick = (render.props as Record<string, unknown>).onClick as ((e: React.MouseEvent) => void) | undefined;
        renderOnClick?.(e);
        toggle();
      },
      children: children ?? render.props.children,
    } as Record<string, unknown>);
  }

  return (
    <button type="button" {...sharedProps} {...props}>
      {children}
    </button>
  );
}

function CollapsibleContent({
  style,
  ...props
}: React.ComponentProps<"div">) {
  const { open } = useContext(CollapsibleContext);
  const contentRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number | undefined>(undefined);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;

    if (open) {
      // Opening: measure full height then animate from 0 to it
      el.style.display = "block";
      const fullHeight = el.scrollHeight;
      setHeight(0);
      setIsAnimating(true);
      requestAnimationFrame(() => {
        setHeight(fullHeight);
        const timer = setTimeout(() => {
          setHeight(undefined);
          setIsAnimating(false);
        }, 200);
        return () => clearTimeout(timer);
      });
    } else {
      // Closing: set current height then animate to 0
      const fullHeight = el.scrollHeight;
      setHeight(fullHeight);
      setIsAnimating(true);
      requestAnimationFrame(() => {
        setHeight(0);
        const timer = setTimeout(() => {
          setIsAnimating(false);
        }, 200);
        return () => clearTimeout(timer);
      });
    }
  }, [open]);

  if (!open && !isAnimating) return null;

  return (
    <div
      ref={contentRef}
      data-slot="collapsible-content"
      data-open={open ? "" : undefined}
      data-closed={!open ? "" : undefined}
      style={{
        overflow: "hidden",
        transition: "height 200ms ease",
        ...(height !== undefined ? { height } : {}),
        ...style,
      }}
      {...props}
    />
  );
}

export { Collapsible, CollapsibleTrigger, CollapsibleContent };
