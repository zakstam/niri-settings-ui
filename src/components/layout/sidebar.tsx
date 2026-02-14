import { cn } from "@/lib/utils";
import { useState, useRef, useCallback, useEffect, useLayoutEffect } from "react";
import niriLogo from "@/assets/niri-logo.png";
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
  IconChevronRight,
  IconChevronLeft,
} from "@tabler/icons-react";
import type { ComponentType } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "spatial-grid-nav/primitives";

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

export const navItems: NavItem[] = [
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
  const [showLabels, setShowLabels] = useState(false);
  const [labelsFit, setLabelsFit] = useState(true);
  const navRef = useRef<HTMLElement>(null);
  const buttonRefs = useRef<Partial<Record<Section, HTMLButtonElement | null>>>({});
  const EDGE_PADDING = 12;

  // Check if nav overflows when labels are shown
  const checkOverflow = useCallback(() => {
    const nav = navRef.current;
    if (!nav) return;
    setLabelsFit(nav.scrollWidth <= nav.clientWidth);
  }, []);

  // Re-check on resize and when labels toggle
  useLayoutEffect(() => {
    checkOverflow();
    const observer = new ResizeObserver(checkOverflow);
    if (navRef.current) observer.observe(navRef.current);
    return () => observer.disconnect();
  }, [showLabels, checkOverflow]);

  useEffect(() => {
    const activeButton = buttonRefs.current[activeSection];
    const nav = navRef.current;
    if (!activeButton || !nav) return;

    // Keep the focused section tab visible when section navigation moves it off-screen.
    const navRect = nav.getBoundingClientRect();
    const buttonRect = activeButton.getBoundingClientRect();
    const currentScrollLeft = nav.scrollLeft;

    const buttonLeft = buttonRect.left - navRect.left + currentScrollLeft;
    const buttonRight = buttonLeft + buttonRect.width;
    const visibleLeft = currentScrollLeft + EDGE_PADDING;
    const visibleRight = currentScrollLeft + nav.clientWidth - EDGE_PADDING;

    if (buttonLeft >= visibleLeft && buttonRight <= visibleRight) return;

    const nextScrollLeft = Math.max(
      0,
      buttonLeft - (nav.clientWidth - buttonRect.width) / 2,
    );
    nav.scrollTo({
      left: nextScrollLeft,
      behavior: "smooth",
    });
  }, [activeSection]);

  // Auto-collapse labels when they no longer fit
  useEffect(() => {
    if (showLabels && !labelsFit) {
      setShowLabels(false);
    }
  }, [labelsFit, showLabels]);

  return (
    <header className="glass-surface flex h-14 w-full shrink-0 items-center border-b border-glass-border px-4 gap-3">
      {/* App mark */}
      <img src={niriLogo} alt="niri" className="size-9 rounded-lg select-none" draggable={false} />

      <div className="h-5 w-px bg-border" />

      {/* Navigation – horizontal workspace strip */}
      <TooltipProvider delay={300}>
          <nav
            ref={navRef}
            className="no-scrollbar min-w-0 flex flex-1 items-center gap-1 overflow-x-auto overflow-y-hidden"
          >
            {navItems.map((item) => {
              const isActive = activeSection === item.id;
              const Icon = item.icon;
            const showLabel = isActive || showLabels;
            return (
              <Tooltip key={item.id}>
                <TooltipTrigger
                  render={
                    <button
                      ref={(el) => {
                        buttonRefs.current[item.id] = el;
                      }}
                      tabIndex={-1}
                      aria-label={item.label}
                      onClick={() => onSectionChange(item.id)}
                      className={cn(
                        "relative flex h-9 shrink-0 items-center justify-center rounded-lg transition-colors duration-200",
                        showLabel
                          ? "gap-2 px-3"
                          : "w-9 hover:bg-accent/50",
                        isActive
                          ? "bg-accent-color-subtle"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                    />
                  }
                >
                  <Icon
                    size={18}
                    className={cn("shrink-0", isActive && "text-accent-color")}
                  />
                  {showLabel && (
                    <span
                      className={cn(
                        "text-xs font-medium whitespace-nowrap select-none",
                        isActive ? "text-foreground" : "text-muted-foreground",
                      )}
                    >
                      {item.label}
                    </span>
                  )}
                </TooltipTrigger>
                {!showLabels && (
                  <TooltipContent side="bottom" sideOffset={8}>
                    {item.label}
                  </TooltipContent>
                )}
              </Tooltip>
            );
          })}
        </nav>
      </TooltipProvider>

      <div className="h-5 w-px bg-border" />

      {/* Toggle labels */}
      <Tooltip>
        <TooltipTrigger
          render={
            <button
              tabIndex={-1}
              aria-label={showLabels ? "Hide labels" : "Show labels"}
              onClick={() => setShowLabels((v) => !v)}
              className="flex size-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors duration-200 hover:bg-accent/50 hover:text-foreground"
            />
          }
        >
          {showLabels ? <IconChevronLeft size={18} /> : <IconChevronRight size={18} />}
        </TooltipTrigger>
        <TooltipContent side="bottom" sideOffset={8}>
          {showLabels ? "Hide labels" : "Show labels"}
        </TooltipContent>
      </Tooltip>
    </header>
  );
}
