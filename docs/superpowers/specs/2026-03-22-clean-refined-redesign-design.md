# Clean & Refined Redesign — Design Spec

## Summary

Strip the decorative layer (glass, grain, glow orbs) from the niri-settings-ui interface and replace it with a clean, refined aesthetic. Switch from monospace-everywhere to a system font stack for UI text, simplify card grouping, and restructure several components for clarity and readability.

## Motivation

The current interface layers decorative effects (backdrop-filter blur, SVG grain texture, radial gradient glow orbs, glassmorphism) that add visual noise to what is fundamentally a utilitarian settings app for a tiling window manager. The monospace font used for all text hurts readability at small sizes. Visual hierarchy is flat — group titles, row labels, and descriptions all compete for attention.

## Design Direction

**Clean & Refined** — Minimal decoration, warm and polished. Subtle card groups with light borders. Proportional font for UI, monospace only for values. No glass/grain/glows. Solid backgrounds throughout.

Reference feel: Apple Settings + System76 COSMIC Settings.

## Changes

### 1. Surface System

**Remove:**
- `body::before` grain texture overlay (SVG noise filter at opacity 0.018)
- `body` background-image radial gradients (glow orbs)
- `.glass` class — backdrop-filter blur(20px), saturate(1.15), glass box-shadow
- `.glass-surface` class — backdrop-filter blur(24px), saturate(1.2)
- `@supports not (backdrop-filter)` fallback block (no longer needed)
- `--glass-bg`, `--glass-border`, `--glow-1`, `--glow-2` CSS custom properties

**Replace with:**
- Solid backgrounds using existing tokens (`--background`, `--sidebar`, `--card`)
- Card surfaces: `background: var(--card)`, `border: 1px solid var(--border)`, no box-shadow
- Header: solid `background: var(--sidebar)`, `border-bottom: 1px solid var(--border)`
- Apply bar: solid `background: var(--sidebar)`, `border-top: 1px solid var(--border)`

**Keep unchanged:**
- oklch monochrome color palette (both dark and light mode values)
- `--control-bg`, `--control-border`, `--control-*` tokens
- `.control-inset` and `.control-raised` shadow utilities
- Custom scrollbar styling
- Selection styling
- Spatial grid navigation focus states

### 2. Typography

**Font stack change in `index.css`:**
- `--font-sans`: change from `'JetBrains Mono Variable', ui-monospace, monospace` to `-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif`
- `--font-mono`: keep as `'JetBrains Mono Variable', ui-monospace, monospace`
- Keep `@import "@fontsource-variable/jetbrains-mono"` — it's still needed for `--font-mono` on value elements

**Where monospace appears:**
- Input fields containing config values (type="text" and type="number" in settings rows)
- Key binding display (`Kbd` component)
- Diff preview in the apply bar dialog (`<pre>` block)
- XKB layout names, config path strings

**Where monospace is removed:**
- All headings (PageHeader, SettingsGroup titles)
- All labels and descriptions (SettingsRow)
- Navigation tabs and buttons
- Apply bar text and buttons
- Shortcuts bar text

### 3. SettingsGroup Component

**File:** `packages/spatial-grid-nav/src/layouts/settings-group.tsx`

**Changes:**
- Remove `glass` from className
- Change className to: `"group rounded-xl border border-border bg-card transition-all duration-200 relative"`
- Group title: change from `text-[11px] font-semibold uppercase tracking-wider text-muted-foreground` to `text-xs font-medium text-muted-foreground` (sentence case, no uppercase/tracking)
- Remove the `description` prop and its rendering — group titles should be self-explanatory
- Adjust padding: title area `px-4 pt-4 pb-1`, children wrapper `px-0 pb-0`
- Remove `space-y-0.5` from children wrapper — row dividers (added in Section 4) replace the gap spacing

**SettingsGroup interface becomes:**
```typescript
interface SettingsGroupProps {
  title: string;
  children: ReactNode;
}
```

### 4. SettingsRow Component

**File:** `packages/spatial-grid-nav/src/layouts/settings-row.tsx`

**Changes:**
- Remove `hover:bg-accent-color-subtle` and `rounded-xl` from className (rounded corners conflict with border-b dividers)
- Add row dividers: `border-b border-border last:border-b-0`
- Adjust padding: `px-4 py-3` (from `px-4 py-3.5`)
- Keep `gap-10` between label and control

**Updated className:**
```
"group flex items-center justify-between gap-10 border-b border-border last:border-b-0 px-4 py-3 transition-colors"
```

### 5. PageHeader Component

**File:** `packages/spatial-grid-nav/src/layouts/page-header.tsx`

