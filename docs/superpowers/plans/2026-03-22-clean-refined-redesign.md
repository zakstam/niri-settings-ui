# Clean & Refined Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Strip decorative effects (glass, grain, glows) from the niri-settings-ui, switch to system fonts for UI text, simplify component surfaces, and restructure SettingsGroup/SettingsRow for a clean, refined aesthetic.

**Architecture:** All changes are CSS and component-level. The design token system (oklch palette), state management, spatial navigation, and Tauri backend are untouched. Changes flow from global CSS → shared layout components → individual callers.

**Tech Stack:** React 19, TypeScript, Tailwind CSS 4, Tauri 2, spatial-grid-nav (workspace package)

**Spec:** `docs/superpowers/specs/2026-03-22-clean-refined-redesign-design.md`

**Verification command:** `cd /home/zak/Projects/niri-settings-ui && pnpm build`

---

### Task 1: Strip decorative CSS from index.css

**Files:**
- Modify: `src/index.css`

- [ ] **Step 1: Change font-sans to system font stack**

In `src/index.css`, line 123, change:
```css
--font-sans: 'JetBrains Mono Variable', ui-monospace, monospace;
```
to:
```css
--font-sans: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
```
Keep `--font-mono` unchanged on line 124.

- [ ] **Step 2: Remove glass/glow CSS custom properties from :root**

In the `:root` block, remove these lines:
```css
/* Glass tokens */
--glass-bg: oklch(0.18 0 0 / 45%);
--glass-border: oklch(1 0 0 / 10%);

/* Background glow orbs */
--glow-1: oklch(0.20 0 0 / 45%);
--glow-2: oklch(0.17 0 0 / 35%);
```

In the light mode block (`@media (prefers-color-scheme: light)`), remove:
```css
--glass-bg: oklch(1 0 0 / 60%);
--glass-border: oklch(0 0 0 / 10%);
--glow-1: oklch(0.92 0 0 / 50%);
--glow-2: oklch(0.90 0 0 / 40%);
```

- [ ] **Step 3: Remove glass/glow theme mappings**

In the `@theme inline` block, remove:
```css
--color-glass-bg: var(--glass-bg);
--color-glass-border: var(--glass-border);
```

- [ ] **Step 4: Remove background glow orbs from body**

Delete the entire block:
```css
/* ── Background glow orbs for frosted glass depth ── */
body {
    background-image:
        radial-gradient(ellipse 800px 600px at 8% 12%, var(--glow-1) 0%, transparent 70%),
        radial-gradient(ellipse 600px 500px at 92% 88%, var(--glow-2) 0%, transparent 70%);
    background-attachment: fixed;
}
```

- [ ] **Step 5: Remove glass surface utilities**

Delete the entire `.glass` block, `.glass-surface` block, and the `@supports not (backdrop-filter)` fallback block:
```css
/* ── Glass surface utilities ── */
.glass { ... }
.glass-surface { ... }
@supports not (backdrop-filter: blur(1px)) { ... }
```

- [ ] **Step 6: Remove grain texture overlay**

Delete the entire `body::before` block:
```css
/* ── Grain texture ── */
body::before { ... }
```

- [ ] **Step 7: Verify build**

Run: `cd /home/zak/Projects/niri-settings-ui && pnpm build`
Expected: Build succeeds. There will be Tailwind warnings about `glass-bg`, `glass-border` classes being used in components — that's fine, we'll fix those in subsequent tasks.

---

### Task 2: Update SettingsGroup component

**Files:**
- Modify: `packages/spatial-grid-nav/src/layouts/settings-group.tsx`

- [ ] **Step 1: Remove description prop and update className**

