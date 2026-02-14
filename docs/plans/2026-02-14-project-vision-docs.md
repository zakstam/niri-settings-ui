# Project Vision Documents Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Write the two project documents (`docs/PROJECT.md` and `docs/ROADMAP.md`) as defined in the design at `docs/plans/2026-02-14-project-vision-design.md`.

**Architecture:** Two standalone Markdown documents in `docs/`. PROJECT.md is the stable identity/architecture reference. ROADMAP.md is the evolving vision/milestones document. Both are linked from the existing README.md.

**Tech Stack:** Markdown documents, git

---

### Task 1: Write `docs/PROJECT.md`

**Files:**
- Create: `docs/PROJECT.md`

**Step 1: Write the document**

Create `docs/PROJECT.md` with the following content:

```markdown
# Niri Settings

**A graphical settings editor for the [Niri](https://github.com/YaLTeR/niri) Wayland compositor.**

Niri Settings is an independent community project that provides a complete graphical interface for configuring Niri. Its core mission is accessibility — making Niri usable for people who don't want to hand-edit KDL configuration files.

## Design Principles

### Keyboard-First

Spatial navigation is a first-class citizen. The app ships a custom `spatial-grid-nav` system that lets users reach every setting without a mouse. Arrow keys move between controls, Enter activates them, and Escape backs out. This isn't an afterthought bolted onto a mouse-driven UI — it's the foundational interaction model.

### Non-Destructive Editing

Changes are staged locally and only written to disk when the user explicitly clicks Apply. A diff preview shows exactly what will change. The Rust backend preserves the original KDL formatting and comments wherever possible, so hand-edited config files aren't mangled.

### Complete Coverage

The goal is to support every Niri config option so that no user ever needs to open a text editor. If Niri supports a setting, Niri Settings should expose it.

### Accessibility as Mission

The project exists to lower two barriers:
- **Input barriers** — keyboard-driven navigation means the app works well for users who rely on keyboard input.
- **Knowledge barriers** — no config syntax to learn. Settings are presented with labels, descriptions, and sensible defaults.

## Architecture

### Tech Stack

| Layer    | Technology                                           |
|----------|------------------------------------------------------|
| Frontend | React 19, TypeScript, Tailwind CSS 4, Vite           |
| Backend  | Rust, Tauri 2                                        |
| Config   | KDL 6 parser/writer                                  |
| Nav      | Custom `spatial-grid-nav` package (workspace package) |
| Icons    | Tabler Icons                                         |
| Fonts    | JetBrains Mono, Inter                                |

### Config Pipeline

```
~/.config/niri/config.kdl
        │
        ▼
   Rust KDL Parser (parser.rs)
        │
        ▼
   Rust Config Structs (types.rs)
        │
        ▼
   JSON over Tauri IPC
        │
        ▼
   React ConfigProvider Context
        │
        ▼
   UI Components (settings sections)
        │
        ▼
   User edits → dirty state tracked
        │
        ▼
   Apply → JSON over IPC → Rust Writer (writer.rs)
        │
        ▼
   KDL written to disk → niri reloaded
```

### IPC Commands

The Rust backend exposes these commands to the frontend:

- `read_config()` — Load config from `~/.config/niri/config.kdl`
- `write_config(config)` — Write the config back to disk, preserving formatting
- `get_config_diff(config)` — Generate a unified diff preview of pending changes
- `get_outputs()` — Query connected displays from the running Niri instance
- `get_workspaces()` — Query workspace info from the running Niri instance
- `reload_niri()` — Signal Niri to reload its config via `niri msg action load-config-file`

### State Management

The app uses a React Context (`ConfigProvider`) that wraps the entire application:

- `config` — the current working config (user's edits)
- `originalConfig` — the last-saved config snapshot
- `isDirty` — whether unsaved changes exist
- `updateConfig()` — update a config value (shallow or deep)
- `applyChanges()` — write to disk and reload Niri
- `discardChanges()` — revert to the last-saved state

An `ApplyBar` appears when changes are pending, offering Apply, Discard, and Preview Diff actions.

## Settings Sections

| Section           | What it configures                                                         |
|-------------------|----------------------------------------------------------------------------|
| Input             | Keyboard repeat, touchpad gestures, mouse acceleration, trackpoint, trackball, tablet, touch, focus-follows-mouse |
| Outputs           | Display resolution, scale, position, transform, and a visual layout graph  |
| Layout            | Gaps between windows, default column widths/heights, background color      |
| Appearance        | Focus ring, border, shadow, tab indicator, and insert hint styles with full color/gradient editors |
| Window Rules      | Per-application behavior: floating, maximized, fullscreen, opacity, min/max dimensions, and match criteria |
| Key Bindings      | Keyboard shortcut editor with action picker, argument configuration, and key recorder |
| Animations        | Animation timing curves and durations for window/workspace transitions     |
| Workspaces        | Named workspace configuration                                             |
| Events & Gestures | Gesture and event handler configuration                                    |
| Startup           | Programs and commands to launch when the compositor starts                 |
| Advanced          | Other compositor settings                                                  |

## Project Info

- **License:** MIT
- **Repository:** [github.com/zakstam/niri-settings-ui](https://github.com/zakstam/niri-settings-ui)
- **Status:** Functional — actively developed
- **Relationship to Niri:** Independent community project, not affiliated with or endorsed by the Niri project
```

**Step 2: Verify the file was written correctly**

Run: `wc -l docs/PROJECT.md`
Expected: ~110-120 lines

**Step 3: Commit**

```bash
git add docs/PROJECT.md
git commit -m "docs: add project specification document

Describes project identity, design principles (keyboard-first,
non-destructive editing, complete coverage, accessibility),
architecture overview, and current feature coverage."
```

---

### Task 2: Write `docs/ROADMAP.md`

**Files:**
- Create: `docs/ROADMAP.md`

**Step 1: Write the document**

Create `docs/ROADMAP.md` with the following content:

```markdown
# Roadmap

Niri Settings aims to be the definitive graphical interface for Niri configuration — making the compositor accessible to everyone, regardless of their comfort level with config files. Every Niri user should be able to configure their compositor without ever opening a text editor.

## Phases

### Phase 1: Polish & Stability *(current)*

The core settings UI is functional. This phase focuses on making it solid.

- **UX refinements** — smooth out rough edges, improve feedback for user actions, refine spatial navigation flow
- **Accessibility audit** — screen reader support, contrast ratios, focus indicators, ARIA attributes
- **Error handling** — graceful recovery from malformed configs, clear error messages, validation before write
- **Testing infrastructure** — unit tests for the Rust parser/writer, integration tests for IPC commands, frontend component tests

### Phase 2: Feature Completeness

Cover the remaining Niri config options that aren't yet exposed in the UI.

- Environment variable configuration
- Debug and experimental options
- Advanced window rule match conditions
- Full animation customization (all easing curves, per-animation overrides)
- Any new settings added to future Niri releases

### Phase 3: Distribution

Make the app easy to install.

- **Packaging strategy** — evaluate Flatpak, distro-specific packages (AUR, COPR, Nix), and AppImage. Decision TBD.
- **CI/CD** — automated builds and releases on tag push
- **Installation docs** — clear instructions for each supported method

### Phase 4: Ecosystem Integration

Deepen the relationship between the app and the running compositor.

- **Live preview** — apply changes temporarily and revert if the user doesn't confirm (similar to display settings confirmation dialogs)
- **Config import/export** — share configs as portable files
- **Theme presets** — bundled appearance presets users can apply with one click
- **Deeper Niri IPC** — leverage more of Niri's IPC capabilities as they evolve

## Contributing

### Dev Environment Setup

```sh
# Clone and install
git clone https://github.com/zakstam/niri-settings-ui.git
cd niri-settings-ui
pnpm install

# Run in development mode
pnpm tauri dev
```

Prerequisites: Node.js, pnpm, Rust toolchain, and Tauri 2 system dependencies (see [Tauri prerequisites](https://v2.tauri.app/start/prerequisites/)).

### Architecture Quick Reference

- **Frontend** — `src/` — React components, state management, Tauri IPC bridge
- **Backend** — `src-tauri/src/` — Rust config parser/writer, IPC command handlers
- **Config parser** — `src-tauri/src/config/parser.rs` — KDL to Rust structs
- **Config writer** — `src-tauri/src/config/writer.rs` — Rust structs back to KDL with formatting preservation
- **Type definitions** — `src-tauri/src/config/types.rs` (Rust) and `src/lib/types.ts` (TypeScript)
- **State management** — `src/lib/config-context.tsx` — React Context with dirty tracking
- **Spatial navigation** — `packages/spatial-grid-nav/` — custom keyboard nav package

See [docs/PROJECT.md](PROJECT.md) for full architecture details.

### Areas That Need Help

- Testing — the project currently has minimal test coverage
- Accessibility — a11y audit and improvements
- Packaging — experience with Flatpak, RPM/DEB packaging, Nix
- Documentation — user-facing docs and guides
- Niri config coverage — identifying and implementing missing settings

## Non-Goals

- **Not a general Wayland settings tool.** This project configures Niri specifically. It won't grow to support Sway, Hyprland, or other compositors.
- **Not a compositor.** This is a settings editor, not a window manager. It reads and writes a config file and talks to a running Niri instance over IPC.
- **Not a replacement for the config file.** The KDL config remains the source of truth. This app is a frontend for editing it. Power users who prefer text editing can continue doing so — the app preserves their formatting.
```

**Step 2: Verify the file was written correctly**

Run: `wc -l docs/ROADMAP.md`
Expected: ~80-90 lines

**Step 3: Commit**

```bash
git add docs/ROADMAP.md
git commit -m "docs: add project roadmap

Covers phased milestones (polish, feature completeness, distribution,
ecosystem integration), contribution guide, and non-goals."
```

---

### Task 3: Link documents from README.md

**Files:**
- Modify: `README.md`

**Step 1: Add documentation links to the README**

In `README.md`, add a new section after the "Tech Stack" section and before "License":

```markdown
## Documentation

- [Project Specification](docs/PROJECT.md) — design principles, architecture, and feature overview
- [Roadmap](docs/ROADMAP.md) — vision, milestones, and how to contribute
```

**Step 2: Verify the edit**

Run: `grep -c "Documentation" README.md`
Expected: 1

**Step 3: Commit**

```bash
git add README.md
git commit -m "docs: link PROJECT.md and ROADMAP.md from README"
```
