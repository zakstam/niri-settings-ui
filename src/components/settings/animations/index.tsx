import { useConfig } from "@/lib/config-context";
import { Switch } from "spatial-grid-nav/primitives";
import { PageHeader, SettingsGroup, SettingsRow } from "spatial-grid-nav/layouts";
import { SliderInput } from "@/lib/slider-input";
import { AnimationCard } from "./animation-card";

export function AnimationsSection() {
  const { config, updateConfig } = useConfig();

  if (!config) return null;

  return (
    <div>
      <PageHeader title="Animations" />

      <div className="space-y-6">
        <SettingsGroup title="Animation Settings">
          <SettingsRow
            label="Disable Animations"
            description="Disable all animations globally"
          >
            <Switch
              checked={config.animations.off}
              onCheckedChange={(v) =>
                updateConfig((prev) => ({
                  ...prev,
                  animations: { ...prev.animations, off: v },
                }))
              }
            />
          </SettingsRow>

          {!config.animations.off && (
            <SettingsRow
              label="Slowdown"
              description="Multiply animation duration (1.0 = normal)"
            >
              <SliderInput
                value={config.animations.slowdown ?? 1.0}
                min={0.1}
                max={10}
                step={0.1}
                sliderClassName="w-40"
                onValueChange={(v) =>
                  updateConfig((prev) => ({
                    ...prev,
                    animations: {
                      ...prev.animations,
                      slowdown: v === 1.0 ? null : v,
                    },
                  }))
                }
              />
            </SettingsRow>
          )}
        </SettingsGroup>

        {!config.animations.off && (
          <>
            {/* Window Lifecycle */}
            <h3 className="text-xs font-medium text-muted-foreground pt-2">Window Lifecycle</h3>
            <AnimationCard name="windowOpen" label="Window Open" />
            <AnimationCard name="windowClose" label="Window Close" />
            <AnimationCard name="windowMovement" label="Window Movement" />
            <AnimationCard name="windowResize" label="Window Resize" />

            {/* Workspace & UI */}
            <h3 className="text-xs font-medium text-muted-foreground pt-2">Workspace & UI</h3>
            <AnimationCard name="workspaceSwitch" label="Workspace Switch" />
            <AnimationCard name="horizontalViewMovement" label="Horizontal View Movement" />
            <AnimationCard name="overviewOpenClose" label="Overview" />
            <AnimationCard name="recentWindowsClose" label="Recent Windows Close" />

            {/* System Overlays */}
            <h3 className="text-xs font-medium text-muted-foreground pt-2">System Overlays</h3>
            <AnimationCard name="configNotificationOpenClose" label="Config Notification" />
            <AnimationCard name="exitConfirmationOpenClose" label="Exit Confirmation" />
            <AnimationCard name="screenshotUiOpen" label="Screenshot UI" />
          </>
        )}
      </div>
    </div>
  );
}