Replace the entire file content with:
```tsx
import * as React from "react";
import type { ReactNode } from "react";
import { NavigationGroup } from "../react/group.tsx";

interface SettingsGroupProps {
  title: string;
  children: ReactNode;
}

export function SettingsGroup({
  title,
  children,
}: SettingsGroupProps) {
  const titleId = React.useId();

  return (
    <NavigationGroup
      label={title}
      aria-labelledby={titleId}
      className="group rounded-xl border border-border bg-card transition-all duration-200 relative"
    >
      <div className="px-4 pt-4 pb-1">
        <h3
          id={titleId}
          className="text-xs font-medium text-muted-foreground"
        >
          {title}
        </h3>
      </div>
      <div>{children}</div>
    </NavigationGroup>
  );
}
```

Key changes: removed `glass` from className, `rounded-2xl` → `rounded-xl`, title uses `text-xs font-medium` (no uppercase/tracking), removed `description` prop, children wrapper has no `px-2 pb-2.5 space-y-0.5`.

- [ ] **Step 2: Verify build**

Run: `cd /home/zak/Projects/niri-settings-ui && pnpm build`
Expected: TypeScript errors about `description` prop being passed to `SettingsGroup` in multiple files. This is expected — we'll fix those in Task 4.

---

### Task 3: Update SettingsRow component

**Files:**
- Modify: `packages/spatial-grid-nav/src/layouts/settings-row.tsx`

- [ ] **Step 1: Update className — remove hover/rounded, add dividers**

Replace the row's outer `<div>` className from:
```
"group flex items-center justify-between gap-10 rounded-xl px-4 py-3.5 transition-colors hover:bg-accent-color-subtle"
```
to:
```
"group flex items-center justify-between gap-10 border-b border-border last:border-b-0 px-4 py-3 transition-colors"
```

- [ ] **Step 2: Verify build**

Run: `cd /home/zak/Projects/niri-settings-ui && pnpm build`
Expected: Build succeeds (or same TS errors from Task 2 about `description` — those are still expected).

---

### Task 4: Remove description prop from all SettingsGroup callers

**Files:**
- Modify: `src/components/settings/animations/animation-card.tsx`
- Modify: `src/components/settings/animations/index.tsx`
- Modify: `src/components/settings/input/keyboard-settings.tsx`
- Modify: `src/components/settings/input/focus-settings.tsx`
- Modify: `src/components/settings/appearance/border-settings.tsx`
- Modify: `src/components/settings/appearance/ring-settings.tsx`
- Modify: `src/components/settings/appearance/shadow-settings.tsx`
- Modify: `src/components/settings/appearance/tab-indicator-settings.tsx`
- Modify: `src/components/settings/appearance/insert-hint-settings.tsx`
- Modify: `src/components/settings/layout-section/index.tsx`
- Modify: `src/components/settings/layout-section/gaps-settings.tsx`
- Modify: `src/components/settings/layout-section/column-settings.tsx`
- Modify: `src/components/settings/layout-section/struts-settings.tsx`
- Modify: `src/components/settings/advanced/index.tsx`
- Modify: `src/components/settings/startup/index.tsx`
- Modify: `src/components/settings/workspaces/index.tsx`
- Modify: `src/components/settings/events-gestures/index.tsx`
- Modify: `src/components/settings/outputs/index.tsx`
- Modify: `src/components/settings/window-rules/index.tsx`
- Modify: `src/components/settings/key-bindings/index.tsx`

- [ ] **Step 1: Update AnimationCard — remove description from interface and forwarding**

In `src/components/settings/animations/animation-card.tsx`:
- Remove `description` from the `AnimationCardProps` interface (line 26)
- Remove `description` from the destructured props (line 29)
- Change line 96 from `<SettingsGroup title={label} description={description}>` to `<SettingsGroup title={label}>`

- [ ] **Step 2: Remove description from all AnimationCard callers**

In `src/components/settings/animations/index.tsx`, remove `description="..."` from all 11 `<AnimationCard>` usages (lines 83-93).

- [ ] **Step 3: Remove description from all remaining SettingsGroup callers**

For each of these files, remove the `description="..."` prop from every `<SettingsGroup>` call. Do NOT remove `description` from `<SettingsRow>` — those stay.

