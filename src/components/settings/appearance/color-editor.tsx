import { useState, useRef, useEffect, useCallback } from "react";
import { HexColorPicker } from "react-colorful";
import { Input } from "@/components/ui/input";

interface ColorEditorProps {
  value: string | null;
  onChange: (value: string) => void;
  label?: string;
}

export function ColorEditor({ value, onChange, label }: ColorEditorProps) {
  const [open, setOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const color = value ?? "#000000";

  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (
      popoverRef.current &&
      !popoverRef.current.contains(e.target as Node) &&
      buttonRef.current &&
      !buttonRef.current.contains(e.target as Node)
    ) {
      setOpen(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open, handleClickOutside]);

  return (
    <div className="flex items-center gap-2">
      {label && (
        <span className="text-xs text-muted-foreground shrink-0">{label}</span>
      )}
      <div className="relative">
        <button
          ref={buttonRef}
          type="button"
          className="size-8 shrink-0 rounded-md border border-border cursor-pointer"
          style={{ backgroundColor: color }}
          onClick={() => setOpen(!open)}
          aria-label="Pick color"
        />
        {open && (
          <div
            ref={popoverRef}
            className="absolute top-full left-0 z-50 mt-2 rounded-lg border border-border bg-popover p-3 shadow-lg"
          >
            <HexColorPicker color={color} onChange={onChange} />
          </div>
        )}
      </div>
      <Input
        value={color}
        placeholder="#000000"
        className="w-28 font-mono text-xs"
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
