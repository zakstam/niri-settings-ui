import { useState, useCallback, useEffect, useLayoutEffect, useRef } from "react";
import { animate } from "motion";
import { ConfigProvider, useConfig } from "@/lib/config-context";
import { Sidebar, navItems, type Section } from "@/components/layout/sidebar";
import { ApplyBar } from "@/components/layout/apply-bar";
import { ShortcutsBar } from "@/components/layout/shortcuts-bar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { InputSection } from "@/components/sections/input-section";
import { OutputsSection } from "@/components/sections/outputs-section";
import { LayoutSection } from "@/components/sections/layout-section";
import { AppearanceSection } from "@/components/sections/appearance-section";
import { WindowRulesSection } from "@/components/sections/window-rules-section";
import { KeyBindingsSection } from "@/components/sections/key-bindings-section";
import { AnimationsSection } from "@/components/sections/animations-section";
import { StartupSection } from "@/components/sections/startup-section";
import { WorkspacesSection } from "@/components/sections/workspaces-section";
import { EventsGesturesSection } from "@/components/sections/events-gestures-section";
import { AdvancedSection } from "@/components/sections/advanced-section";

const sectionIndex = new Map<Section, number>(
  navItems.map((item, i) => [item.id, i]),
);

const SLIDE_OFFSET = 80;
const SPRING = { type: "spring" as const, stiffness: 500, damping: 40, mass: 0.8 };

function SectionContent({ section }: { section: Section }) {
  switch (section) {
    case "input":
      return <InputSection />;
    case "outputs":
      return <OutputsSection />;
    case "layout":
      return <LayoutSection />;
    case "appearance":
      return <AppearanceSection />;
    case "window-rules":
      return <WindowRulesSection />;
    case "key-bindings":
      return <KeyBindingsSection />;
    case "animations":
      return <AnimationsSection />;
    case "workspaces":
      return <WorkspacesSection />;
    case "events-gestures":
      return <EventsGesturesSection />;
    case "startup":
      return <StartupSection />;
    case "advanced":
      return <AdvancedSection />;
  }
}

function AppContent() {
  const [activeSection, setActiveSection] = useState<Section>("input");
  const [mountedSections, setMountedSections] = useState<Set<Section>>(
    () => new Set<Section>(["input"]),
  );
  const { isLoading, error, clearError } = useConfig();

  // Refs for imperative animation (avoids React inline style conflicts)
  const sectionRefs = useRef<Partial<Record<Section, HTMLDivElement | null>>>({});
  const runningAnims = useRef<Partial<Record<Section, { stop: () => void }[]>>>({});
  const pendingEnter = useRef<{ section: Section; dir: number } | null>(null);
  const initialized = useRef(false);

  function stopAnims(section: Section) {
    runningAnims.current[section]?.forEach((a) => a.stop());
    runningAnims.current[section] = [];
  }

  const handleSectionChange = useCallback(
    (section: Section) => {
      if (section === activeSection) return;
      const oldIdx = sectionIndex.get(activeSection) ?? 0;
      const newIdx = sectionIndex.get(section) ?? 0;
      const dir = newIdx > oldIdx ? 1 : -1;

      // Animate exiting section
      const exitEl = sectionRefs.current[activeSection];
      if (exitEl) {
        stopAnims(activeSection);
        exitEl.style.pointerEvents = "none";
        exitEl.style.zIndex = "0";
        const ctrl = animate(
          exitEl,
          { y: dir * -SLIDE_OFFSET, opacity: 0 },
          SPRING,
        );
        ctrl.then(() => {
          exitEl.style.visibility = "hidden";
        });
        runningAnims.current[activeSection] = [ctrl];
      }

      // Queue enter animation (runs after React commits the render)
      pendingEnter.current = { section, dir };
      setActiveSection(section);
      setMountedSections((prev) => {
        if (prev.has(section)) return prev;
        return new Set(prev).add(section);
      });
    },
    [activeSection],
  );

  // Initialize the first section as visible (before first paint)
  useLayoutEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    const el = sectionRefs.current[activeSection];
    if (el) {
      el.style.visibility = "visible";
      el.style.opacity = "1";
      el.style.transform = "translateY(0px)";
      el.style.pointerEvents = "auto";
      el.style.zIndex = "1";
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Animate the entering section after React commits (including first mount)
  useLayoutEffect(() => {
    const pending = pendingEnter.current;
    if (!pending) return;
    pendingEnter.current = null;

    const el = sectionRefs.current[pending.section];
    if (!el) return;

    stopAnims(pending.section);

    // Position at start offset before browser paints
    el.style.visibility = "visible";
    el.style.pointerEvents = "auto";
    el.style.zIndex = "1";
    el.style.opacity = "0";
    el.style.transform = `translateY(${pending.dir * SLIDE_OFFSET}px)`;

    // Animate to final position
    const ctrl = animate(el, { y: 0, opacity: 1 }, SPRING);
    runningAnims.current[pending.section] = [ctrl];
  });

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (!e.ctrlKey) return;
      const isNext = e.key === "ArrowDown" || e.key === "ArrowRight";
      const isPrev = e.key === "ArrowUp" || e.key === "ArrowLeft";
      if (!isNext && !isPrev) return;
      e.preventDefault();
      const currentIndex = sectionIndex.get(activeSection) ?? 0;
      const nextIndex = isNext
        ? Math.min(currentIndex + 1, navItems.length - 1)
        : Math.max(currentIndex - 1, 0);
      if (nextIndex !== currentIndex) {
        handleSectionChange(navItems[nextIndex].id);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeSection, handleSectionChange]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-5">
          <div className="size-9 rounded-full border-2 border-muted border-t-primary animate-spin" />
          <div className="text-center">
            <p className="text-sm font-bold text-foreground">
              Niri Settings
            </p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Loading configuration...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="max-w-sm space-y-4 text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-destructive/15">
            <span className="text-lg text-destructive">!</span>
          </div>
          <div>
            <h2 className="text-base font-bold text-foreground">
              Failed to load configuration
            </h2>
            <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
              {error}
            </p>
          </div>
          <button
            className="text-[13px] font-medium text-primary hover:text-primary/80 transition-colors"
            onClick={clearError}
          >
            Dismiss
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col">
      {/* Workspace-style nav strip */}
      <Sidebar
        activeSection={activeSection}
        onSectionChange={handleSectionChange}
      />

      {/* Main content — sections stay mounted once visited */}
      <div className="relative flex-1 overflow-hidden">
        {navItems.map((item) => {
          if (!mountedSections.has(item.id)) return null;
          return (
            <div
              key={item.id}
              ref={(el) => { sectionRefs.current[item.id] = el; }}
              className="absolute inset-0 invisible opacity-0 pointer-events-none"
            >
              <ScrollArea className="size-full">
                <div className="space-y-6 px-12 py-10 pb-28">
                  <SectionContent section={item.id} />
                </div>
              </ScrollArea>
            </div>
          );
        })}

        <ApplyBar />
        <ShortcutsBar />
      </div>
    </div>
  );
}

export function App() {
  return (
    <ConfigProvider>
      <AppContent />
    </ConfigProvider>
  );
}

export default App;
