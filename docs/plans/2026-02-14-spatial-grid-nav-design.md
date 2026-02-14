# spatial-grid-nav Engine Rewrite Design

## Context

spatial-grid-nav is a keyboard navigation engine and UI primitive library used by Niri Settings. The current implementation (~6,000 lines) works but has significant limitations: no focus restoration across sections, no navigation interception hooks, and expensive DOM discovery on every keypress.

This design covers a clean rewrite as a **general-purpose, framework-agnostic spatial navigation library** with React bindings and navigation-aware UI primitives.

## Decision

Clean rewrite with an event-driven, coordinate-based architecture. Framework-agnostic core (pure TypeScript) with separate React bindings. Improved spatial algorithms with caching, a middleware pipeline for navigation interception, and per-section focus restoration.

## Non-Goals

- Nested group navigation — groups are always flat within a section
- Diagonal movement
- Voice/gesture input
- Non-React framework bindings (can be added later, but not in scope)

## Package Structure

```
packages/spatial-grid-nav/
├── src/
│   ├── core/               # Framework-agnostic engine (pure TS, no DOM framework deps)
│   │   ├── engine.ts       # NavigationEngine class
│   │   ├── graph.ts        # SpatialGraph — cached node positions + adjacency
│   │   ├── spatial.ts      # Spatial algorithms (scoring, direction filtering)
│   │   ├── focus.ts        # Focus management + per-section focus stacks
│   │   ├── keyboard.ts     # Key event capture + binding resolution
│   │   ├── middleware.ts   # Navigation middleware pipeline
│   │   ├── observer.ts     # MutationObserver + ResizeObserver for cache invalidation
│   │   └── types.ts        # All core types/interfaces
│   ├── react/              # React bindings
│   │   ├── provider.tsx    # NavigationProvider
│   │   ├── hooks.ts        # useNavigation, useIsActiveGroup, useNavigationEvent, useFocusRestoration
│   │   └── group.tsx       # NavigationGroup component
│   ├── primitives/         # Navigation-aware UI components
│   └── layouts/            # Layout presets (PageHeader, SettingsGroup, SettingsRow)
├── package.json
└── tsconfig.json
```

Exports:
- `spatial-grid-nav` — core engine
- `spatial-grid-nav/react` — React bindings
- `spatial-grid-nav/primitives` — UI components
- `spatial-grid-nav/layouts` — layout presets

## Core Engine

### NavigationEngine

The central class. Owns the spatial graph, focus state, keyboard listener, and middleware pipeline.

```typescript
const engine = new NavigationEngine(rootElement, {
  selectors: { group: '[data-sgn-group]', item: '...', section: '[data-sgn-section]' },
  keyBindings: { ... },
  middleware: [myMiddleware],
});

// Lifecycle
engine.attach();
engine.detach();
engine.destroy();

// Navigation
engine.navigate(direction);         // up / down / left / right
engine.focusGroup(strategy);        // first / last / next / prev
engine.enterGroup();
engine.exitGroup();

// Sections
engine.setActiveSection(id);
engine.restoreFocus(sectionId);

// Events
engine.on('willNavigate', handler);
engine.on('didNavigate', handler);
engine.on('sectionChange', handler);
engine.on('groupChange', handler);
engine.on('focusRestore', handler);
```

### SpatialGraph

A cached map of all navigable nodes and their positions within the active section.

**Build:** On `attach()` or section change, scans DOM for groups/items. Stores `{ element, rect, center, sectionId, parentGroup }` per node.

**Invalidation:** `MutationObserver` watches for DOM changes (added/removed nodes, attribute changes on group/section selectors). `ResizeObserver` watches for layout changes. Either marks the graph dirty.

**Lazy rebuild:** Graph rebuilds on the next navigation attempt after invalidation, not immediately. This coalesces rapid DOM changes (animations, list renders) into a single rebuild.

**Spatial queries:** `graph.findAdjacent(fromNode, direction)` filters candidates by direction using a configurable cone angle, scores by weighted distance (primary axis + secondary axis * 0.3), and tie-breaks by DOM order.

**Section scoping:** The graph only indexes nodes within the active section. Section switches trigger a full rebuild.

### Focus Management

**Focus stack:** Each section has a focus history entry:

```typescript
focusHistory: Map<string, { groupElement: Element, itemElement: Element | null }>
```

When a user navigates to a group/item, the stack updates. When `setActiveSection(id)` is called, the engine checks the history and restores focus. If the saved element is gone from the DOM, falls back to `focusGroup("first")`.

