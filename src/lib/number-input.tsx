import { useCallback, type ComponentProps } from "react";
import { Input } from "spatial-grid-nav/primitives";

type InputProps = ComponentProps<typeof Input>;

interface NumberInputProps extends Omit<InputProps, "type" | "onBlur"> {
  /** Called with the clamped numeric value, or null if the field is cleared */
  onValueChange: (value: number | null) => void;
  /** Current numeric value (null renders as empty) */
  numericValue: number | null;
  /** Minimum allowed value */
  min?: number;
  /** Maximum allowed value */
  max?: number;
  step?: number;
  placeholder?: string;
}

/**
 * Number input that clamps typed values to min/max on blur.
 * Browser number inputs only enforce min/max on the spinner arrows,
 * not on direct keyboard entry — this component fills that gap.
 */
export function NumberInput({
  numericValue,
  onValueChange,
  min,
  max,
  step,
  placeholder,
  ...rest
}: NumberInputProps) {
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.value === "") {
        onValueChange(null);
      } else {
        onValueChange(Number(e.target.value));
      }
    },
    [onValueChange],
  );

  const handleBlur = useCallback(
    (e: React.FocusEvent<HTMLInputElement>) => {
      const raw = e.target.value;
      if (raw === "") return; // empty is valid (means "not set")
      const n = Number(raw);
      if (!Number.isFinite(n)) {
        onValueChange(null);
        return;
      }
      let clamped = n;
      if (min !== undefined && clamped < min) clamped = min;
      if (max !== undefined && clamped > max) clamped = max;
      if (clamped !== n) {
        onValueChange(clamped);
      }
    },
    [onValueChange, min, max],
  );

  return (
    <Input
      type="number"
      value={numericValue ?? ""}
      min={min}
      max={max}
      step={step}
      placeholder={placeholder}
      onChange={handleChange}
      onBlur={handleBlur}
      {...rest}
    />
  );
}
