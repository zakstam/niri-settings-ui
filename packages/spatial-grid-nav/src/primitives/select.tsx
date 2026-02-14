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
import { useTypeahead } from "./utils/use-typeahead.ts";

// Inline icon SVGs
const SelectorIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground size-4 pointer-events-none"><path d="m7 15 5 5 5-5"/><path d="m7 9 5-5 5 5"/></svg>
);

const CheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="pointer-events-none"><path d="M20 6 9 17l-5-5"/></svg>
);

const ChevronUpIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6"/></svg>
);

const ChevronDownIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
);

interface SelectContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  value: string;
  onValueChange: (value: string) => void;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
  contentRef: React.RefObject<HTMLDivElement | null>;
  highlightedIndex: number;
  setHighlightedIndex: (index: number) => void;
}

const SelectContext = createContext<SelectContextValue>({
  open: false,
  setOpen: () => {},
  value: "",
  onValueChange: () => {},
  triggerRef: { current: null },
  contentRef: { current: null },
  highlightedIndex: -1,
  setHighlightedIndex: () => {},
});

export interface SelectProps {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

function Select({
  value: controlledValue,
  defaultValue = "",
  onValueChange,
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange,
  children,
}: SelectProps) {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const isValueControlled = controlledValue !== undefined;
  const isOpenControlled = controlledOpen !== undefined;
  const value = isValueControlled ? controlledValue : internalValue;
  const open = isOpenControlled ? controlledOpen : internalOpen;

  const triggerRef = useRef<HTMLButtonElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const handleValueChange = useCallback(
    (v: string) => {
      if (!isValueControlled) setInternalValue(v);
      onValueChange?.(v);
    },
    [isValueControlled, onValueChange],
  );

  const handleOpenChange = useCallback(
    (o: boolean) => {
      if (!isOpenControlled) setInternalOpen(o);
      onOpenChange?.(o);
      if (!o) setHighlightedIndex(-1);
    },
    [isOpenControlled, onOpenChange],
  );

  return (
    <SelectContext.Provider
      value={{
        open,
        setOpen: handleOpenChange,
        value,
        onValueChange: handleValueChange,
        triggerRef,
        contentRef,
        highlightedIndex,
        setHighlightedIndex,
      }}
    >
      {children}
    </SelectContext.Provider>
  );
}

function SelectGroup({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="select-group"
      role="group"
      className={cn("scroll-my-1 p-1", className)}
      {...props}
    />
  );
}

function SelectValue({
  className,
  placeholder,
  ...props
}: React.ComponentProps<"span"> & { placeholder?: string }) {
  const { value } = useContext(SelectContext);

  return (
    <span
      data-slot="select-value"
      data-placeholder={!value ? "" : undefined}
      className={cn("flex flex-1 text-left", className)}
      {...props}
    >
      {props.children ?? (value || placeholder)}
    </span>
  );
}

export interface SelectTriggerProps extends React.ComponentProps<"button"> {
  size?: "sm" | "default";
}

function SelectTrigger({
  className,
  size = "default",
  children,
  ...props
}: SelectTriggerProps) {
  const { open, setOpen, triggerRef } = useContext(SelectContext);

  return (
    <button
      ref={triggerRef}
      type="button"
      role="combobox"
      data-slot="select-trigger"
      data-size={size}
      aria-expanded={open}
      aria-haspopup="listbox"
      className={cn(
        "border-input data-placeholder:text-muted-foreground dark:bg-input/30 dark:hover:bg-input/50 focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:aria-invalid:border-destructive/50 gap-1.5 rounded-lg border bg-transparent py-2 pr-2 pl-2.5 text-sm transition-colors select-none focus-visible:ring-3 aria-invalid:ring-3 data-[size=default]:h-8 data-[size=sm]:h-7 data-[size=sm]:rounded-[min(var(--radius-md),10px)] *:data-[slot=select-value]:gap-1.5 [&_svg:not([class*='size-'])]:size-4 flex w-fit items-center justify-between whitespace-nowrap outline-none disabled:cursor-not-allowed disabled:opacity-50 *:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center [&_svg]:pointer-events-none [&_svg]:shrink-0",
        className,
      )}
      onClick={() => setOpen(!open)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
          e.preventDefault();
          setOpen(true);
        }
      }}
      {...props}
    >
      {children}
      <SelectorIcon />
    </button>
  );
}

export interface SelectContentProps extends React.ComponentProps<"div"> {
  side?: Side;
  sideOffset?: number;
  align?: "start" | "end" | "center";
  alignOffset?: number;
}

