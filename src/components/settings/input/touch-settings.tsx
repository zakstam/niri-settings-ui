import { useConfig } from "@/lib/config-context";
import { SettingsGroup } from "@/components/layout/settings-group";
import { SettingsRow } from "@/components/layout/settings-row";
import { Input } from "@/components/ui/input";
import type { NiriConfig, TouchConfig } from "@/lib/types";

function updateTouch(
  prev: NiriConfig,
  patch: Partial<TouchConfig>,
): NiriConfig {
  return {
    ...prev,
    input: {
      ...prev.input,
      touch: { ...prev.input.touch, ...patch },
    },
  };
}

export function TouchSettings() {
  const { config, updateConfig } = useConfig();

  if (!config) return null;

  const touch = config.input.touch;

  return (
    <div className="space-y-6">
      <SettingsGroup title="Touch">
        <SettingsRow label="Map to Output" description="Constrain touch input to a specific output">
          <Input
            value={touch.mapToOutput ?? ""}
            placeholder="Output name"
            className="w-44"
            onChange={(e) =>
              updateConfig((prev) =>
                updateTouch(prev, {
                  mapToOutput: e.target.value === "" ? null : e.target.value,
                }),
              )
            }
          />
        </SettingsRow>
      </SettingsGroup>
    </div>
  );
}
