import { useConfig } from "@/lib/config-context";
import { Switch } from "spatial-grid-nav/primitives";
import { SettingsGroup, SettingsRow } from "spatial-grid-nav/layouts";
import { SliderInput } from "@/lib/slider-input";
import { ColorEditor } from "./color-editor";
import { GradientOptionsSection } from "./gradient-options-section";
import type { NiriConfig, RingBorderConfig } from "@/lib/types";

function updateFocusRing(
  prev: NiriConfig,
  patch: Partial<RingBorderConfig>,
): NiriConfig {
  return {
    ...prev,
    layout: {
      ...prev.layout,
      focusRing: { ...prev.layout.focusRing, ...patch },
    },
  };
}

export function RingSettings() {
  const { config, updateConfig } = useConfig();

  if (!config) return null;

  const ring = config.layout.focusRing;

  return (
    <SettingsGroup title="Focus Ring">
      <SettingsRow label="Disable Focus Ring" description="Hide the focus ring entirely">
        <Switch
          checked={ring.off}
          onCheckedChange={(v) =>
            updateConfig((prev) => updateFocusRing(prev, { off: v }))
          }
        />
      </SettingsRow>

      {!ring.off && (
        <>
          <SettingsRow label="Width" description="Thickness of the focus ring in pixels">
            <SliderInput
              value={ring.width ?? 0}
              min={0}
              max={20}
              step={1}
              onValueChange={(v) =>
                updateConfig((prev) => updateFocusRing(prev, { width: v }))
              }
            />
          </SettingsRow>

          <SettingsRow label="Active Color" description="Color of the ring on the focused window">
            <ColorEditor
              value={ring.activeColor}
              onChange={(v) =>
                updateConfig((prev) => updateFocusRing(prev, { activeColor: v }))
              }
            />
          </SettingsRow>

          <SettingsRow label="Inactive Color" description="Color of the ring on unfocused windows">
            <ColorEditor
              value={ring.inactiveColor}
              onChange={(v) =>
                updateConfig((prev) => updateFocusRing(prev, { inactiveColor: v }))
              }
            />
          </SettingsRow>

          <GradientOptionsSection
            subject="ring"
            activeGradient={ring.activeGradient}
            inactiveGradient={ring.inactiveGradient}
            urgentGradient={ring.urgentGradient}
            onActiveGradientChange={(v) =>
              updateConfig((prev) => updateFocusRing(prev, { activeGradient: v }))
            }
            onInactiveGradientChange={(v) =>
              updateConfig((prev) => updateFocusRing(prev, { inactiveGradient: v }))
            }
            onUrgentGradientChange={(v) =>
              updateConfig((prev) => updateFocusRing(prev, { urgentGradient: v }))
            }
          />
        </>
      )}
    </SettingsGroup>
  );
}
