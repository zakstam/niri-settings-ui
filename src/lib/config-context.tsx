import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { NiriConfig } from "./types";
import { readConfig, writeConfig, reloadNiri } from "./tauri";

interface ConfigContextValue {
  config: NiriConfig | null;
  originalConfig: NiriConfig | null;
  isLoading: boolean;
  error: string | null;
  isDirty: boolean;
  updateConfig: (
    updater: ((prev: NiriConfig) => NiriConfig) | Partial<NiriConfig>,
  ) => void;
  applyChanges: () => Promise<void>;
  discardChanges: () => void;
  clearError: () => void;
}

const ConfigContext = createContext<ConfigContextValue | null>(null);

function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a === null || b === null) return a === b;
  if (a === undefined || b === undefined) return a === b;
  if (typeof a !== typeof b) return false;

  if (Array.isArray(a)) {
    if (!Array.isArray(b)) return false;
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!deepEqual(a[i], b[i])) return false;
    }
    return true;
  }

  if (typeof a === "object") {
    const aObj = a as Record<string, unknown>;
    const bObj = b as Record<string, unknown>;
    const aKeys = Object.keys(aObj);
    const bKeys = Object.keys(bObj);
    if (aKeys.length !== bKeys.length) return false;
    for (const key of aKeys) {
      if (!Object.prototype.hasOwnProperty.call(bObj, key)) return false;
      if (!deepEqual(aObj[key], bObj[key])) return false;
    }
    return true;
  }

  return false;
}

function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj)) as T;
}

export function ConfigProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<NiriConfig | null>(null);
  const [originalConfig, setOriginalConfig] = useState<NiriConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setIsLoading(true);
        setError(null);
        const loaded = await readConfig();
        if (cancelled) return;
        setConfig(deepClone(loaded));
        setOriginalConfig(deepClone(loaded));
      } catch (err) {
        if (cancelled) return;
        const message =
          err instanceof Error ? err.message : String(err);
        setError(message);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  const isDirty = useMemo(() => {
    if (config === null || originalConfig === null) return false;
    return !deepEqual(config, originalConfig);
  }, [config, originalConfig]);

  const updateConfig = useCallback(
    (
      updater: ((prev: NiriConfig) => NiriConfig) | Partial<NiriConfig>,
    ) => {
      setConfig((prev) => {
        if (prev === null) return prev;
        if (typeof updater === "function") {
          return updater(prev);
        }
        return { ...prev, ...updater };
      });
    },
    [],
  );

  const applyChanges = useCallback(async () => {
    if (config === null) return;
    try {
      setError(null);
      await writeConfig(config);
      // Config file was written successfully — mark as clean
      setOriginalConfig(deepClone(config));
      try {
        await reloadNiri();
      } catch (reloadErr) {
        const message =
          reloadErr instanceof Error ? reloadErr.message : String(reloadErr);
        setError(`Config saved, but niri reload failed: ${message}`);
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : String(err);
      setError(message);
    }
  }, [config]);

  const discardChanges = useCallback(() => {
    if (originalConfig === null) return;
    setConfig(deepClone(originalConfig));
  }, [originalConfig]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const value = useMemo<ConfigContextValue>(
    () => ({
      config,
      originalConfig,
      isLoading,
      error,
      isDirty,
      updateConfig,
      applyChanges,
      discardChanges,
      clearError,
    }),
    [
      config,
      originalConfig,
      isLoading,
      error,
      isDirty,
      updateConfig,
      applyChanges,
      discardChanges,
      clearError,
    ],
  );

  return (
    <ConfigContext.Provider value={value}>{children}</ConfigContext.Provider>
  );
}

export function useConfig(): ConfigContextValue {
  const context = useContext(ConfigContext);
  if (context === null) {
    throw new Error("useConfig must be used within a ConfigProvider");
  }
  return context;
}
