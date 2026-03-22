import { useConfig } from "@/lib/config-context";
import { Switch } from "spatial-grid-nav/primitives";
import { SettingsGroup, SettingsRow } from "spatial-grid-nav/layouts";
import { SliderInput } from "@/lib/slider-input";
import { NumberInput } from "@/lib/number-input";
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
    <SettingsGroup title="Window Shadow">
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
            <SliderInput
              value={shadow.softness ?? 0}
              min={0}
              max={100}
              step={1}
              onValueChange={(v) =>
                updateConfig((prev) => updateShadow(prev, { softness: v }))
              }
            />
          </SettingsRow>

          <SettingsRow label="Spread" description="How far the shadow extends beyond the window (-20 to 40)">
            <SliderInput
              value={shadow.spread ?? 0}
              min={-20}
              max={40}
              step={1}
              onValueChange={(v) =>
                updateConfig((prev) => updateShadow(prev, { spread: v }))
              }
            />
          </SettingsRow>

          <SettingsRow label="Offset" description="Horizontal and vertical offset of the shadow in pixels">
            <div className="flex items-center gap-2">
              <div className="flex flex-col items-center gap-1">
                <span className="text-xs text-muted-foreground">X</span>
                <NumberInput
                  numericValue={shadow.offsetX ?? null}
                  className="w-20"
                  onValueChange={(v) =>
                    updateConfig((prev) =>
                      updateShadow(prev, { offsetX: v ?? 0 }),
                    )
                  }
                />
              </div>
              <div className="flex flex-col items-center gap-1">
                <span className="text-xs text-muted-foreground">Y</span>
                <NumberInput
                  numericValue={shadow.offsetY ?? null}
                  className="w-20"
                  onValueChange={(v) =>
                    updateConfig((prev) =>
                      updateShadow(prev, { offsetY: v ?? 0 }),
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
