import { useConfig } from "@/lib/config-context";
import { Input, Switch, Slider } from "spatial-grid-nav/primitives";
import { SettingsGroup, SettingsRow } from "spatial-grid-nav/layouts";
import { ColorEditor } from "./color-editor";
import type { NiriConfig, ShadowConfig } from "@/lib/types";

function updateShadow(
  prev: NiriConfig,
  patch: Partial<ShadowConfig>,
): NiriConfig {
  return {
    ...prev,
    layout: {
      ...prev.layout,
      shadow: { ...prev.layout.shadow, ...patch },
    },
  };
}

export function ShadowSettings() {
  const { config, updateConfig } = useConfig();

  if (!config) return null;

  const shadow = config.layout.shadow;

  return (
    <SettingsGroup title="Window Shadow" description="Drop shadow behind windows">
      <SettingsRow label="Enable Shadow" description="Draw a drop shadow behind windows">
        <Switch
          checked={shadow.on}
          onCheckedChange={(v) =>
            updateConfig((prev) => updateShadow(prev, { on: v }))
          }
        />
      </SettingsRow>

      {shadow.on && (
        <>
          <SettingsRow label="Draw Behind Window" description="Draw the shadow behind the window, not just around it">
            <Switch
              checked={shadow.drawBehindWindow ?? false}
              onCheckedChange={(v) =>
                updateConfig((prev) => updateShadow(prev, { drawBehindWindow: v }))
              }
            />
          </SettingsRow>

          <SettingsRow label="Softness" description="Blur radius of the shadow (0-100)">
            <div className="flex items-center gap-3">
              <Slider
                value={[shadow.softness ?? 0]}
                min={0}
                max={100}
                step={1}
                onValueChange={(val) => { const v = Array.isArray(val) ? val[0] : val;
                  updateConfig((prev) => updateShadow(prev, { softness: v }));
                }}
                className="w-32"
              />
              <Input
                type="number"
                value={shadow.softness ?? ""}
                min={0}
                max={100}
                className="w-20"
                onChange={(e) =>
                  updateConfig((prev) =>
                    updateShadow(prev, { softness: Number(e.target.value) || 0 }),
                  )
                }
              />
            </div>
          </SettingsRow>

          <SettingsRow label="Spread" description="How far the shadow extends beyond the window (-20 to 40)">
            <div className="flex items-center gap-3">
              <Slider
                value={[shadow.spread ?? 0]}
                min={-20}
                max={40}
                step={1}
                onValueChange={(val) => { const v = Array.isArray(val) ? val[0] : val;
                  updateConfig((prev) => updateShadow(prev, { spread: v }));
                }}
                className="w-32"
              />
              <Input
                type="number"
                value={shadow.spread ?? ""}
                min={-20}
                max={40}
                className="w-20"
                onChange={(e) =>
                  updateConfig((prev) =>
                    updateShadow(prev, { spread: Number(e.target.value) || 0 }),
                  )
                }
              />
            </div>
          </SettingsRow>

          <SettingsRow label="Offset" description="Horizontal and vertical offset of the shadow in pixels">
            <div className="flex items-center gap-2">
              <div className="flex flex-col items-center gap-1">
                <span className="text-xs text-muted-foreground">X</span>
                <Input
                  type="number"
                  value={shadow.offsetX ?? ""}
                  className="w-20"
                  onChange={(e) =>
                    updateConfig((prev) =>
                      updateShadow(prev, { offsetX: Number(e.target.value) || 0 }),
                    )
                  }
                />
              </div>
              <div className="flex flex-col items-center gap-1">
                <span className="text-xs text-muted-foreground">Y</span>
                <Input
                  type="number"
                  value={shadow.offsetY ?? ""}
                  className="w-20"
                  onChange={(e) =>
                    updateConfig((prev) =>
                      updateShadow(prev, { offsetY: Number(e.target.value) || 0 }),
                    )
                  }
                />
              </div>
            </div>
          </SettingsRow>

          <SettingsRow label="Color" description="Shadow color">
            <ColorEditor
              value={shadow.color}
              onChange={(v) =>
                updateConfig((prev) => updateShadow(prev, { color: v }))
              }
            />
          </SettingsRow>

          <SettingsRow label="Inactive Color" description="Shadow color for unfocused windows">
            <ColorEditor
              value={shadow.inactiveColor}
              onChange={(v) =>
                updateConfig((prev) => updateShadow(prev, { inactiveColor: v }))
              }
            />
          </SettingsRow>
        </>
      )}
    </SettingsGroup>
  );
}
