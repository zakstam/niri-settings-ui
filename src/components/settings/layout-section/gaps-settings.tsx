import { useConfig } from "@/lib/config-context";
import { Input, Slider } from "spatial-grid-nav/primitives";
import { SettingsGroup, SettingsRow } from "spatial-grid-nav/layouts";

export function GapsSettings() {
  const { config, updateConfig } = useConfig();

  if (!config) return null;

  return (
    <SettingsGroup title="Gaps">
      <SettingsRow label="Gap Size" description="Pixel gap between tiled windows and around the workspace edges">
        <div className="flex items-center gap-3">
          <Slider
            value={[config.layout.gaps ?? 0]}
            min={0}
            max={64}
            step={1}
            onValueChange={(val) => { const v = Array.isArray(val) ? val[0] : val;
              updateConfig((prev) => ({
                ...prev,
                layout: { ...prev.layout, gaps: v },
              }));
            }}
            className="w-40"
          />
          <Input
            type="number"
            value={config.layout.gaps ?? ""}
            min={0}
            max={64}
            step={1}
            className="w-20"
            onChange={(e) =>
              updateConfig((prev) => ({
                ...prev,
                layout: { ...prev.layout, gaps: Number(e.target.value) || 0 },
              }))
            }
          />
        </div>
      </SettingsRow>
    </SettingsGroup>
  );
}
