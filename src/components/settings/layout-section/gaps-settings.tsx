import { useConfig } from "@/lib/config-context";
import { SettingsGroup, SettingsRow } from "spatial-grid-nav/layouts";
import { SliderInput } from "@/lib/slider-input";

export function GapsSettings() {
  const { config, updateConfig } = useConfig();

  if (!config) return null;

  return (
    <SettingsGroup title="Gaps">
      <SettingsRow label="Gap Size" description="Pixel gap between tiled windows and around the workspace edges">
        <SliderInput
          value={config.layout.gaps ?? 0}
          min={0}
          max={64}
          step={1}
          sliderClassName="w-40"
          onValueChange={(v) =>
            updateConfig((prev) => ({
              ...prev,
              layout: { ...prev.layout, gaps: v },
            }))
          }
        />
      </SettingsRow>
    </SettingsGroup>
  );
}
