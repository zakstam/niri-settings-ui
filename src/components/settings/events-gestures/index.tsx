import { useConfig } from "@/lib/config-context";
import { Input, Switch, Slider } from "spatial-grid-nav/primitives";
import { PageHeader, SettingsGroup, SettingsRow } from "spatial-grid-nav/layouts";
import { ColorEditor } from "@/components/settings/appearance/color-editor";
import type {
  NiriConfig,
  SwitchEventsConfig,
  SwitchAction,
  GesturesConfig,
  EdgeGestureConfig,
  HotCornersConfig,
  OverviewConfig,
} from "@/lib/types";

function updateSwitchEvents(
  prev: NiriConfig,
  patch: Partial<SwitchEventsConfig>,
): NiriConfig {
  return {
    ...prev,
    switchEvents: { ...prev.switchEvents, ...patch },
  };
}

function updateGestures(
  prev: NiriConfig,
  patch: Partial<GesturesConfig>,
): NiriConfig {
  return {
    ...prev,
    gestures: { ...prev.gestures, ...patch },
  };
}

function updateOverview(
  prev: NiriConfig,
  patch: Partial<OverviewConfig>,
): NiriConfig {
  return {
    ...prev,
    overview: { ...prev.overview, ...patch },
  };
}

function SwitchEventRow({
  label,
  description,
  action,
  onChange,
}: {
  label: string;
  description: string;
  action: SwitchAction | null;
  onChange: (value: SwitchAction | null) => void;
}) {
  const enabled = action !== null;
  const command = action ? action.spawn.join(" ") : "";

  return (
    <SettingsRow label={label} description={description}>
      <div className="flex items-center gap-2">
        <Switch
          checked={enabled}
          onCheckedChange={(v) => {
            onChange(v ? { spawn: [] } : null);
          }}
        />
        {enabled && (
          <Input
            value={command}
            placeholder="command arg1 arg2..."
            className="w-64"
            onChange={(e) => {
              const args = e.target.value.split(/\s+/).filter(Boolean);
              onChange({ spawn: args });
            }}
          />
        )}
      </div>
    </SettingsRow>
  );
}

function EdgeGestureSettings({
  title,
  value,
  onChange,
}: {
  title: string;
  value: EdgeGestureConfig | null;
  onChange: (v: EdgeGestureConfig | null) => void;
}) {
  const enabled = value !== null;
  const cfg = value ?? { triggerWidth: null, triggerHeight: null, delayMs: null, maxSpeed: null };

  return (
    <SettingsGroup title={title}>
      <SettingsRow label="Enable" description="Enable this edge gesture">
        <Switch
          checked={enabled}
          onCheckedChange={(v) => {
            onChange(
              v
                ? { triggerWidth: null, triggerHeight: null, delayMs: null, maxSpeed: null }
                : null,
            );
          }}
        />
      </SettingsRow>

      {enabled && (
        <>
          <SettingsRow label="Trigger Width" description="Width of the edge trigger zone in pixels">
            <Input
              type="number"
              value={cfg.triggerWidth ?? ""}
              placeholder="Default"
              min={0}
              className="w-24"
              onChange={(e) =>
                onChange({
                  ...cfg,
                  triggerWidth: e.target.value === "" ? null : Number(e.target.value),
                })
              }
            />
          </SettingsRow>

          <SettingsRow label="Trigger Height" description="Height of the edge trigger zone in pixels">
            <Input
              type="number"
              value={cfg.triggerHeight ?? ""}
              placeholder="Default"
              min={0}
              className="w-24"
              onChange={(e) =>
                onChange({
                  ...cfg,
                  triggerHeight: e.target.value === "" ? null : Number(e.target.value),
                })
              }
            />
          </SettingsRow>

          <SettingsRow label="Delay (ms)" description="Delay before the gesture activates">
            <Input
              type="number"
              value={cfg.delayMs ?? ""}
              placeholder="Default"
              min={0}
              className="w-24"
              onChange={(e) =>
                onChange({
                  ...cfg,
                  delayMs: e.target.value === "" ? null : Number(e.target.value),
                })
              }
            />
          </SettingsRow>

          <SettingsRow label="Max Speed" description="Maximum speed of the gesture action">
            <Input
              type="number"
              value={cfg.maxSpeed ?? ""}
              placeholder="Default"
              min={0}
              className="w-24"
              onChange={(e) =>
                onChange({
                  ...cfg,
                  maxSpeed: e.target.value === "" ? null : Number(e.target.value),
                })
              }
            />
          </SettingsRow>
        </>
      )}
    </SettingsGroup>
  );
}

