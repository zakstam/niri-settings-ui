import { useState, useEffect, useRef } from "react";
import { ConfigProvider, useConfig } from "@/lib/config-context";
import { Sidebar, type Section } from "@/components/layout/sidebar";
import { ApplyBar } from "@/components/layout/apply-bar";
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
  const [animKey, setAnimKey] = useState(0);
  const { isLoading, error, clearError } = useConfig();
  const scrollRef = useRef<HTMLDivElement>(null);

  function handleSectionChange(section: Section) {
    setActiveSection(section);
    setAnimKey((k) => k + 1);
  }

  // Scroll to top on section change
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
  }, [activeSection]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          {/* Animated logo */}
          <div className="relative flex size-12 items-center justify-center">
            <div className="absolute inset-0 animate-ping rounded-xl bg-amber/20" />
            <div className="relative flex size-12 items-center justify-center rounded-xl bg-amber-muted">
              <span className="text-lg font-bold text-amber">N</span>
            </div>
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-foreground">
              Niri Settings
            </p>
            <p className="mt-1 text-[11px] font-mono text-muted-foreground tracking-wider">
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
          <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-destructive/15">
            <span className="text-lg text-destructive">!</span>
          </div>
          <div>
            <h2 className="text-base font-semibold text-foreground">
              Failed to load configuration
            </h2>
            <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
              {error}
            </p>
          </div>
          <button
            className="text-[13px] font-medium text-amber hover:text-amber/80 transition-colors"
            onClick={clearError}
          >
            Dismiss
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <Sidebar
        activeSection={activeSection}
        onSectionChange={handleSectionChange}
      />

      {/* Subtle vertical divider */}
      <div className="w-px bg-border" />

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <ScrollArea className="flex-1" ref={scrollRef}>
          <div
            key={animKey}
            className="section-enter mx-auto max-w-2xl space-y-5 px-10 py-8 pb-28"
          >
            <SectionContent section={activeSection} />
          </div>
        </ScrollArea>
        <ApplyBar />
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
