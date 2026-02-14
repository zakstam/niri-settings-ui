import * as React from "react";
import { createContext, useContext, useRef, useCallback } from "react";
import { cn } from "./utils/cn.ts";
import { useControllable } from "./utils/use-controllable.ts";

interface TabsContextValue {
  value: string | undefined;
  onValueChange: (value: string) => void;
  orientation: "horizontal" | "vertical";
}

const TabsContext = createContext<TabsContextValue>({
  value: undefined,
  onValueChange: () => {},
  orientation: "horizontal",
});

export interface TabsProps extends Omit<React.ComponentProps<"div">, "defaultValue"> {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  orientation?: "horizontal" | "vertical";
}

function Tabs({
  className,
  value: controlledValue,
  defaultValue,
  onValueChange,
  orientation = "horizontal",
  ...props
}: TabsProps) {
  const [value, setValue] = useControllable(
    controlledValue,
    defaultValue ?? "",
    onValueChange,
  );

  return (
    <TabsContext.Provider
      value={{ value, onValueChange: setValue, orientation }}
    >
      <div
        data-slot="tabs"
        data-orientation={orientation}
        className={cn(
          "gap-2 group/tabs flex data-[orientation=horizontal]:flex-col",
          className,
        )}
        {...props}
      />
    </TabsContext.Provider>
  );
}

const listVariantClasses = {
  default: "bg-muted",
  line: "gap-1 bg-transparent",
} as const;

export type TabsListVariant = keyof typeof listVariantClasses;

export interface TabsListProps extends React.ComponentProps<"div"> {
  variant?: TabsListVariant;
}

export function tabsListVariants({
  variant = "default",
  className,
}: { variant?: TabsListVariant; className?: string } = {}) {
  return cn(
    "rounded-lg p-[3px] group-data-[orientation=horizontal]/tabs:h-8 group/tabs-list text-muted-foreground inline-flex w-fit items-center justify-center group-data-[orientation=vertical]/tabs:h-fit group-data-[orientation=vertical]/tabs:flex-col",
    listVariantClasses[variant],
    className,
  );
}

function TabsList({ className, variant = "default", ...props }: TabsListProps) {
  const { orientation, onValueChange } = useContext(TabsContext);
  const listRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const list = listRef.current;
      if (!list) return;

      const tabs = Array.from(
        list.querySelectorAll<HTMLElement>('[data-slot="tabs-trigger"]:not([disabled])'),
      );
      const currentIndex = tabs.indexOf(e.target as HTMLElement);
      if (currentIndex === -1) return;

      const isHorizontal = orientation === "horizontal";
      let nextIndex: number | null = null;

      switch (e.key) {
        case isHorizontal ? "ArrowRight" : "ArrowDown":
          nextIndex = (currentIndex + 1) % tabs.length;
          break;
        case isHorizontal ? "ArrowLeft" : "ArrowUp":
          nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
          break;
        case "Home":
          nextIndex = 0;
          break;
        case "End":
          nextIndex = tabs.length - 1;
          break;
        default:
          return;
      }

      const nextTab = tabs[nextIndex];
      if (!nextTab) return;

      const nextValue = nextTab.getAttribute("data-tab-value");
      if (!nextValue) return;

      e.preventDefault();
      nextTab.focus();
      onValueChange(nextValue);
    },
    [orientation, onValueChange],
  );

  return (
    <div
      ref={listRef}
      role="tablist"
      data-slot="tabs-list"
      data-variant={variant}
      aria-orientation={orientation}
      className={cn(
        "rounded-lg p-[3px] group-data-[orientation=horizontal]/tabs:h-8 group/tabs-list text-muted-foreground inline-flex w-fit items-center justify-center group-data-[orientation=vertical]/tabs:h-fit group-data-[orientation=vertical]/tabs:flex-col",
        listVariantClasses[variant],
        className,
      )}
      onKeyDown={handleKeyDown}
      {...props}
    />
  );
}

export interface TabsTriggerProps extends React.ComponentProps<"button"> {
  value: string;
}

function TabsTrigger({ className, value, ...props }: TabsTriggerProps) {
  const ctx = useContext(TabsContext);
  const [isFocused, setIsFocused] = React.useState(false);
  const isActive = ctx.value === value;

  return (
    <button
      type="button"
      role="tab"
      data-slot="tabs-trigger"
      data-active={isActive ? "" : undefined}
      aria-selected={isActive}
      tabIndex={-1}
      className={cn(
        "gap-1.5 rounded-md border border-transparent px-1.5 py-0.5 text-sm font-medium group-data-[variant=default]/tabs-list:data-active:shadow-sm group-data-[variant=line]/tabs-list:data-active:shadow-none [&_svg:not([class*='size-'])]:size-4 focus:border-ring focus:ring-ring/50 focus:outline-ring text-foreground/60 hover:text-foreground dark:text-muted-foreground dark:hover:text-foreground relative inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center whitespace-nowrap transition-all group-data-[orientation=vertical]/tabs:w-full group-data-[orientation=vertical]/tabs:justify-start focus:ring-[3px] focus:outline-1 focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:outline-ring focus-visible:ring-[3px] focus-visible:outline-1 disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
        "group-data-[variant=line]/tabs-list:bg-transparent group-data-[variant=line]/tabs-list:data-active:bg-transparent dark:group-data-[variant=line]/tabs-list:data-active:border-transparent dark:group-data-[variant=line]/tabs-list:data-active:bg-transparent",
        "data-active:bg-background dark:data-active:text-foreground dark:data-active:border-input dark:data-active:bg-input/30 data-active:text-foreground",
        "after:bg-foreground after:absolute after:opacity-0 after:transition-opacity group-data-[orientation=horizontal]/tabs:after:inset-x-0 group-data-[orientation=horizontal]/tabs:after:bottom-[-5px] group-data-[orientation=horizontal]/tabs:after:h-0.5 group-data-[orientation=vertical]/tabs:after:inset-y-0 group-data-[orientation=vertical]/tabs:after:-right-1 group-data-[orientation=vertical]/tabs:after:w-0.5 group-data-[variant=line]/tabs-list:data-active:after:opacity-100",
        className,
      )}
      data-tab-value={value}
      onFocus={() => {
        setIsFocused(true);
        ctx.onValueChange(value);
      }}
      onBlur={() => setIsFocused(false)}
      onClick={() => ctx.onValueChange(value)}
      style={
        isFocused
          ? {
              borderColor: "var(--color-control-border-focus)",
              boxShadow: "0 0 0 3px var(--color-control-ring-focus)",
            }
          : undefined
      }
      {...props}
    />
  );
}

export interface TabsContentProps extends React.ComponentProps<"div"> {
  value: string;
}

function TabsContent({ className, value, ...props }: TabsContentProps) {
  const ctx = useContext(TabsContext);
  if (ctx.value !== value) return null;

  return (
    <div
      role="tabpanel"
      data-slot="tabs-content"
      tabIndex={-1}
      className={cn("text-sm flex-1 outline-none", className)}
      {...props}
    />
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent };
