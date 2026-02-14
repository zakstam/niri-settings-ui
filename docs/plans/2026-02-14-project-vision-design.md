# Project Vision Document Design

## Context

Niri Settings UI is a graphical settings editor for the Niri Wayland compositor, built with Tauri 2 (Rust backend + React/TypeScript frontend). The project is an independent community effort focused on making Niri accessible to users who don't want to hand-edit KDL configuration files.

The project is currently functional with 11 settings sections, full KDL config parsing/writing, a custom spatial-grid-nav keyboard navigation system, live diff preview, and an apply/discard workflow.

## Decision

Create two separate documents:

1. **Project Specification** (`docs/PROJECT.md`) — Stable identity document describing what the project is, its design principles, and architecture.
2. **Roadmap** (`docs/ROADMAP.md`) — Evolving document describing where the project is going, phased milestones, and contribution opportunities.

This split keeps the stable project identity separate from the frequently-changing plans.

## Document 1: Project Specification (`docs/PROJECT.md`)

### Structure

**1. Project Identity**
- Name and tagline: "A graphical settings editor for the Niri Wayland compositor"
- Core mission: Make Niri accessible to users who don't want to hand-edit KDL config files
- Relationship to Niri: Independent community project

**2. Design Principles**
- **Keyboard-first**: Spatial navigation is a first-class citizen via a custom spatial-grid-nav system. Every setting is reachable without a mouse.
- **Non-destructive editing**: Changes are staged locally, previewed via diff, and only written when explicitly applied. Original config formatting is preserved.
- **Complete coverage goal**: Aim to support every Niri config option so users never need to touch KDL directly.
- **Accessibility as mission**: The project exists to lower barriers — input-method barriers (keyboard nav) and knowledge barriers (no config syntax to learn).

**3. Architecture Overview**
- Tech stack: Tauri 2 (Rust backend + React 19 frontend), Tailwind CSS, Vite
- Config pipeline: KDL file → Rust parser → JSON over IPC → React state → Rust writer → KDL file
- State management: React Context with dirty tracking and apply/discard pattern
- IPC commands: read_config, write_config, get_config_diff, get_outputs, get_workspaces, reload_niri
- Custom spatial-grid-nav package for keyboard-driven navigation

**4. Current Feature Coverage**
Brief description of all 11 settings sections:
- Input (keyboard, touchpad, mouse, trackpoint, trackball, tablet, touch, focus)
- Outputs (display configuration with layout visualization)
- Layout (gaps, column widths/heights, background color)
- Appearance (focus ring, border, shadow, tab indicator, insert hint, color/gradient editors)
- Window Rules (per-app behavior: floating, maximized, opacity, dimensions)
- Key Bindings (shortcut editor with action picker and key recorder)
- Animations (timing and duration settings)
- Workspaces (named workspace configuration)
- Events & Gestures (gesture configuration)
- Startup (programs to launch at compositor start)
- Advanced (other settings)

## Document 2: Roadmap (`docs/ROADMAP.md`)

### Structure

**1. Vision Statement**
One paragraph: the long-term vision is to be the definitive graphical interface for Niri configuration, making the compositor accessible to everyone regardless of technical comfort with config files.

**2. Phases**

- **Phase 1: Polish & Stability** (Current focus)
  - UX refinements and edge case handling
  - Accessibility (a11y) audit and improvements
  - Error handling and validation
  - Testing infrastructure

- **Phase 2: Feature Completeness**
  - Cover remaining Niri config options not yet in the UI
  - Environment variable configuration
  - Debug options
  - Advanced window rule conditions
  - Full animation customization

- **Phase 3: Distribution**
  - Packaging strategy (Flatpak, distro packages, AppImage — TBD)
  - CI/CD for automated releases
  - Installation documentation

- **Phase 4: Ecosystem Integration**
  - Live preview of changes before applying
  - Config import/export and sharing
  - Theme presets
  - Deeper Niri IPC integration

**3. Contributing**
- Dev environment setup instructions
- Architecture pointers for new contributors
- Areas that need help

**4. Non-Goals**
- Not a general Wayland settings tool
- Not a Niri replacement or alternative compositor
- Not a window manager itself

## Audience

Both documents serve two audiences equally:
- **End users and community members** — understand what the app does and where it's headed
- **Contributors and developers** — understand the architecture, principles, and where to contribute

## Key Design Decisions

- **Accessibility as core mission** — the project exists to lower barriers to using Niri
- **Keyboard-first design ethos** — spatial navigation is the defining UX characteristic
- **Independent community project** — not affiliated with or endorsed by upstream Niri
- **Distribution strategy TBD** — to be decided as the project matures
