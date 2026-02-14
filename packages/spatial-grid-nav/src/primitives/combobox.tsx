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
import { Button } from "./button.tsx";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "./input-group.tsx";

// Inline icons
const ChevronDownIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground size-4 pointer-events-none"><path d="m6 9 6 6 6-6"/></svg>
);

const CheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="pointer-events-none"><path d="M20 6 9 17l-5-5"/></svg>
);

const CloseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="pointer-events-none"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
);

interface ComboboxContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  value: string | string[];
  onValueChange: (value: string | string[]) => void;
  inputValue: string;
  setInputValue: (value: string) => void;
  highlightedIndex: number;
  setHighlightedIndex: (index: number) => void;
  triggerRef: React.RefObject<HTMLElement | null>;
  inputRef: React.RefObject<HTMLInputElement | null>;
  contentRef: React.RefObject<HTMLDivElement | null>;
  multiple: boolean;
  hasItems: boolean;
  setHasItems: (has: boolean) => void;
}

const ComboboxContext = createContext<ComboboxContextValue>({
  open: false,
  setOpen: () => {},
  value: "",
  onValueChange: () => {},
  inputValue: "",
  setInputValue: () => {},
  highlightedIndex: -1,
  setHighlightedIndex: () => {},
  triggerRef: { current: null },
  inputRef: { current: null },
  contentRef: { current: null },
  multiple: false,
  hasItems: true,
  setHasItems: () => {},
});

export interface ComboboxProps {
  value?: string | string[];
  defaultValue?: string | string[];
  onValueChange?: (value: string | string[]) => void;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  inputValue?: string;
  onInputValueChange?: (value: string) => void;
  multiple?: boolean;
  children: React.ReactNode;
}

