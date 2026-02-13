import {
  IconKeyboard,
  IconDeviceDesktop,
  IconLayout,
  IconPalette,
  IconWindowMaximize,
  IconCommand,
  IconPlayerPlay,
  IconStack2,
  IconHandGrab,
  IconRocket,
  IconSettings,
} from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import type { ComponentType } from "react";

export type Section =
  | "input"
  | "outputs"
  | "layout"
  | "appearance"
  | "window-rules"
  | "key-bindings"
  | "animations"
  | "workspaces"
  | "events-gestures"
  | "startup"
  | "advanced";

interface NavItem {
  id: Section;
  label: string;
  icon: ComponentType<{ size?: number; className?: string }>;
}

const navItems: NavItem[] = [
  { id: "input", label: "Input", icon: IconKeyboard },
  { id: "outputs", label: "Outputs", icon: IconDeviceDesktop },
  { id: "layout", label: "Layout", icon: IconLayout },
  { id: "appearance", label: "Appearance", icon: IconPalette },
  { id: "window-rules", label: "Window Rules", icon: IconWindowMaximize },
  { id: "key-bindings", label: "Key Bindings", icon: IconCommand },
  { id: "animations", label: "Animations", icon: IconPlayerPlay },
  { id: "workspaces", label: "Workspaces", icon: IconStack2 },
  { id: "events-gestures", label: "Events & Gestures", icon: IconHandGrab },
  { id: "startup", label: "Startup", icon: IconRocket },
  { id: "advanced", label: "Advanced", icon: IconSettings },
];

interface SidebarProps {
  activeSection: Section;
  onSectionChange: (section: Section) => void;
}

export function Sidebar({ activeSection, onSectionChange }: SidebarProps) {
  return (
    <aside className="flex h-full w-52 shrink-0 flex-col bg-sidebar">
      {/* Logo / App title */}
      <div className="flex items-center gap-2.5 px-5 pt-6 pb-5">
        <div className="flex size-7 items-center justify-center rounded-md bg-amber-muted">
          <span className="text-xs font-bold text-amber">N</span>
        </div>
        <div>
          <h1 className="text-[13px] font-semibold tracking-tight text-foreground">
            Niri Settings
          </h1>
          <p className="text-[10px] font-mono tracking-wider text-muted-foreground uppercase">
            Compositor
          </p>
        </div>
      </div>

      {/* Subtle divider line */}
      <div className="mx-4 h-px bg-sidebar-border" />

      {/* Navigation */}
      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-3 py-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSectionChange(item.id)}
              className={cn(
                "group relative flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[13px] transition-all duration-150",
                isActive
                  ? "bg-amber-subtle text-foreground font-medium"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              )}
            >
              {/* Active indicator bar */}
              {isActive && (
                <div className="absolute left-0 top-1/2 h-4 w-[3px] -translate-y-1/2 rounded-r-full bg-amber" />
              )}

              <Icon
                size={16}
                className={cn(
                  "shrink-0 transition-colors duration-150",
                  isActive ? "text-amber" : "text-muted-foreground group-hover:text-sidebar-accent-foreground",
                )}
              />
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Bottom version info */}
      <div className="px-5 pb-4">
        <div className="h-px bg-sidebar-border mb-3" />
        <p className="text-[10px] font-mono text-muted-foreground/50 tracking-wider">
          v0.1.0
        </p>
      </div>
    </aside>
  );
}
