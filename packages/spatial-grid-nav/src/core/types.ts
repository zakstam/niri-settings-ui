// ── Directions & Strategies ──

export type Direction = "up" | "down" | "left" | "right";

export type GroupStrategy = "first" | "last" | "next" | "prev";

// ── Selectors ──

export interface Selectors {
  group: string;
  item: string;
  section: string;
  capture: string;
}

export const DEFAULT_SELECTORS: Selectors = {
  group: "[data-sgn-group]",
  item: [
    "a[href]",
    "button:not([disabled])",
    "input:not([disabled]):not([type='hidden'])",
    "select:not([disabled])",
    "textarea:not([disabled])",
    "[tabindex]:not([tabindex='-1'])",
    "[role='button']:not([disabled])",
    "[role='switch']:not([disabled])",
    "[role='checkbox']:not([disabled])",
    "[role='radio']:not([disabled])",
    "[role='slider']:not([disabled])",
    "[role='combobox']:not([disabled])",
    "[role='tab']:not([disabled])",
  ].join(", "),
  section: "[data-sgn-section]",
  capture: "[data-sgn-capture='true']",
};

// ── Key Bindings ──

export interface KeyBindings {
  groupUp: string;
  groupDown: string;
  groupLeft: string;
  groupRight: string;
  groupFirst: string;
  groupLast: string;
  sectionNext: string;
  sectionPrev: string;
}

export const DEFAULT_KEY_BINDINGS: KeyBindings = {
  groupUp: "Alt+ArrowUp",
  groupDown: "Alt+ArrowDown",
  groupLeft: "Alt+ArrowLeft",
  groupRight: "Alt+ArrowRight",
  groupFirst: "Alt+Home",
  groupLast: "Alt+End",
  sectionNext: "Ctrl+ArrowRight",
  sectionPrev: "Ctrl+ArrowLeft",
};

// ── Spatial Graph ──

export interface GraphNode {
  element: HTMLElement;
  rect: DOMRect;
  center: { x: number; y: number };
  sectionId: string | null;
  parentGroup: HTMLElement | null;
}

// ── Navigation Actions & Middleware ──

export interface NavigationEndpoint {
  group: Element | null;
  item: Element | null;
  section: string;
}

export interface NavigationAction {
  type: "navigate" | "enterGroup" | "exitGroup" | "focusGroup" | "sectionChange";
  direction?: Direction;
  from: NavigationEndpoint;
  to: NavigationEndpoint;
  cancelled: boolean;
}

export type Middleware = (action: NavigationAction, next: () => void) => void;

// ── Engine Events ──

export type EngineEventMap = {
  willNavigate: (action: NavigationAction) => void;
  didNavigate: (action: NavigationAction) => void;
  sectionChange: (sectionId: string) => void;
  sectionNav: (direction: "next" | "prev") => void;
  groupChange: (group: HTMLElement | null) => void;
  focusRestore: (sectionId: string, group: HTMLElement) => void;
};

export type EngineEvent = keyof EngineEventMap;

// ── Focus History ──

export interface FocusHistoryEntry {
  groupElement: Element;
  itemElement: Element | null;
}

// ── Engine Config ──

export interface EngineConfig {
  selectors?: Partial<Selectors>;
  keyBindings?: Partial<KeyBindings>;
  middleware?: Middleware[];
}