Files with `<SettingsGroup ... description="...">`:
- `input/keyboard-settings.tsx` (line 23: `description="X keyboard extension layout settings"`)
- `input/focus-settings.tsx` (lines 23, 77)
- `appearance/border-settings.tsx` (line 46)
- `appearance/ring-settings.tsx` (line 46)
- `appearance/shadow-settings.tsx` (line 28)
- `appearance/tab-indicator-settings.tsx` (line 51)
- `appearance/insert-hint-settings.tsx` (line 39)
- `layout-section/index.tsx` (line 23)
- `layout-section/gaps-settings.tsx` (line 11)
- `layout-section/column-settings.tsx` (line 265)
- `advanced/index.tsx` (lines 105, 174, 188, 207, 221)
- `workspaces/index.tsx` (lines 84-86 — check if description is on multiple lines)
- `events-gestures/index.tsx` (line 99 — the `EdgeGestureSettings` component passes `description` as a variable to `SettingsGroup`; also check the `SettingsGroup` calls around lines 220, 264, 275, 284, 286, 325, 327)

For `events-gestures/index.tsx`: The `EdgeGestureSettings` component has a `description` prop in its own interface that it forwards to `SettingsGroup`. Remove `description` from `EdgeGestureSettings`'s interface and its callers, same as was done for `AnimationCard`.

For all remaining files in the file list (`startup/index.tsx`, `workspaces/index.tsx`, `outputs/index.tsx`, `window-rules/index.tsx`, `key-bindings/index.tsx`, `struts-settings.tsx`, `insert-hint-settings.tsx`): grep for `SettingsGroup.*description` — only modify if matches are found.

- [ ] **Step 4: Verify build**

Run: `cd /home/zak/Projects/niri-settings-ui && pnpm build`
Expected: Build succeeds with no TypeScript errors. All `description` prop errors from Task 2 should now be resolved.

---

### Task 5: Update PageHeader component

**Files:**
- Modify: `packages/spatial-grid-nav/src/layouts/page-header.tsx`

- [ ] **Step 1: Remove accent bar and adjust styling**

Replace the entire file content with:
```tsx
interface PageHeaderProps {
  title: string;
  description?: string;
}

export function PageHeader({ title, description }: PageHeaderProps) {
  return (
    <div className="mb-6">
      <h2 className="text-2xl font-semibold tracking-tight text-foreground">
        {title}
      </h2>
      {description && (
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
      )}
    </div>
  );
}
```

Changes: removed accent bar div, `mb-8` → `mb-6`, `font-bold` → `font-semibold`.

- [ ] **Step 2: Verify build**

Run: `cd /home/zak/Projects/niri-settings-ui && pnpm build`
Expected: Build succeeds.

---

### Task 6: Update Header (Sidebar), Apply Bar, and Shortcuts Bar

**Files:**
- Modify: `src/components/layout/sidebar.tsx`
- Modify: `src/components/layout/apply-bar.tsx`
- Modify: `src/components/layout/shortcuts-bar.tsx`

- [ ] **Step 1: Update Sidebar header**

In `src/components/layout/sidebar.tsx`, change the `<header>` className (line 122) from:
```
"glass-surface flex h-14 w-full shrink-0 items-center border-b border-glass-border px-4 gap-3"
```
to:
```
"flex h-14 w-full shrink-0 items-center border-b border-border bg-sidebar px-4 gap-3"
```

- [ ] **Step 2: Update Apply Bar**

In `src/components/layout/apply-bar.tsx`:
- Delete the gradient accent line (line 58): `<div className="h-px bg-gradient-to-r from-transparent via-accent-color/30 to-transparent" />`
- Change the bar container className (line 60) from:
  ```
  "glass-surface border-t border-glass-border px-6 py-3.5"
  ```
  to:
  ```
  "border-t border-border bg-sidebar px-6 py-3.5"
  ```

