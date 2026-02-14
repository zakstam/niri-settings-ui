import * as React from "react";
import { cn } from "./utils/cn.ts";
import { useControllable } from "./utils/use-controllable.ts";

export interface SwitchProps
  extends Omit<React.ComponentProps<"button">, "role" | "value" | "onChange"> {
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  size?: "sm" | "default";
  name?: string;
  value?: string;
  required?: boolean;
}

function Switch({
  className,
  checked: controlledChecked,
  defaultChecked = false,
  onCheckedChange,
  size = "default",
  disabled,
  name,
  value = "on",
  required,
  ...props
}: SwitchProps) {
  const [checked, setChecked] = useControllable(
    controlledChecked,
    defaultChecked,
    onCheckedChange,
  );

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      data-slot="switch"
      data-size={size}
      data-checked={checked ? "" : undefined}
      data-unchecked={!checked ? "" : undefined}
      data-disabled={disabled ? "" : undefined}
      disabled={disabled}
      className={cn(
        "data-checked:bg-primary data-unchecked:bg-input focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:aria-invalid:border-destructive/50 dark:data-unchecked:bg-input/80 shrink-0 rounded-full border border-transparent focus-visible:ring-3 aria-invalid:ring-3 data-[size=default]:h-[18.4px] data-[size=default]:w-[32px] data-[size=sm]:h-[14px] data-[size=sm]:w-[24px] peer group/switch relative inline-flex items-center transition-all outline-none after:absolute after:-inset-x-3 after:-inset-y-2 data-disabled:cursor-not-allowed data-disabled:opacity-50",
        className,
      )}
      onClick={() => {
        if (!disabled) setChecked(!checked);
      }}
      onKeyDown={(e) => {
        if (e.key === " ") {
          e.preventDefault();
          if (!disabled) setChecked(!checked);
        }
        props.onKeyDown?.(e);
      }}
      {...props}
    >
      <span
        data-slot="switch-thumb"
        data-checked={checked ? "" : undefined}
        data-unchecked={!checked ? "" : undefined}
        className="bg-background dark:data-unchecked:bg-foreground dark:data-checked:bg-primary-foreground rounded-full group-data-[size=default]/switch:size-4 group-data-[size=sm]/switch:size-3 group-data-[size=default]/switch:data-checked:translate-x-[calc(100%-2px)] group-data-[size=sm]/switch:data-checked:translate-x-[calc(100%-2px)] group-data-[size=default]/switch:data-unchecked:translate-x-0 group-data-[size=sm]/switch:data-unchecked:translate-x-0 pointer-events-none block ring-0 transition-transform"
      />
      {name && (
        <input
          type="hidden"
          name={name}
          value={checked ? value : ""}
          required={required}
        />
      )}
    </button>
  );
}

export { Switch };
