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
import { useOutsideClick } from "./utils/use-outside-click.ts";

const CheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="pointer-events-none"><path d="M20 6 9 17l-5-5"/></svg>
);

const ChevronRightIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-auto"><path d="m9 18 6-6-6-6"/></svg>
);

interface MenuContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
}

const MenuContext = createContext<MenuContextValue>({
  open: false,
  setOpen: () => {},
  triggerRef: { current: null },
});

export interface DropdownMenuProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

function DropdownMenu({
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange,
  children,
}: DropdownMenuProps) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const triggerRef = useRef<HTMLButtonElement>(null);

  const handleOpenChange = useCallback(
    (o: boolean) => {
      if (!isControlled) setInternalOpen(o);
      onOpenChange?.(o);
    },
    [isControlled, onOpenChange],
  );

  return (
    <MenuContext.Provider
      value={{ open, setOpen: handleOpenChange, triggerRef }}
    >
      {children}
    </MenuContext.Provider>
  );
}

function DropdownMenuPortal({ children }: { children: React.ReactNode }) {
  return <Portal>{children}</Portal>;
}

function DropdownMenuTrigger({
  render,
  children,
  ...props
}: React.ComponentProps<"button"> & { render?: React.ReactElement<Record<string, unknown>> }) {
  const { setOpen, open, triggerRef } = useContext(MenuContext);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      props.onClick?.(e as React.MouseEvent<HTMLButtonElement>);
      setOpen(!open);
    },
    [setOpen, open, props.onClick],
  );

  if (render) {
    return React.cloneElement(render, {
      ref: triggerRef,
      "data-slot": "dropdown-menu-trigger",
      "aria-expanded": open,
      "aria-haspopup": "menu",
      onClick: handleClick,
      ...render.props,
      children: children ?? render.props.children,
    });
  }

  return (
    <button
      ref={triggerRef}
      type="button"
      data-slot="dropdown-menu-trigger"
      aria-expanded={open}
      aria-haspopup="menu"
      onClick={handleClick}
      {...props}
    >
      {children}
    </button>
  );
}

export interface DropdownMenuContentProps extends React.ComponentProps<"div"> {
  side?: Side;
  sideOffset?: number;
  align?: "start" | "end" | "center";
  alignOffset?: number;
}

function DropdownMenuContent({
  align = "start",
  alignOffset = 0,
  side = "bottom",
  sideOffset = 4,
  className,
  ...props
}: DropdownMenuContentProps) {
  const { open, setOpen, triggerRef } = useContext(MenuContext);
  const floatingRef = useRef<HTMLDivElement>(null);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const { x, y, placement } = useAnchorPosition({
    anchor: triggerRef.current,
    floating: floatingRef.current,
    side,
    align: align === "center" ? "center" : align,
    sideOffset,
    alignOffset,
    open,
  });

  useOutsideClick([triggerRef, floatingRef], open, () => setOpen(false));

  const getItems = useCallback(() => {
    return Array.from(
      floatingRef.current?.querySelectorAll<HTMLElement>(
        '[data-slot="dropdown-menu-item"]:not([data-disabled]), [data-slot="dropdown-menu-checkbox-item"]:not([data-disabled]), [data-slot="dropdown-menu-radio-item"]:not([data-disabled]), [data-slot="dropdown-menu-sub-trigger"]:not([data-disabled])',
      ) ?? [],
    );
  }, []);

  useEffect(() => {
    if (!open) return;

    function handleKeyDown(e: KeyboardEvent) {
      const items = getItems();
      if (!items.length) return;

      switch (e.key) {
        case "ArrowDown": {
          e.preventDefault();
          const next = highlightedIndex < items.length - 1 ? highlightedIndex + 1 : 0;
          setHighlightedIndex(next);
          items[next]?.focus();
          break;
        }
        case "ArrowUp": {
          e.preventDefault();
          const prev = highlightedIndex > 0 ? highlightedIndex - 1 : items.length - 1;
          setHighlightedIndex(prev);
          items[prev]?.focus();
          break;
        }
        case "Escape":
          e.preventDefault();
          setOpen(false);
          triggerRef.current?.focus();
          break;
        case "Home":
          e.preventDefault();
          setHighlightedIndex(0);
          items[0]?.focus();
          break;
        case "End":
          e.preventDefault();
          setHighlightedIndex(items.length - 1);
          items[items.length - 1]?.focus();
          break;
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, highlightedIndex, setOpen, triggerRef, getItems]);

  if (!open) return null;

  const actualSide = placement.split("-")[0];
  const anchorWidth = triggerRef.current?.offsetWidth ?? 0;

  return (
    <Portal>
      <div
        ref={floatingRef}
        data-slot="dropdown-menu-content"
        data-sgn-capture="true"
        data-open=""
        data-side={actualSide}
        data-floating-portal=""
        role="menu"
        className={cn(
          "data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0 data-closed:zoom-out-95 data-open:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 ring-foreground/10 bg-popover text-popover-foreground min-w-32 rounded-lg p-1 shadow-md ring-1 duration-100 z-50 overflow-x-hidden overflow-y-auto outline-none",
          className,
        )}
        style={{
          position: "fixed",
          left: x,
          top: y,
          minWidth: anchorWidth,
          maxHeight: "min(300px, calc(100vh - 32px))",
        }}
        {...props}
      />
    </Portal>
  );
}

function DropdownMenuGroup({ ...props }: React.ComponentProps<"div">) {
  return <div role="group" data-slot="dropdown-menu-group" {...props} />;
}

function DropdownMenuLabel({
  className,
  inset,
  ...props
}: React.ComponentProps<"div"> & { inset?: boolean }) {
  return (
    <div
      data-slot="dropdown-menu-label"
      data-inset={inset}
      className={cn(
        "text-muted-foreground px-1.5 py-1 text-xs font-medium data-inset:pl-7",
        className,
      )}
      {...props}
    />
  );
}

export interface DropdownMenuItemProps extends React.ComponentProps<"div"> {
  inset?: boolean;
  variant?: "default" | "destructive";
  disabled?: boolean;
}

function DropdownMenuItem({
  className,
  inset,
  variant = "default",
  disabled,
  ...props
}: DropdownMenuItemProps) {
  const { setOpen, triggerRef } = useContext(MenuContext);

  return (
    <div
      role="menuitem"
      data-slot="dropdown-menu-item"
      data-inset={inset}
      data-variant={variant}
      data-disabled={disabled ? "" : undefined}
      tabIndex={disabled ? -1 : 0}
      className={cn(
        "focus:bg-accent focus:text-accent-foreground data-[variant=destructive]:text-destructive data-[variant=destructive]:focus:bg-destructive/10 dark:data-[variant=destructive]:focus:bg-destructive/20 data-[variant=destructive]:focus:text-destructive data-[variant=destructive]:*:[svg]:text-destructive not-data-[variant=destructive]:focus:**:text-accent-foreground gap-1.5 rounded-md px-1.5 py-1 text-sm data-inset:pl-7 [&_svg:not([class*='size-'])]:size-4 group/dropdown-menu-item relative flex cursor-default items-center outline-hidden select-none data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
        className,
      )}
      onClick={() => {
        if (disabled) return;
        setOpen(false);
        triggerRef.current?.focus();
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          if (disabled) return;
          (e.target as HTMLElement).click();
        }
      }}
      {...props}
    />
  );
}

// Submenu support
interface SubMenuContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  triggerRef: React.RefObject<HTMLDivElement | null>;
}

const SubMenuContext = createContext<SubMenuContextValue>({
  open: false,
  setOpen: () => {},
  triggerRef: { current: null },
});

function DropdownMenuSub({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);

  return (
    <SubMenuContext.Provider value={{ open, setOpen, triggerRef }}>
      {children}
    </SubMenuContext.Provider>
  );
}

function DropdownMenuSubTrigger({
  className,
  inset,
  children,
  ...props
}: React.ComponentProps<"div"> & { inset?: boolean }) {
  const { open, setOpen, triggerRef } = useContext(SubMenuContext);

  return (
    <div
      ref={triggerRef}
      data-slot="dropdown-menu-sub-trigger"
      data-inset={inset}
      data-open={open ? "" : undefined}
      data-popup-open={open ? "" : undefined}
      tabIndex={0}
      className={cn(
        "focus:bg-accent focus:text-accent-foreground data-open:bg-accent data-open:text-accent-foreground not-data-[variant=destructive]:focus:**:text-accent-foreground gap-1.5 rounded-md px-1.5 py-1 text-sm data-inset:pl-7 [&_svg:not([class*='size-'])]:size-4 data-popup-open:bg-accent data-popup-open:text-accent-foreground flex cursor-default items-center outline-hidden select-none [&_svg]:pointer-events-none [&_svg]:shrink-0",
        className,
      )}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onClick={() => setOpen(!open)}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight" || e.key === "Enter") {
          e.preventDefault();
          setOpen(true);
        }
      }}
      {...props}
    >
      {children}
      <ChevronRightIcon />
    </div>
  );
}

function DropdownMenuSubContent({
  align = "start",
  alignOffset = -3,
  side = "right",
  sideOffset = 0,
  className,
  ...props
}: DropdownMenuContentProps) {
  const { open, setOpen, triggerRef } = useContext(SubMenuContext);
  const floatingRef = useRef<HTMLDivElement>(null);

  const { x, y } = useAnchorPosition({
    anchor: triggerRef.current,
    floating: floatingRef.current,
    side,
    align: align === "center" ? "center" : align,
    sideOffset,
    alignOffset,
    open,
  });

  if (!open) return null;

  return (
    <Portal>
      <div
        ref={floatingRef}
        data-slot="dropdown-menu-sub-content"
        data-sgn-capture="true"
        data-open=""
        data-floating-portal=""
        role="menu"
        className={cn(
          "data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0 data-closed:zoom-out-95 data-open:zoom-in-95 ring-foreground/10 bg-popover text-popover-foreground min-w-[96px] rounded-md p-1 shadow-lg ring-1 duration-100 w-auto z-50 outline-none",
          className,
        )}
        style={{
          position: "fixed",
          left: x,
          top: y,
        }}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        {...props}
      />
    </Portal>
  );
}

function DropdownMenuCheckboxItem({
  className,
  children,
  checked,
  onCheckedChange,
  inset,
  disabled,
  ...props
}: React.ComponentProps<"div"> & {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  inset?: boolean;
  disabled?: boolean;
}) {
  const { setOpen, triggerRef } = useContext(MenuContext);

  return (
    <div
      role="menuitemcheckbox"
      data-slot="dropdown-menu-checkbox-item"
      data-inset={inset}
      data-disabled={disabled ? "" : undefined}
      aria-checked={checked}
      tabIndex={disabled ? -1 : 0}
      className={cn(
        "focus:bg-accent focus:text-accent-foreground focus:**:text-accent-foreground gap-1.5 rounded-md py-1 pr-8 pl-1.5 text-sm data-inset:pl-7 [&_svg:not([class*='size-'])]:size-4 relative flex cursor-default items-center outline-hidden select-none data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
        className,
      )}
      onClick={() => {
        if (disabled) return;
        onCheckedChange?.(!checked);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          if (!disabled) onCheckedChange?.(!checked);
        }
      }}
      {...props}
    >
      <span className="absolute right-2 flex items-center justify-center pointer-events-none">
        {checked && <CheckIcon />}
      </span>
      {children}
    </div>
  );
}

function DropdownMenuRadioGroup({
  value,
  onValueChange,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  value?: string;
  onValueChange?: (value: string) => void;
}) {
  return (
    <RadioGroupContext.Provider value={{ value, onValueChange }}>
      <div role="group" data-slot="dropdown-menu-radio-group" {...props}>
        {children}
      </div>
    </RadioGroupContext.Provider>
  );
}

interface RadioGroupContextValue {
  value?: string;
  onValueChange?: (value: string) => void;
}

const RadioGroupContext = createContext<RadioGroupContextValue>({});

function DropdownMenuRadioItem({
  className,
  children,
  value,
  inset,
  disabled,
  ...props
}: React.ComponentProps<"div"> & {
  value: string;
  inset?: boolean;
  disabled?: boolean;
}) {
  const { value: groupValue, onValueChange } = useContext(RadioGroupContext);
  const isChecked = groupValue === value;

  return (
    <div
      role="menuitemradio"
      data-slot="dropdown-menu-radio-item"
      data-inset={inset}
      data-disabled={disabled ? "" : undefined}
      aria-checked={isChecked}
      tabIndex={disabled ? -1 : 0}
      className={cn(
        "focus:bg-accent focus:text-accent-foreground focus:**:text-accent-foreground gap-1.5 rounded-md py-1 pr-8 pl-1.5 text-sm data-inset:pl-7 [&_svg:not([class*='size-'])]:size-4 relative flex cursor-default items-center outline-hidden select-none data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
        className,
      )}
      onClick={() => {
        if (!disabled) onValueChange?.(value);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          if (!disabled) onValueChange?.(value);
        }
      }}
      {...props}
    >
      <span className="absolute right-2 flex items-center justify-center pointer-events-none">
        {isChecked && <CheckIcon />}
      </span>
      {children}
    </div>
  );
}

function DropdownMenuSeparator({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      role="separator"
      data-slot="dropdown-menu-separator"
      className={cn("bg-border -mx-1 my-1 h-px", className)}
      {...props}
    />
  );
}

function DropdownMenuShortcut({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="dropdown-menu-shortcut"
      className={cn(
        "text-muted-foreground group-focus/dropdown-menu-item:text-accent-foreground ml-auto text-xs tracking-widest",
        className,
      )}
      {...props}
    />
  );
}

export {
  DropdownMenu,
  DropdownMenuPortal,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
};
