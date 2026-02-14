import { useState, useCallback, useRef, useEffect } from "react";

export function useControllable<T>(
  controlled: T | undefined,
  defaultValue: T,
  onChange?: (value: T) => void,
): [T, (value: T | ((prev: T) => T)) => void] {
  const isControlled = controlled !== undefined;
  const [internal, setInternal] = useState(defaultValue);
  const value = isControlled ? controlled : internal;

  // Keep a ref to the latest onChange so we don't create stale closures
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  });

  const setValue = useCallback(
    (next: T | ((prev: T) => T)) => {
      const nextValue = typeof next === "function"
        ? (next as (prev: T) => T)(value)
        : next;

      if (!isControlled) {
        setInternal(nextValue);
      }
      onChangeRef.current?.(nextValue);
    },
    [isControlled, value],
  );

  return [value, setValue];
}
