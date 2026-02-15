import {
  useEffect,
  useState,
  useCallback,
  useLayoutEffect,
  useRef,
} from "react";
import { animate } from "motion";
import { NavigationProvider } from "spatial-grid-nav/react";
import { ConfigProvider, useConfig } from "@/lib/config-context";
import { Sidebar, navItems, type Section } from "@/components/layout/sidebar";
import { ApplyBar } from "@/components/layout/apply-bar";
import { ShortcutsBar } from "@/components/layout/shortcuts-bar";
import { ScrollArea } from "spatial-grid-nav/primitives";
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
import type { NavigationEngine } from "spatial-grid-nav";

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
  const { isLoading, error, clearError, applyChanges, discardChanges, isDirty } =
    useConfig();

  const engineRef = useRef<NavigationEngine | null>(null);

  // Refs for imperative animation (avoids React inline style conflicts)
  const sectionRefs = useRef<Partial<Record<Section, HTMLElement | null>>>({});
  const runningAnims = useRef<Partial<Record<Section, { stop: () => void }[]>>>({});
  const pendingEnter = useRef<{ section: Section; dir: number } | null>(null);
  const pendingSectionGroupFocus = useRef<Section | null>(null);

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

  const requestSectionGroupFocus = useCallback((section: Section) => {
    pendingSectionGroupFocus.current = section;
  }, []);

  useEffect(() => {
    const handleGlobalShortcut = (event: KeyboardEvent) => {
      if (!event.ctrlKey && !event.metaKey) return;
      if (event.altKey || event.shiftKey) return;

      const key = event.key.toLowerCase();
      if (key === "s") {
        event.preventDefault();
        if (!isDirty) return;
        void applyChanges();
        return;
      }

      if (key === "d") {
        event.preventDefault();
        discardChanges();
      }
    };

    document.addEventListener("keydown", handleGlobalShortcut, true);
    return () => {
      document.removeEventListener("keydown", handleGlobalShortcut, true);
    };
  }, [applyChanges, discardChanges, isDirty]);

  const scrollSectionToTop = useCallback((section: Section) => {
    const sectionRoot = sectionRefs.current[section];
    if (!sectionRoot) return;

    const viewport = sectionRoot.querySelector<HTMLElement>(
      '[data-slot="scroll-area-viewport"]',
    );
    if (viewport) {
      viewport.scrollTo({
        top: 0,
        left: 0,
        behavior: "auto",
      });
      return;
    }

    sectionRoot.scrollIntoView({
      behavior: "auto",
      block: "start",
      inline: "nearest",
    });
  }, []);

  const scrollGroupIntoView = useCallback((section: Section, group: HTMLElement | null) => {
    if (!group) return;

    const sectionRoot = sectionRefs.current[section];
    if (!sectionRoot) return;

    const viewport = sectionRoot.querySelector<HTMLElement>(
      '[data-slot="scroll-area-viewport"]',
    );
    if (!viewport) {
      group.scrollIntoView({
        behavior: "auto",
        block: "nearest",
        inline: "nearest",
      });
      return;
    }

    const viewportRect = viewport.getBoundingClientRect();
    const groupRect = group.getBoundingClientRect();
    const topPadding = 12;
    const bottomPadding = 12;

    const viewportTop = viewport.scrollTop;
    const groupTop = groupRect.top - viewportRect.top + viewportTop;
    const groupBottom = groupRect.bottom - viewportRect.top + viewportTop;

    let nextScrollTop = viewportTop;
    if (groupTop < viewportTop + topPadding) {
      nextScrollTop = Math.max(0, groupTop - topPadding);
    } else if (groupBottom > viewportTop + viewport.clientHeight - bottomPadding) {
      nextScrollTop = Math.min(
        viewport.scrollHeight - viewport.clientHeight,
        groupBottom - viewport.clientHeight + bottomPadding,
      );
    }

    if (nextScrollTop !== viewportTop) {
      viewport.scrollTo({
        top: nextScrollTop,
        behavior: "auto",
      });
    }
  }, []);

  // Handle section navigation events from the engine
  const handleSectionNav = useCallback(
    (direction: "next" | "prev") => {
      const currentIndex = sectionIndex.get(activeSection) ?? 0;
      const nextSectionIdx = direction === "next"
        ? Math.min(currentIndex + 1, navItems.length - 1)
        : Math.max(currentIndex - 1, 0);
      if (nextSectionIdx !== currentIndex) {
        const section = navItems[nextSectionIdx].id;
        requestSectionGroupFocus(section);
        handleSectionChange(section);
      }
    },
    [activeSection, handleSectionChange, requestSectionGroupFocus],
  );

  // Initialize the first visible section after the config has loaded.
  useLayoutEffect(() => {
    if (isLoading) return;
    const el = sectionRefs.current["input"];
    if (!el) return;

    el.style.visibility = "visible";
    el.style.opacity = "1";
    el.style.transform = "translateY(0px)";
    el.style.pointerEvents = "auto";
    el.style.zIndex = "1";
  }, [isLoading]);

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

  // Sync engine active section and restore focus in the newly visible section
  useLayoutEffect(() => {
    if (!engineRef.current) return;

    const sectionToFocus = pendingSectionGroupFocus.current;
    if (sectionToFocus) {
      const sectionRoot = sectionRefs.current[sectionToFocus];
      if (sectionRoot) {
        engineRef.current.setActiveSection(sectionToFocus);
        engineRef.current.restoreFocus(sectionToFocus);
        scrollSectionToTop(sectionToFocus);
      }
      pendingSectionGroupFocus.current = null;
    } else {
      engineRef.current.restoreFocus(activeSection);
      scrollSectionToTop(activeSection);
    }
  }, [activeSection, scrollSectionToTop]);

  const handleActiveGroupChange = useCallback((group: HTMLElement | null) => {
    const sectionId = group?.closest("[data-sgn-section]")?.getAttribute("data-sgn-section") as
      | Section
      | null;
    if (!sectionId) return;
    scrollGroupIntoView(sectionId, group);
  }, [scrollGroupIntoView]);

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
      <NavigationProvider
        engineRef={engineRef}
        onSectionNav={handleSectionNav}
        onActiveGroupChange={handleActiveGroupChange}
      >
        <main className="relative flex-1 overflow-hidden">
          {navItems.map((item) => {
            if (!mountedSections.has(item.id)) return null;

            const isActive = item.id === activeSection;

            return (
              <section
                key={item.id}
                ref={(el) => {
                  sectionRefs.current[item.id] = el;
                }}
                data-sgn-section={item.id}
                aria-hidden={!isActive}
                inert={!isActive || undefined}
                role="tabpanel"
                tabIndex={-1}
                className="absolute inset-0 invisible opacity-0 pointer-events-none"
              >
                <ScrollArea className="size-full">
                  <div className="space-y-6 px-12 py-10 pb-28">
                    <SectionContent section={item.id} />
                  </div>
                </ScrollArea>
              </section>
            );
          })}

          <ApplyBar />
          <ShortcutsBar />
        </main>
      </NavigationProvider>
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
