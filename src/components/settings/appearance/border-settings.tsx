import { useConfig } from "@/lib/config-context";
import { Switch } from "spatial-grid-nav/primitives";
import { SettingsGroup, SettingsRow } from "spatial-grid-nav/layouts";
import { SliderInput } from "@/lib/slider-input";
import { ColorEditor } from "./color-editor";
import { GradientOptionsSection } from "./gradient-options-section";
import type { NiriConfig, RingBorderConfig } from "@/lib/types";

function updateBorder(
  prev: NiriConfig,
  patch: Partial<RingBorderConfig>,
): NiriConfig {
  return {
    ...prev,
    layout: {
      ...prev.layout,
      border: { ...prev.layout.border, ...patch },
    },
  };
}

export function BorderSettings() {
  const { config, updateConfig } = useConfig();

  if (!config) return null;

  const border = config.layout.border;

  return (
    <SettingsGroup title="Window Border">
      <SettingsRow label="Disable Border" description="Hide window borders entirely">
        <Switch
          checked={border.off}
          onCheckedChange={(v) =>
            updateConfig((prev) => updateBorder(prev, { off: v }))
          }
        />
      </SettingsRow>

      {!border.off && (
        <>
          <SettingsRow label="Width" description="Thickness of the border in pixels">
            <SliderInput
              value={border.width ?? 0}
              min={0}
              max={20}
              step={1}
              onValueChange={(v) =>
                updateConfig((prev) => updateBorder(prev, { width: v }))
              }
            />
          </SettingsRow>

          <SettingsRow label="Active Color" description="Border color on the focused window">
            <ColorEditor
              value={border.activeColor}
              onChange={(v) =>
                updateConfig((prev) => updateBorder(prev, { activeColor: v }))
              }
            />
          </SettingsRow>

          <SettingsRow label="Inactive Color" description="Border color on unfocused windows">
            <ColorEditor
              value={border.inactiveColor}
              onChange={(v) =>
                updateConfig((prev) => updateBorder(prev, { inactiveColor: v }))
              }
            />
          </SettingsRow>

          <SettingsRow label="Urgent Color" description="Border color on windows requesting attention">
            <ColorEditor
              value={border.urgentColor}
              onChange={(v) =>
                updateConfig((prev) => updateBorder(prev, { urgentColor: v }))
              }
            />
          </SettingsRow>

          <GradientOptionsSection
            subject="border"
            activeGradient={border.activeGradient}
            inactiveGradient={border.inactiveGradient}
            urgentGradient={border.urgentGradient}
            onActiveGradientChange={(v) =>
              updateConfig((prev) => updateBorder(prev, { activeGradient: v }))
            }
            onInactiveGradientChange={(v) =>
              updateConfig((prev) => updateBorder(prev, { inactiveGradient: v }))
            }
            onUrgentGradientChange={(v) =>
              updateConfig((prev) => updateBorder(prev, { urgentGradient: v }))
            }
          />
        </>
      )}
    </SettingsGroup>
  );
}
