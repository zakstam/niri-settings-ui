import { createContext } from "react";
import type { NavigationEngine } from "../core/engine.js";

export const NavigationContext = createContext<NavigationEngine | null>(null);
