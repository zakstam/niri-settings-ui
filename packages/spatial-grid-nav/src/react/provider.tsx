import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type MutableRefObject,
} from "react";
import { NavigationEngine } from "../core/engine.js";
import type { EngineConfig } from "../core/types.js";
import { NavigationContext } from "./context.js";

export interface NavigationProviderProps {
  children: ReactNode;
  config?: EngineConfig;
  engineRef?: MutableRefObject<NavigationEngine | null>;
  onSectionNav?: (direction: "next" | "prev") => void;
  onActiveGroupChange?: (group: HTMLElement | null) => void;
}

export function NavigationProvider({
  children,
  config,
  engineRef,
  onSectionNav,
  onActiveGroupChange,
}: NavigationProviderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [engine, setEngine] = useState<NavigationEngine | null>(null);

  // Store callbacks in refs to avoid resubscribing
  const onSectionNavRef = useRef(onSectionNav);
  onSectionNavRef.current = onSectionNav;
  const onActiveGroupChangeRef = useRef(onActiveGroupChange);
  onActiveGroupChangeRef.current = onActiveGroupChange;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const eng = new NavigationEngine(container, config);

    eng.on("willNavigate", (action) => {
      if (action.type === "sectionChange" && action.direction) {
        onSectionNavRef.current?.(action.direction as "next" | "prev");
      }
    });

    eng.on("groupChange", (group) => {
      onActiveGroupChangeRef.current?.(group);
    });

    eng.attach();
    setEngine(eng);

    if (engineRef) {
      engineRef.current = eng;
    }

    return () => {
      eng.destroy();
      setEngine(null);
      if (engineRef) {
        engineRef.current = null;
      }
    };
  }, []); // Engine lives for the lifetime of the provider

  return (
    <NavigationContext.Provider value={engine}>
      <div ref={containerRef} style={{ display: "contents" }}>
        {children}
      </div>
    </NavigationContext.Provider>
  );
}
