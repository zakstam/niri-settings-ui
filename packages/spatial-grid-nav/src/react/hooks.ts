import { useContext, useCallback, useEffect, useSyncExternalStore } from "react";
import type { NavigationEngine } from "../core/engine.js";
import type { EngineEvent, EngineEventMap } from "../core/types.js";
import { NavigationContext } from "./context.js";

/** Get the NavigationEngine from context */
export function useNavigation(): NavigationEngine | null {
  return useContext(NavigationContext);
}

/** Subscribe to whether a ref's element is the active group */
export function useIsActiveGroup(
  elementRef: React.RefObject<HTMLElement | null>,
): boolean {
  const engine = useNavigation();

  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      if (!engine) return () => {};
      return engine.on("groupChange", onStoreChange);
    },
    [engine],
  );

  const getSnapshot = useCallback(() => {
    if (!engine || !elementRef.current) return false;
    return engine.getActiveGroup() === elementRef.current;
  }, [engine, elementRef]);

  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}

/** Subscribe to a specific engine event with auto-cleanup */
export function useNavigationEvent<E extends EngineEvent>(
  event: E,
  handler: EngineEventMap[E],
): void {
  const engine = useNavigation();
  const handlerRef = { current: handler };
  handlerRef.current = handler;

  useEffect(() => {
    if (!engine) return;
    const wrapper = ((...args: any[]) => {
      (handlerRef.current as any)(...args);
    }) as EngineEventMap[E];
    return engine.on(event, wrapper);
  }, [engine, event]);
}

/** Auto-save/restore focus when a section mounts/unmounts */
export function useFocusRestoration(sectionId: string): void {
  const engine = useNavigation();

  useEffect(() => {
    if (!engine) return;
    engine.restoreFocus(sectionId);
  }, [engine, sectionId]);
}
