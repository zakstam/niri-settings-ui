import { useRef, useCallback } from "react";

const TYPEAHEAD_TIMEOUT = 500;

export function useTypeahead(
  getItems: () => HTMLElement[],
  onMatch: (item: HTMLElement) => void,
) {
  const bufferRef = useRef("");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleTypeahead = useCallback(
    (key: string) => {
      if (key.length !== 1) return false;

      if (timerRef.current) clearTimeout(timerRef.current);
      bufferRef.current += key.toLowerCase();

      timerRef.current = setTimeout(() => {
        bufferRef.current = "";
      }, TYPEAHEAD_TIMEOUT);

      const items = getItems();
      const match = items.find((item) => {
        const text = item.textContent?.toLowerCase() ?? "";
        return text.startsWith(bufferRef.current);
      });

      if (match) {
        onMatch(match);
        return true;
      }

      return false;
    },
    [getItems, onMatch],
  );

  const reset = useCallback(() => {
    bufferRef.current = "";
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  return { handleTypeahead, reset };
}