**Dual focus tracking:**
- **Active group** — which group container is "selected" (visual state via `data-sgn-active`)
- **Focused element** — the actual `document.activeElement`

These stay in sync: entering a group sets active group AND moves DOM focus. Clicking an item sets that item's parent group as active.

### Middleware Pipeline

Middleware intercepts, modifies, or cancels navigation actions.

```typescript
type NavigationAction = {
  type: 'navigate' | 'enterGroup' | 'exitGroup' | 'focusGroup' | 'sectionChange';
  direction?: Direction;
  from: { group: Element | null; item: Element | null; section: string };
  to: { group: Element | null; item: Element | null; section: string };
  cancelled: boolean;
};

type Middleware = (action: NavigationAction, next: () => void) => void;
```

Pipeline flow:
1. Key event → engine resolves to a `NavigationAction`
2. Action passes through middleware chain in order
3. If any middleware skips `next()` or sets `cancelled = true`, navigation stops
4. If action survives the chain, engine applies it (moves focus, updates state)
5. `didNavigate` event fires with the completed action

### Keyboard Handling

Captures `keydown` on `window` in capture phase. Default bindings (all customizable):

| Key | Action |
|-----|--------|
| Tab / Shift+Tab | Cycle items within active group |
| Escape | Exit group (focus group container) |
| Alt+Arrow | Navigate to adjacent group in that direction |
| Alt+Home / Alt+End | Focus first / last group |
| Ctrl+ArrowLeft / Ctrl+ArrowRight | Section navigation (emits event) |

## React Bindings

Thin bridge between the core engine and React.

**NavigationProvider:**
```tsx
<NavigationProvider
  root={containerRef}
  keyBindings={{ ... }}
  middleware={[myMiddleware]}
  onSectionNav={handler}
>
  {children}
</NavigationProvider>
```

Creates engine on mount, destroys on unmount. Exposes engine via context.

**Hooks:**
- `useNavigation()` — returns engine instance
- `useIsActiveGroup(ref)` — subscribes to group changes, returns boolean
- `useNavigationEvent(event, handler)` — subscribe to engine events with auto-cleanup
- `useFocusRestoration(sectionId)` — auto-save/restore focus on section mount/unmount

**NavigationGroup:**
```tsx
<NavigationGroup label="Display Settings">
  {/* focusable items */}
</NavigationGroup>
```

Adds `data-sgn-group`, manages `tabIndex`, forwards ref.

## Primitives

40+ UI components rewritten to participate in spatial navigation from the ground up.

### Tiers (build order)

| Tier | Components | Navigation behavior |
|------|-----------|---------------------|
| 1: Static | Button, Badge, Label, Separator, Skeleton, Card | Focusable items. Button handles Enter/Space. |
| 2: Interactive | Input, Textarea, Switch, Toggle, Slider, Checkbox, RadioGroup | Receive focus, handle value changes. Slider captures arrows internally. |
| 3: Overlay | Tooltip, Popover, Dialog, AlertDialog, Sheet | Focus trap when open. Engine pauses group nav. |
| 4: Selection | Select, DropdownMenu, Combobox, Tabs | Typeahead, arrow cycling. Engine yields to component's keyboard handling. |

### Key rules

1. **Engine yields to active controls.** When a Slider/Select/Combobox is active (open/editing), arrow keys belong to the component. The component sets `data-sgn-capture="true"` to signal this.

2. **Overlays pause the engine.** Dialogs/Sheets open → engine group navigation pauses. Overlay manages its own focus trap. On close, engine resumes and restores focus.

3. **Unstyled by default.** Ships with Tailwind-based default styles, fully customizable via className props and CSS variables.

### Layout presets

- `PageHeader` — section title + description
- `SettingsGroup` — wraps content in NavigationGroup with title/description
- `SettingsRow` — label + control layout

## Key Design Decisions

- **Coordinate-based (improved)** — measures DOM bounding rects with caching, cone-angle filtering, and better scoring. Most intuitive model for spatial navigation.
- **Framework-agnostic core** — pure TypeScript, no React dependency. React bindings are a separate export path.
- **General-purpose library** — designed to work in any keyboard-navigable UI, not just Niri Settings.
- **No nested groups** — groups are flat within a section. Keeps the model simple and predictable.
- **Lazy graph rebuilds** — coalesce DOM mutations, only rebuild on next navigation. Performance over freshness.
- **`data-sgn-capture`** — lets components opt out of engine keyboard handling when they need their own arrow key behavior.
