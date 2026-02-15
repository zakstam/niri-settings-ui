import { useConfig } from "@/lib/config-context";
import { Switch, Slider, Input } from "spatial-grid-nav/primitives";
import { PageHeader, SettingsGroup, SettingsRow } from "spatial-grid-nav/layouts";
import { AnimationCard } from "./animation-card";

export function AnimationsSection() {
  const { config, updateConfig } = useConfig();

  if (!config) return null;

  return (
    <div>
      <PageHeader
        title="Animations"
        description="Control window and workspace transition animations"
      />

      <SettingsGroup title="Animation Settings">
        <SettingsRow
          label="Disable Animations"
          description="Turn off all animations"
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
            <div className="flex items-center gap-3">
              <Slider
                value={[config.animations.slowdown ?? 1.0]}
                min={0.1}
                max={10}
                step={0.1}
                onValueChange={(val) => { const v = Array.isArray(val) ? val[0] : val;
                  updateConfig((prev) => ({
                    ...prev,
                    animations: {
                      ...prev.animations,
                      slowdown: v === 1.0 ? null : v,
                    },
                  }));
                }}
                className="w-40"
              />
              <Input
                type="number"
                value={config.animations.slowdown ?? 1.0}
                min={0.1}
                max={10}
                step={0.1}
                className="w-20"
                onChange={(e) =>
                  updateConfig((prev) => ({
                    ...prev,
                    animations: {
                      ...prev.animations,
                      slowdown: e.target.value
                        ? Number(e.target.value)
                        : null,
                    },
                  }))
                }
              />
            </div>
          </SettingsRow>
        )}
      </SettingsGroup>

      {!config.animations.off && (
        <div className="mt-4 space-y-4">
          <AnimationCard name="workspaceSwitch" label="Workspace Switch" description="Animation when switching workspaces" />
          <AnimationCard name="windowOpen" label="Window Open" description="Animation when a window opens" />
          <AnimationCard name="windowClose" label="Window Close" description="Animation when a window closes" />
          <AnimationCard name="horizontalViewMovement" label="Horizontal View Movement" description="Animation for horizontal view scrolling" />
          <AnimationCard name="windowMovement" label="Window Movement" description="Animation when moving windows" />
          <AnimationCard name="windowResize" label="Window Resize" description="Animation when resizing windows" />
          <AnimationCard name="configNotificationOpenClose" label="Config Notification" description="Animation for config notification popup" />
          <AnimationCard name="exitConfirmationOpenClose" label="Exit Confirmation" description="Animation for exit confirmation dialog" />
          <AnimationCard name="screenshotUiOpen" label="Screenshot UI" description="Animation for screenshot UI" />
          <AnimationCard name="overviewOpenClose" label="Overview" description="Animation for overview mode" />
          <AnimationCard name="recentWindowsClose" label="Recent Windows Close" description="Animation for recent windows closing" />
        </div>
      )}
    </div>
  );
}
