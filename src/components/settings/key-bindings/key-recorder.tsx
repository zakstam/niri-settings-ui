import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { IconKeyboard } from "@tabler/icons-react";

interface KeyRecorderProps {
  value: string;
  onChange: (key: string) => void;
}

function keyEventToString(e: KeyboardEvent): string | null {
  const parts: string[] = [];

  if (e.ctrlKey || e.metaKey) parts.push("Ctrl");
  if (e.altKey) parts.push("Alt");
  if (e.shiftKey) parts.push("Shift");
  if (e.key === "Super" || e.key === "Meta") parts.push("Super");

  const ignoredKeys = [
    "Control",
    "Alt",
    "Shift",
    "Meta",
    "Super",
    "CapsLock",
    "NumLock",
    "ScrollLock",
  ];

  if (!ignoredKeys.includes(e.key)) {
    let keyName = e.key;

    // Normalize common keys
    if (keyName === " ") keyName = "Space";
    else if (keyName === "ArrowUp") keyName = "Up";
    else if (keyName === "ArrowDown") keyName = "Down";
    else if (keyName === "ArrowLeft") keyName = "Left";
    else if (keyName === "ArrowRight") keyName = "Right";
    else if (keyName === "Escape") keyName = "Escape";
    else if (keyName === "Enter") keyName = "Return";
    else if (keyName === "Backspace") keyName = "BackSpace";
    else if (keyName === "Delete") keyName = "Delete";
    else if (keyName === "Tab") keyName = "Tab";
    else if (keyName.length === 1) keyName = keyName.toUpperCase();

    parts.push(keyName);
    return parts.join("+");
  }

  return null;
}

export function KeyRecorder({ value, onChange }: KeyRecorderProps) {
  const [recording, setRecording] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const combo = keyEventToString(e);
      if (combo) {
        onChange(combo);
        setRecording(false);
      }
    },
    [onChange],
  );

  useEffect(() => {
    if (recording) {
      document.addEventListener("keydown", handleKeyDown, true);
      return () => document.removeEventListener("keydown", handleKeyDown, true);
    }
  }, [recording, handleKeyDown]);

  // Cancel recording on blur
  useEffect(() => {
    if (!recording) return;
    function handleClick(e: MouseEvent) {
      if (buttonRef.current && !buttonRef.current.contains(e.target as Node)) {
        setRecording(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [recording]);

  const keyParts = value ? value.split("+") : [];

  return (
    <div className="flex items-center gap-2">
      <div className="flex min-h-8 flex-1 flex-wrap items-center gap-1">
        {recording ? (
          <span className="text-sm text-muted-foreground animate-pulse">
            Press a key combination...
          </span>
        ) : keyParts.length > 0 ? (
          keyParts.map((part, i) => (
            <Badge key={i} variant="secondary">
              {part}
            </Badge>
          ))
        ) : (
          <span className="text-sm text-muted-foreground">No key set</span>
        )}
      </div>
      <Button
        ref={buttonRef}
        variant={recording ? "default" : "outline"}
        size="sm"
        onClick={() => setRecording(!recording)}
      >
        <IconKeyboard size={14} data-icon="inline-start" />
        {recording ? "Cancel" : "Record"}
      </Button>
    </div>
  );
}
