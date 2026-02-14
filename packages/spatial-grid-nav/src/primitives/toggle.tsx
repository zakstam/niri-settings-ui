import * as React from "react";
import { cn } from "./utils/cn.ts";
import { useControllable } from "./utils/use-controllable.ts";

const variantClasses = {
  default: "bg-transparent",
  outline: "border-input hover:bg-muted border bg-transparent",
} as const;

const sizeClasses = {
  default: "h-8 min-w-8 px-2",
  sm: "h-7 min-w-7 rounded-[min(var(--radius-md),12px)] px-1.5 text-[0.8rem]",
  lg: "h-9 min-w-9 px-2.5",
} as const;

export type ToggleVariant = keyof typeof variantClasses;
export type ToggleSize = keyof typeof sizeClasses;

export interface ToggleProps
  extends Omit<React.ComponentProps<"button">, "onChange"> {
  pressed?: boolean;
  defaultPressed?: boolean;
  onPressedChange?: (pressed: boolean) => void;
  variant?: ToggleVariant;
  size?: ToggleSize;
}

const baseClasses =
  "hover:text-foreground aria-pressed:bg-muted focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive data-[state=on]:bg-muted gap-1 rounded-lg text-sm font-medium transition-all [&_svg:not([class*='size-'])]:size-4 group/toggle hover:bg-muted inline-flex items-center justify-center whitespace-nowrap outline-none focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0";

export function toggleVariants({
  variant = "default",
  size = "default",
  className,
}: {
  variant?: ToggleVariant;
  size?: ToggleSize;
  className?: string;
} = {}) {
  return cn(baseClasses, variantClasses[variant], sizeClasses[size], className);
}

function Toggle({
  className,
  variant = "default",
  size = "default",
  pressed: controlledPressed,
  defaultPressed = false,
  onPressedChange,
  ...props
}: ToggleProps) {
  const [pressed, setPressed] = useControllable(
    controlledPressed,
    defaultPressed,
    onPressedChange,
  );

  return (
    <button
      type="button"
      data-slot="toggle"
      aria-pressed={pressed}
      data-state={pressed ? "on" : "off"}
      className={cn(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      onClick={() => setPressed(!pressed)}
      {...props}
    />
  );
}

export { Toggle };