function SelectContent({
  className,
  children,
  side = "bottom",
  sideOffset = 4,
  align = "center",
  alignOffset = 0,
  ...props
}: SelectContentProps) {
  const { open, setOpen, value, onValueChange, triggerRef, contentRef, highlightedIndex, setHighlightedIndex } =
    useContext(SelectContext);
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

  // Close on outside click
  useOutsideClick(
    [triggerRef, floatingRef],
    open,
    () => setOpen(false),
  );

  // Keyboard navigation
  const getItems = useCallback(() => {
    return Array.from(
      floatingRef.current?.querySelectorAll<HTMLElement>(
        '[data-slot="select-item"]:not([data-disabled])',
      ) ?? [],
    );
  }, []);

  const { handleTypeahead, reset: resetTypeahead } = useTypeahead(
    getItems,
    (item) => {
      const items = getItems();
      const idx = items.indexOf(item);
      if (idx >= 0) {
        setHighlightedIndex(idx);
        item.scrollIntoView({ block: "nearest" });
      }
    },
  );

  useEffect(() => {
    if (!open) {
      resetTypeahead();
      return;
    }

    function handleKeyDown(e: KeyboardEvent) {
      const items = getItems();
      if (!items.length) return;

      switch (e.key) {
        case "ArrowDown": {
          e.preventDefault();
          const next = highlightedIndex < items.length - 1 ? highlightedIndex + 1 : 0;
          setHighlightedIndex(next);
          items[next]?.scrollIntoView({ block: "nearest" });
          break;
        }
        case "ArrowUp": {
          e.preventDefault();
          const prev = highlightedIndex > 0 ? highlightedIndex - 1 : items.length - 1;
          setHighlightedIndex(prev);
          items[prev]?.scrollIntoView({ block: "nearest" });
          break;
        }
        case "Enter":
        case " ": {
          e.preventDefault();
          const selected = items[highlightedIndex];
          if (selected) {
            const val = selected.getAttribute("data-value");
            if (val !== null) {
              onValueChange(val);
              setOpen(false);
              triggerRef.current?.focus();
            }
          }
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
          items[0]?.scrollIntoView({ block: "nearest" });
          break;
        case "End":
          e.preventDefault();
          setHighlightedIndex(items.length - 1);
          items[items.length - 1]?.scrollIntoView({ block: "nearest" });
          break;
        default:
          handleTypeahead(e.key);
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [
    open,
    highlightedIndex,
    setHighlightedIndex,
    setOpen,
    onValueChange,
    triggerRef,
    getItems,
    handleTypeahead,
    resetTypeahead,
  ]);

  // Highlight the currently selected item when opening
  useEffect(() => {
    if (!open) return;
    requestAnimationFrame(() => {
      const items = getItems();
      const selectedIdx = items.findIndex(
        (el) => el.getAttribute("data-value") === value,
      );
      if (selectedIdx >= 0) {
        setHighlightedIndex(selectedIdx);
        items[selectedIdx]?.scrollIntoView({ block: "nearest" });
      }
    });
  }, [open, value, getItems, setHighlightedIndex]);

  if (!open) return null;

  const actualSide = placement.split("-")[0];
  const anchorWidth = triggerRef.current?.offsetWidth ?? 0;

  return (
    <Portal>
      <div
        ref={floatingRef}
        data-slot="select-content"
        data-sgn-capture="true"
        data-open=""
        data-side={actualSide}
        data-floating-portal=""
        role="listbox"
        className={cn(
          "bg-popover text-popover-foreground data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0 data-closed:zoom-out-95 data-open:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 ring-foreground/10 min-w-36 rounded-lg shadow-md ring-1 duration-100 relative isolate z-50 overflow-x-hidden overflow-y-auto",
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
      >
        {children}
      </div>
    </Portal>
  );
}

function SelectLabel({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="select-label"
      className={cn("text-muted-foreground px-1.5 py-1 text-xs", className)}
      {...props}
    />
  );
}

export interface SelectItemProps extends React.ComponentProps<"div"> {
  value: string;
  disabled?: boolean;
}

function SelectItem({
  className,
  children,
  value: itemValue,
  disabled,
  ...props
}: SelectItemProps) {
  const { value, onValueChange, setOpen, triggerRef, highlightedIndex } =
    useContext(SelectContext);
  const isSelected = value === itemValue;
  const itemRef = useRef<HTMLDivElement>(null);

  // Check if this item is highlighted
  const parentList = itemRef.current?.closest('[data-slot="select-content"]');
  const allItems = parentList
    ? Array.from(
        parentList.querySelectorAll<HTMLElement>(
          '[data-slot="select-item"]:not([data-disabled])',
        ),
      )
    : [];
  const myIndex = allItems.indexOf(itemRef.current!);
  const isHighlighted = myIndex >= 0 && myIndex === highlightedIndex;

  return (
    <div
      ref={itemRef}
      role="option"
      data-slot="select-item"
      data-value={itemValue}
      data-disabled={disabled ? "" : undefined}
      data-selected={isSelected ? "" : undefined}
      data-highlighted={isHighlighted ? "" : undefined}
      aria-selected={isSelected}
      className={cn(
        "data-highlighted:bg-accent data-highlighted:text-accent-foreground focus:bg-accent focus:text-accent-foreground not-data-[variant=destructive]:focus:**:text-accent-foreground gap-1.5 rounded-md py-1 pr-8 pl-1.5 text-sm [&_svg:not([class*='size-'])]:size-4 *:[span]:last:flex *:[span]:last:items-center *:[span]:last:gap-2 relative flex w-full cursor-default items-center outline-hidden select-none data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
        className,
      )}
      onClick={() => {
        if (disabled) return;
        onValueChange(itemValue);
        setOpen(false);
        triggerRef.current?.focus();
      }}
      {...props}
    >
      <span className="flex flex-1 gap-2 shrink-0 whitespace-nowrap">
        {children}
      </span>
      {isSelected && (
        <span className="pointer-events-none absolute right-2 flex size-4 items-center justify-center">
          <CheckIcon />
        </span>
      )}
    </div>
  );
}

function SelectSeparator({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="select-separator"
      role="separator"
      className={cn("bg-border -mx-1 my-1 h-px pointer-events-none", className)}
      {...props}
    />
  );
}

function SelectScrollUpButton({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="select-scroll-up-button"
      className={cn(
        "bg-popover z-10 flex cursor-default items-center justify-center py-1 [&_svg:not([class*='size-'])]:size-4 top-0 w-full",
        className,
      )}
      {...props}
    >
      <ChevronUpIcon />
    </div>
  );
}

function SelectScrollDownButton({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="select-scroll-down-button"
      className={cn(
        "bg-popover z-10 flex cursor-default items-center justify-center py-1 [&_svg:not([class*='size-'])]:size-4 bottom-0 w-full",
        className,
      )}
      {...props}
    >
      <ChevronDownIcon />
    </div>
  );
}

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
};
