import { useConfig } from "@/lib/config-context";
import { SettingsGroup } from "@/components/layout/settings-group";
import { SettingsRow } from "@/components/layout/settings-row";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import type { NiriConfig, TabletConfig } from "@/lib/types";

function updateTablet(
  prev: NiriConfig,
  patch: Partial<TabletConfig>,
): NiriConfig {
  return {
    ...prev,
    input: {
      ...prev.input,
      tablet: { ...prev.input.tablet, ...patch },
    },
  };
}

export function TabletSettings() {
  const { config, updateConfig } = useConfig();

  if (!config) return null;

  const tablet = config.input.tablet;

  return (
    <div className="space-y-6">
      <SettingsGroup title="Tablet">
        <SettingsRow label="Map to Output" description="Constrain the tablet to a specific output">
          <Input
            value={tablet.mapToOutput ?? ""}
            placeholder="Output name"
            className="w-44"
            onChange={(e) =>
              updateConfig((prev) =>
                updateTablet(prev, {
                  mapToOutput: e.target.value === "" ? null : e.target.value,
                }),
              )
            }
          />
        </SettingsRow>

        <SettingsRow label="Left Handed" description="Swap tablet orientation for left-handed use">
          <Switch
            checked={tablet.leftHanded}
            onCheckedChange={(v) =>
              updateConfig((prev) => updateTablet(prev, { leftHanded: v }))
            }
          />
        </SettingsRow>
      </SettingsGroup>
    </div>
  );
}
