import { useState, useRef, useEffect, useCallback } from "react";
import { HexColorPicker } from "react-colorful";
import { Input } from "spatial-grid-nav/primitives";

const HEX_RE = /^#[0-9a-f]{6}$/i;

interface ColorEditorProps {
  value: string | null;
  onChange: (value: string) => void;
  label?: string;
}

export function ColorEditor({ value, onChange, label }: ColorEditorProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value ?? "#000000");
  const popoverRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const color = value ?? "#000000";
  const isValid = HEX_RE.test(draft);

  // Sync draft when value changes externally (e.g. from color picker)
  useEffect(() => {
    setDraft(value ?? "#000000");
  }, [value]);

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

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") {
      setOpen(false);
      buttonRef.current?.focus();
    }
  }, []);

  useEffect(() => {
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
        document.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, [open, handleClickOutside, handleKeyDown]);

  return (
    <div className="flex items-center gap-2">
      {label && (
        <span className="text-xs text-muted-foreground shrink-0">{label}</span>
      )}
      <div className="relative">
        <button
          ref={buttonRef}
          type="button"
          className="size-8 shrink-0 rounded-md border border-border cursor-pointer focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none"
          style={{ backgroundColor: color }}
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          aria-label="Pick color"
        />
        {open && (
          <div
            ref={popoverRef}
            className="absolute top-full left-0 z-50 mt-2 rounded-lg border border-border bg-popover p-3 shadow-lg animate-in fade-in duration-150"
          >
            <HexColorPicker color={color} onChange={onChange} />
          </div>
        )}
      </div>
      <Input
        value={draft}
        placeholder="#000000"
        className="w-28 font-mono text-xs"
        aria-invalid={!isValid || undefined}
        onChange={(e) => {
          setDraft(e.target.value);
          if (HEX_RE.test(e.target.value)) {
            onChange(e.target.value);
          }
        }}
        onBlur={() => {
          if (!isValid) setDraft(color);
        }}
      />
    </div>
  );
}
