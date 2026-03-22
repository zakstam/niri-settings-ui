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
          <>
            <AnimationCard name="workspaceSwitch" label="Workspace Switch" />
            <AnimationCard name="windowOpen" label="Window Open" />
            <AnimationCard name="windowClose" label="Window Close" />
            <AnimationCard name="horizontalViewMovement" label="Horizontal View Movement" />
            <AnimationCard name="windowMovement" label="Window Movement" />
            <AnimationCard name="windowResize" label="Window Resize" />
            <AnimationCard name="configNotificationOpenClose" label="Config Notification" />
            <AnimationCard name="exitConfirmationOpenClose" label="Exit Confirmation" />
            <AnimationCard name="screenshotUiOpen" label="Screenshot UI" />
            <AnimationCard name="overviewOpenClose" label="Overview" />
            <AnimationCard name="recentWindowsClose" label="Recent Windows Close" />
          </>
        )}
      </div>
    </div>
  );
}