export function EventsGesturesSection() {
  const { config, updateConfig } = useConfig();

  if (!config) return null;

  const hotCorners = config.gestures.hotCorners ?? {
    off: true,
    topLeft: false,
    topRight: false,
    bottomLeft: false,
    bottomRight: false,
  };

  function updateHotCorners(patch: Partial<HotCornersConfig>) {
    const current = config!.gestures.hotCorners ?? {
      off: true,
      topLeft: false,
      topRight: false,
      bottomLeft: false,
      bottomRight: false,
    };
    updateConfig((prev) =>
      updateGestures(prev, {
        hotCorners: { ...current, ...patch },
      }),
    );
  }

  return (
    <div>
      <PageHeader
        title="Events & Gestures"
        description="Configure switch events, edge gestures, hot corners, and overview settings"
      />

      <div className="space-y-6">
        <SettingsGroup
          title="Switch Events"
        >
          <SwitchEventRow
            label="Lid Close"
            description="Command to run when the lid is closed"
            action={config.switchEvents.lidClose}
            onChange={(v) =>
              updateConfig((prev) => updateSwitchEvents(prev, { lidClose: v }))
            }
          />
          <SwitchEventRow
            label="Lid Open"
            description="Command to run when the lid is opened"
            action={config.switchEvents.lidOpen}
            onChange={(v) =>
              updateConfig((prev) => updateSwitchEvents(prev, { lidOpen: v }))
            }
          />
          <SwitchEventRow
            label="Tablet Mode On"
            description="Command to run when tablet mode is activated"
            action={config.switchEvents.tabletModeOn}
            onChange={(v) =>
              updateConfig((prev) =>
                updateSwitchEvents(prev, { tabletModeOn: v }),
              )
            }
          />
          <SwitchEventRow
            label="Tablet Mode Off"
            description="Command to run when tablet mode is deactivated"
            action={config.switchEvents.tabletModeOff}
            onChange={(v) =>
              updateConfig((prev) =>
                updateSwitchEvents(prev, { tabletModeOff: v }),
              )
            }
          />
        </SettingsGroup>

        <EdgeGestureSettings
          title="DnD Edge View Scroll"
          value={config.gestures.dndEdgeViewScroll}
          onChange={(v) =>
            updateConfig((prev) =>
              updateGestures(prev, { dndEdgeViewScroll: v }),
            )
          }
        />

        <EdgeGestureSettings
          title="DnD Edge Workspace Switch"
          value={config.gestures.dndEdgeWorkspaceSwitch}
          onChange={(v) =>
            updateConfig((prev) =>
              updateGestures(prev, { dndEdgeWorkspaceSwitch: v }),
            )
          }
        />

        <SettingsGroup
          title="Hot Corners"
        >
          <SettingsRow label="Enable Hot Corners" description="Activate overview from screen corners">
            <Switch
              checked={!hotCorners.off}
              onCheckedChange={(v) => updateHotCorners({ off: !v })}
            />
          </SettingsRow>

          {!hotCorners.off && (
            <>
              <SettingsRow label="Top Left" description="Activate overview from the top-left corner">
                <Switch
                  checked={hotCorners.topLeft}
                  onCheckedChange={(v) => updateHotCorners({ topLeft: v })}
                />
              </SettingsRow>
              <SettingsRow label="Top Right" description="Activate overview from the top-right corner">
                <Switch
                  checked={hotCorners.topRight}
                  onCheckedChange={(v) => updateHotCorners({ topRight: v })}
                />
              </SettingsRow>
              <SettingsRow label="Bottom Left" description="Activate overview from the bottom-left corner">
                <Switch
                  checked={hotCorners.bottomLeft}
                  onCheckedChange={(v) => updateHotCorners({ bottomLeft: v })}
                />
              </SettingsRow>
              <SettingsRow label="Bottom Right" description="Activate overview from the bottom-right corner">
                <Switch
                  checked={hotCorners.bottomRight}
                  onCheckedChange={(v) => updateHotCorners({ bottomRight: v })}
                />
              </SettingsRow>
            </>
          )}
        </SettingsGroup>

        <SettingsGroup
          title="Overview"
        >
          <SettingsRow label="Zoom" description="Overview zoom level (0.1 to 2.0)">
            <div className="flex items-center gap-3">
              <Slider
                value={[config.overview.zoom ?? 0.5]}
                min={0.1}
                max={2.0}
                step={0.01}
                onValueChange={(val) => {
                  const v = Array.isArray(val) ? val[0] : val;
                  updateConfig((prev) =>
                    updateOverview(prev, { zoom: v }),
                  );
                }}
                className="w-40"
              />
              <Input
                type="number"
                value={config.overview.zoom ?? 0.5}
                min={0.1}
                max={2.0}
                step={0.01}
                className="w-20"
                onChange={(e) =>
                  updateConfig((prev) =>
                    updateOverview(prev, {
                      zoom: e.target.value === "" ? null : Number(e.target.value),
                    }),
                  )
                }
              />
            </div>
          </SettingsRow>

          <SettingsRow label="Backdrop Color" description="Background color behind the overview">
            <ColorEditor
              value={config.overview.backdropColor}
              onChange={(v) =>
                updateConfig((prev) => updateOverview(prev, { backdropColor: v }))
              }
            />
          </SettingsRow>

          <SettingsRow
            label="Workspace Shadow"
            description="Enable shadow on workspaces in overview"
          >
            <Switch
              checked={config.overview.workspaceShadow !== null}
              onCheckedChange={(v) =>
                updateConfig((prev) =>
                  updateOverview(prev, {
                    workspaceShadow: v
                      ? {
                          on: true,
                          drawBehindWindow: null,
                          softness: null,
                          spread: null,
                          offsetX: null,
                          offsetY: null,
                          color: null,
                          inactiveColor: null,
                        }
                      : null,
                  }),
                )
              }
            />
          </SettingsRow>
        </SettingsGroup>
      </div>
    </div>
  );
}