**Changes:**
- Remove the accent bar: delete `<div className="mt-4 h-0.5 w-10 rounded-full bg-accent-color/40" />`
- Reduce bottom margin: `mb-6` (from `mb-8`)
- Title: `text-2xl font-semibold tracking-tight` (change `font-bold` to `font-semibold`)

### 6. Header (Sidebar Component)

**File:** `src/components/layout/sidebar.tsx`

**Changes:**
- Replace `glass-surface` with `bg-sidebar` in header className
- Remove `border-glass-border`, use `border-border` instead
- Everything else stays: nav strip, logo, label toggle, tooltips, overflow detection

**Updated header className:**
```
"flex h-14 w-full shrink-0 items-center border-b border-border bg-sidebar px-4 gap-3"
```

### 7. Apply Bar

**File:** `src/components/layout/apply-bar.tsx`

**Changes:**
- Replace `glass-surface` with `bg-sidebar` in the bar container
- Replace `border-glass-border` with `border-border`
- Remove the gradient accent line: delete `<div className="h-px bg-gradient-to-r from-transparent via-accent-color/30 to-transparent" />`

### 8. Shortcuts Bar

**File:** `src/components/layout/shortcuts-bar.tsx`

**Changes:**
- Move from bottom-center to bottom-right: change positioning from `left-1/2 -translate-x-1/2` to `right-4`
- Replace `glass` class with `bg-card border border-border`
- Reduce size: `text-[10px]`, padding `px-3 py-1.5` (from `px-5 py-2.5`)
- Add fade behavior: `opacity-60 hover:opacity-100 transition-opacity`
- Reduce border radius: `rounded-lg` (from `rounded-xl`)
- Remove divider lines between shortcuts to save space
- Reduce z-index to `z-20` (below apply bar's z-40)

### 9. Input Section Tab Bar Container

**File:** `src/components/settings/input/index.tsx`

The `NavigationGroup` wrapping the `TabsList` uses `glass rounded-2xl`. Update to match the new surface system:
- Remove `glass` class
- Change `rounded-2xl` to `rounded-xl`
- Keep `border border-transparent bg-card`

### 10. Input Section Tab Icons

**File:** `src/components/settings/input/index.tsx`

**Changes:**
- Trackball tab: change `IconCircleDot` to `IconBallBowling`
- Touch tab: change `IconHandFinger` to `IconHandClick`

### 11. Callers of SettingsGroup `description` Prop

Since the `description` prop is being removed from `SettingsGroup`, all call sites passing `description` need to be updated to remove that prop. The group title should be made self-explanatory if it isn't already.

**Cascading change:** `AnimationCard` (`src/components/settings/animations/animation-card.tsx`) accepts a `description` prop in its own interface and forwards it to `SettingsGroup`. Its interface must also be updated to remove `description`, and all `AnimationCard` callers (in `animations/index.tsx`) must drop the prop.

**Affected files (non-exhaustive):** `border-settings.tsx`, `ring-settings.tsx`, `animation-card.tsx`, `animations/index.tsx`, `keyboard-settings.tsx`, `touchpad-settings.tsx`, `mouse-settings.tsx`, `trackpoint-settings.tsx`, `trackball-settings.tsx`, `tablet-settings.tsx`, `touch-settings.tsx`, `focus-settings.tsx`, `outputs/index.tsx`, `startup/index.tsx`, `advanced/index.tsx`, `window-rules/index.tsx`, `key-bindings/index.tsx`, `events-gestures/index.tsx`. All layout section files should also be checked.

## Files Modified

1. `src/index.css` — surface system, typography, remove glass/grain/glow
2. `packages/spatial-grid-nav/src/layouts/settings-group.tsx` — remove glass, simplify title
3. `packages/spatial-grid-nav/src/layouts/settings-row.tsx` — dividers, remove hover/rounded
4. `packages/spatial-grid-nav/src/layouts/page-header.tsx` — remove accent bar
5. `src/components/layout/sidebar.tsx` — solid header background
6. `src/components/layout/apply-bar.tsx` — solid background, remove gradient
7. `src/components/layout/shortcuts-bar.tsx` — reposition, quiet down
8. `src/components/settings/input/index.tsx` — tab bar container + unique tab icons
9. `src/components/settings/animations/animation-card.tsx` — remove description prop
10. All files passing `description` to `SettingsGroup` or `AnimationCard` — remove prop

## What Does NOT Change

- Section transition animations (spring-based slide)
- Spatial grid navigation system
- Config state management (ConfigProvider, useConfig)
- Tauri backend integration
- Navigation strip behavior (overflow detection, label toggle, tooltips)
- oklch color values (dark and light mode)
- Section content and settings logic
- Control component styling (inputs, switches, sliders, buttons)
- Keyboard shortcuts functionality