- [ ] **Step 3: Update Shortcuts Bar**

Replace the entire `ShortcutsBar` component in `src/components/layout/shortcuts-bar.tsx`:
```tsx
import { Kbd } from "@/components/settings/key-bindings/kbd";

function Shortcut({ keys, label }: { keys: string[]; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center gap-0.5">
        {keys.map((key, i) => (
          <Kbd key={i}>{key}</Kbd>
        ))}
      </div>
      <span>{label}</span>
    </div>
  );
}

export function ShortcutsBar() {
  return (
    <div className="fixed bottom-4 right-4 z-20">
      <div className="flex items-center gap-4 rounded-lg border border-border bg-card px-3 py-1.5 text-[10px] text-muted-foreground opacity-60 transition-opacity hover:opacity-100">
        <Shortcut keys={['Ctrl', '←/→']} label="Section" />
        <Shortcut keys={['Alt', '↑↓←→']} label="Group" />
        <Shortcut keys={['Ctrl', 'S']} label="Save" />
        <Shortcut keys={['Ctrl', 'D']} label="Discard" />
      </div>
    </div>
  );
}
```

Changes: moved to bottom-right, glass → bg-card border, smaller text/padding, opacity fade, removed dividers, z-30 → z-20.

- [ ] **Step 4: Verify build**

Run: `cd /home/zak/Projects/niri-settings-ui && pnpm build`
Expected: Build succeeds.

---

### Task 7: Update Input Section — Tab Bar Container and Icons

**Files:**
- Modify: `src/components/settings/input/index.tsx`

- [ ] **Step 1: Update tab bar container class**

In `src/components/settings/input/index.tsx`, change the `NavigationGroup` className (line 31) from:
```
"glass rounded-2xl border border-transparent bg-card transition-all duration-200 relative p-2"
```
to:
```
"rounded-xl border border-border bg-card transition-all duration-200 relative p-2"
```

- [ ] **Step 2: Update tab icons**

In the same file:
- Change the Trackball tab import: replace `IconCircleDot` usage for Trackball with `IconBallBowling`. Add `IconBallBowling` to the import from `@tabler/icons-react` and remove the second `IconCircleDot` if it was only used for Trackball.
- Change the Touch tab: replace the second `IconHandFinger` usage with `IconHandClick`. Add `IconHandClick` to the import.

Current imports (line 13-18) use `IconCircleDot` for both Trackpoint and Trackball, and `IconHandFinger` for both Touchpad and Touch. After:
- `IconCircleDot` — Trackpoint only
- `IconBallBowling` — Trackball (new import)
- `IconHandFinger` — Touchpad only
- `IconHandClick` — Touch (new import)

- [ ] **Step 3: Verify build**

Run: `cd /home/zak/Projects/niri-settings-ui && pnpm build`
Expected: Build succeeds.

---

### Task 8: Final verification and cleanup

- [ ] **Step 1: Full build check**

Run: `cd /home/zak/Projects/niri-settings-ui && pnpm build`
Expected: Clean build with no errors.

- [ ] **Step 2: Grep for leftover glass/glow references**

Search for any remaining references to removed CSS classes:
```bash
cd /home/zak/Projects/niri-settings-ui && grep -r "glass\|glow-1\|glow-2\|glass-bg\|glass-border\|glass-surface" src/ packages/ --include="*.tsx" --include="*.ts" --include="*.css"
```
Expected: No matches in `.tsx`/`.ts` files. The only match should be in `index.css` if any stray references remain — clean those up.

- [ ] **Step 3: Verify no remaining description prop on SettingsGroup**

```bash
cd /home/zak/Projects/niri-settings-ui && grep -r "SettingsGroup.*description" src/ --include="*.tsx"
```
Expected: No matches.

- [ ] **Step 4: Lint check**

Run: `cd /home/zak/Projects/niri-settings-ui && pnpm lint`
Expected: No new lint errors introduced.
