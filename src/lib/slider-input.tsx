import { Slider } from "spatial-grid-nav/primitives";
import { NumberInput } from "@/lib/number-input";

interface SliderInputProps {
  value: number;
  onValueChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  /** Value when the input is cleared (defaults to min) */
  fallback?: number;
  sliderClassName?: string;
  inputClassName?: string;
}

export function SliderInput({
  value,
  onValueChange,
  min,
  max,
  step,
  fallback,
  sliderClassName = "w-32",
  inputClassName = "w-20",
}: SliderInputProps) {
  return (
    <div className="flex items-center gap-3">
      <Slider
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={(val) => {
          const v = Array.isArray(val) ? val[0] : val;
          onValueChange(v);
        }}
        className={sliderClassName}
      />
      <NumberInput
        numericValue={value}
        min={min}
        max={max}
        step={step}
        className={inputClassName}
        onValueChange={(v) => onValueChange(v ?? fallback ?? min)}
      />
    </div>
  );
}