function Combobox({
  value: controlledValue,
  defaultValue = "",
  onValueChange,
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange,
  inputValue: controlledInputValue,
  onInputValueChange,
  multiple = false,
  children,
}: ComboboxProps) {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const [internalInputValue, setInternalInputValue] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [hasItems, setHasItems] = useState(true);

  const isValueControlled = controlledValue !== undefined;
  const isOpenControlled = controlledOpen !== undefined;
  const isInputControlled = controlledInputValue !== undefined;
  const value = isValueControlled ? controlledValue : internalValue;
  const open = isOpenControlled ? controlledOpen : internalOpen;
  const inputValue = isInputControlled ? controlledInputValue : internalInputValue;

  const triggerRef = useRef<HTMLElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const handleValueChange = useCallback(
    (v: string | string[]) => {
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

  const handleInputValueChange = useCallback(
    (v: string) => {
      if (!isInputControlled) setInternalInputValue(v);
      onInputValueChange?.(v);
    },
    [isInputControlled, onInputValueChange],
  );

  return (
    <ComboboxContext.Provider
      value={{
        open,
        setOpen: handleOpenChange,
        value,
        onValueChange: handleValueChange,
        inputValue,
        setInputValue: handleInputValueChange,
        highlightedIndex,
        setHighlightedIndex,
        triggerRef,
        inputRef,
        contentRef,
        multiple,
        hasItems,
        setHasItems,
      }}
    >
      {children}
    </ComboboxContext.Provider>
  );
}

function ComboboxValue({
  ...props
}: React.ComponentProps<"span">) {
  const { value } = useContext(ComboboxContext);
  const display = Array.isArray(value) ? value.join(", ") : value;

  return (
    <span data-slot="combobox-value" {...props}>
      {props.children ?? display}
    </span>
  );
}

function ComboboxTrigger({
  className,
  children,
  ...props
}: React.ComponentProps<"button">) {
  const { setOpen, open, triggerRef } = useContext(ComboboxContext);

  return (
    <button
      ref={triggerRef as React.Ref<HTMLButtonElement>}
      type="button"
      data-slot="combobox-trigger"
      data-pressed={open ? "" : undefined}
      aria-expanded={open}
      className={cn("[&_svg:not([class*='size-'])]:size-4", className)}
      onClick={() => setOpen(!open)}
      {...props}
    >
      {children}
      <ChevronDownIcon />
    </button>
  );
}

function ComboboxClear({
  className,
  ...props
}: React.ComponentProps<"button">) {
  const { onValueChange, setInputValue, multiple } = useContext(ComboboxContext);

  return (
    <InputGroupButton
      data-slot="combobox-clear"
      variant="ghost"
      size="icon-xs"
      className={cn(className)}
      onClick={() => {
        onValueChange(multiple ? [] : "");
        setInputValue("");
      }}
      {...props}
    >
      <CloseIcon />
    </InputGroupButton>
  );
}

export interface ComboboxInputProps extends React.ComponentProps<"input"> {
  showTrigger?: boolean;
  showClear?: boolean;
}

function ComboboxInput({
  className,
  children,
  disabled = false,
  showTrigger = true,
  showClear = false,
  ...props
}: ComboboxInputProps) {
  const { setOpen, inputValue, setInputValue, inputRef, open } =
    useContext(ComboboxContext);

  return (
    <InputGroup className={cn("w-auto", className)}>
      <InputGroupInput
        ref={inputRef}
        disabled={disabled}
        value={inputValue}
        onChange={(e) => {
          setInputValue(e.target.value);
          if (!open) setOpen(true);
        }}
        onFocus={() => {
          if (!open) setOpen(true);
        }}
        {...props}
      />
      <InputGroupAddon align="inline-end">
        {showTrigger && (
          <InputGroupButton
            size="icon-xs"
            variant="ghost"
            data-slot="input-group-button"
            className="group-has-data-[slot=combobox-clear]/input-group:hidden data-pressed:bg-transparent"
            disabled={disabled}
            data-pressed={open ? "" : undefined}
            onClick={() => setOpen(!open)}
          >
            <ChevronDownIcon />
          </InputGroupButton>
        )}
        {showClear && <ComboboxClear disabled={disabled} />}
      </InputGroupAddon>
      {children}
    </InputGroup>
  );
}

export interface ComboboxContentProps extends React.ComponentProps<"div"> {
  side?: Side;
  sideOffset?: number;
  align?: "start" | "end" | "center";
  alignOffset?: number;
  anchor?: React.RefObject<HTMLElement | null> | HTMLElement | null;
}

function ComboboxContent({
  className,
  side = "bottom",
  sideOffset = 6,
  align = "start",
  alignOffset = 0,
  anchor: anchorProp,
  ...props
}: ComboboxContentProps) {
  const { open, setOpen, triggerRef, inputRef, contentRef } =
    useContext(ComboboxContext);
  const floatingRef = useRef<HTMLDivElement>(null);

  // Use anchor prop if provided, else fall back to inputRef's parent (InputGroup), then triggerRef
  const anchorEl =
    anchorProp && "current" in anchorProp
      ? anchorProp.current
      : (anchorProp as HTMLElement | null) ??
        inputRef.current?.closest('[data-slot="input-group"]') ??
        triggerRef.current;

  const { x, y, placement } = useAnchorPosition({
    anchor: anchorEl as HTMLElement | null,
    floating: floatingRef.current,
    side,
    align: align === "center" ? "center" : align,
    sideOffset,
    alignOffset,
    open,
  });

  useOutsideClick(
    [triggerRef, inputRef, floatingRef],
    open,
    () => setOpen(false),
  );

  if (!open) return null;

  const actualSide = placement.split("-")[0];
  const anchorWidth = (anchorEl as HTMLElement)?.offsetWidth ?? 0;

  return (
    <Portal>
      <div
        ref={(el) => {
          (floatingRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
          (contentRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
        }}
        data-slot="combobox-content"
        data-sgn-capture="true"
        data-open=""
        data-side={actualSide}
        data-chips={!!anchorProp}
        data-floating-portal=""
        className={cn(
          "bg-popover text-popover-foreground data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0 data-closed:zoom-out-95 data-open:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 ring-foreground/10 *:data-[slot=input-group]:bg-input/30 *:data-[slot=input-group]:border-input/30 overflow-hidden rounded-lg shadow-md ring-1 duration-100 *:data-[slot=input-group]:m-1 *:data-[slot=input-group]:mb-0 *:data-[slot=input-group]:h-8 *:data-[slot=input-group]:shadow-none group/combobox-content relative max-h-[min(300px,calc(100vh-32px))] origin-(--transform-origin)",
          className,
        )}
        style={{
          position: "fixed",
          left: x,
          top: y,
          minWidth: anchorWidth + 28,
          ...(anchorProp ? { minWidth: anchorWidth } : {}),
        }}
        {...props}
      />
    </Portal>
  );
}

function ComboboxList({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  const { highlightedIndex, setHighlightedIndex, open, value, onValueChange, setOpen, inputRef, contentRef, multiple } =
    useContext(ComboboxContext);

  const getItems = useCallback(() => {
    return Array.from(
      contentRef.current?.querySelectorAll<HTMLElement>(
        '[data-slot="combobox-item"]:not([data-disabled])',
      ) ?? [],
    );
  }, [contentRef]);

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
        case "Enter": {
          e.preventDefault();
          const selected = items[highlightedIndex];
          if (selected) {
            const val = selected.getAttribute("data-value");
            if (val !== null) {
              if (multiple) {
                const currentValues = Array.isArray(value) ? value : [];
                const newValues = currentValues.includes(val)
                  ? currentValues.filter((v) => v !== val)
                  : [...currentValues, val];
                onValueChange(newValues);
              } else {
                onValueChange(val);
                setOpen(false);
              }
            }
          }
          break;
        }
        case "Escape":
          e.preventDefault();
          setOpen(false);
          inputRef.current?.focus();
          break;
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, highlightedIndex, setHighlightedIndex, getItems, value, onValueChange, setOpen, inputRef, multiple]);

  return (
    <div
      role="listbox"
      data-slot="combobox-list"
      className={cn(
        "no-scrollbar max-h-72 scroll-py-1 p-1 data-empty:p-0 overflow-y-auto overscroll-contain",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export interface ComboboxItemProps extends React.ComponentProps<"div"> {
  value: string;
  disabled?: boolean;
}

function ComboboxItem({
  className,
  children,
  value: itemValue,
  disabled,
  ...props
}: ComboboxItemProps) {
  const { value, onValueChange, setOpen, highlightedIndex, multiple, contentRef } =
    useContext(ComboboxContext);
  const itemRef = useRef<HTMLDivElement>(null);

  const isSelected = Array.isArray(value)
    ? value.includes(itemValue)
    : value === itemValue;

  // Determine if this item is highlighted
  const allItems = contentRef.current
    ? Array.from(
        contentRef.current.querySelectorAll<HTMLElement>(
          '[data-slot="combobox-item"]:not([data-disabled])',
        ),
      )
    : [];
  const myIndex = allItems.indexOf(itemRef.current!);
  const isHighlighted = myIndex >= 0 && myIndex === highlightedIndex;

  return (
    <div
      ref={itemRef}
      role="option"
      data-slot="combobox-item"
      data-value={itemValue}
      data-disabled={disabled ? "" : undefined}
      data-selected={isSelected ? "" : undefined}
      data-highlighted={isHighlighted ? "" : undefined}
      aria-selected={isSelected}
      className={cn(
        "data-highlighted:bg-accent data-highlighted:text-accent-foreground not-data-[variant=destructive]:data-highlighted:**:text-accent-foreground gap-2 rounded-md py-1 pr-8 pl-1.5 text-sm [&_svg:not([class*='size-'])]:size-4 relative flex w-full cursor-default items-center outline-hidden select-none data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
        className,
      )}
      onClick={() => {
        if (disabled) return;
        if (multiple) {
          const currentValues = Array.isArray(value) ? value : [];
          const newValues = currentValues.includes(itemValue)
            ? currentValues.filter((v) => v !== itemValue)
            : [...currentValues, itemValue];
          onValueChange(newValues);
        } else {
          onValueChange(itemValue);
          setOpen(false);
        }
      }}
      {...props}
    >
      {children}
      {isSelected && (
        <span className="pointer-events-none absolute right-2 flex size-4 items-center justify-center">
          <CheckIcon />
        </span>
      )}
    </div>
  );
}

function ComboboxGroup({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="combobox-group"
      className={cn(className)}
      {...props}
    />
  );
}

function ComboboxLabel({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="combobox-label"
      className={cn("text-muted-foreground px-2 py-1.5 text-xs", className)}
      {...props}
    />
  );
}

function ComboboxCollection({
  children,
  items,
  renderItem,
  ...props
}: React.ComponentProps<"div"> & {
  items?: unknown[];
  renderItem?: (item: unknown) => React.ReactNode;
}) {
  return (
    <div data-slot="combobox-collection" {...props}>
      {items && renderItem ? items.map(renderItem) : children}
    </div>
  );
}

function ComboboxEmpty({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="combobox-empty"
      className={cn(
        "text-muted-foreground hidden w-full justify-center py-2 text-center text-sm group-data-empty/combobox-content:flex",
        className,
      )}
      {...props}
    />
  );
}

function ComboboxSeparator({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      role="separator"
      data-slot="combobox-separator"
      className={cn("bg-border -mx-1 my-1 h-px", className)}
      {...props}
    />
  );
}

function ComboboxChips({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="combobox-chips"
      className={cn(
        "dark:bg-input/30 border-input focus-within:border-ring focus-within:ring-ring/50 has-aria-invalid:ring-destructive/20 dark:has-aria-invalid:ring-destructive/40 has-aria-invalid:border-destructive dark:has-aria-invalid:border-destructive/50 flex min-h-8 flex-wrap items-center gap-1 rounded-lg border bg-transparent bg-clip-padding px-2.5 py-1 text-sm transition-colors focus-within:ring-3 has-aria-invalid:ring-3 has-data-[slot=combobox-chip]:px-1",
        className,
      )}
      {...props}
    />
  );
}

function ComboboxChip({
  className,
  children,
  showRemove = true,
  value: chipValue,
  ...props
}: React.ComponentProps<"div"> & {
  showRemove?: boolean;
  value?: string;
}) {
  const { value, onValueChange, multiple } = useContext(ComboboxContext);

  return (
    <div
      data-slot="combobox-chip"
      className={cn(
        "bg-muted text-foreground flex h-[calc(--spacing(5.25))] w-fit items-center justify-center gap-1 rounded-sm px-1.5 text-xs font-medium whitespace-nowrap has-data-[slot=combobox-chip-remove]:pr-0 has-disabled:pointer-events-none has-disabled:cursor-not-allowed has-disabled:opacity-50",
        className,
      )}
      {...props}
    >
      {children}
      {showRemove && (
        <Button
          variant="ghost"
          size="icon-xs"
          data-slot="combobox-chip-remove"
          className="-ml-1 opacity-50 hover:opacity-100"
          onClick={() => {
            if (multiple && chipValue) {
              const currentValues = Array.isArray(value) ? value : [];
              onValueChange(currentValues.filter((v) => v !== chipValue));
            }
          }}
        >
          <CloseIcon />
        </Button>
      )}
    </div>
  );
}

function ComboboxChipsInput({
  className,
  ...props
}: React.ComponentProps<"input">) {
  const { setOpen, inputValue, setInputValue, inputRef, open } =
    useContext(ComboboxContext);

  return (
    <input
      ref={inputRef}
      data-slot="combobox-chip-input"
      className={cn("min-w-16 flex-1 outline-none", className)}
      value={inputValue}
      onChange={(e) => {
        setInputValue(e.target.value);
        if (!open) setOpen(true);
      }}
      {...props}
    />
  );
}

function useComboboxAnchor() {
  return React.useRef<HTMLDivElement | null>(null);
}

export {
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
  ComboboxGroup,
  ComboboxLabel,
  ComboboxCollection,
  ComboboxEmpty,
  ComboboxSeparator,
  ComboboxChips,
  ComboboxChip,
  ComboboxChipsInput,
  ComboboxTrigger,
  ComboboxValue,
  useComboboxAnchor,
};
