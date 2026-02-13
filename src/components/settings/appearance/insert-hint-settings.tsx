import { useConfig } from "@/lib/config-context";
import { SettingsGroup } from "@/components/layout/settings-group";
import { SettingsRow } from "@/components/layout/settings-row";
import { Switch } from "@/components/ui/switch";
import { ColorEditor } from "./color-editor";
import { GradientEditor } from "./gradient-editor";
import type { NiriConfig, InsertHintConfig, GradientConfig } from "@/lib/types";

function updateInsertHint(
  prev: NiriConfig,
  patch: Partial<InsertHintConfig>,
): NiriConfig {
  return {
    ...prev,
    layout: {
      ...prev.layout,
      insertHint: { ...prev.layout.insertHint, ...patch },
    },
  };
}

const defaultGradient: GradientConfig = {
  from: "#ff0000",
  to: "#0000ff",
  angle: 180,
  relativeTo: null,
  colorSpace: null,
};

export function InsertHintSettings() {
  const { config, updateConfig } = useConfig();

  if (!config) return null;

  const hint = config.layout.insertHint;

  return (
    <SettingsGroup
      title="Insert Hint"
      description="Visual hint showing where a new window will be inserted"
    >
      <SettingsRow label="Disable Insert Hint" description="Turn off the insert hint">
        <Switch
          checked={hint.off}
          onCheckedChange={(v) =>
            updateConfig((prev) => updateInsertHint(prev, { off: v }))
          }
        />
      </SettingsRow>

      {!hint.off && (
        <>
          <SettingsRow label="Color" description="Color of the insert hint">
            <ColorEditor
              value={hint.color}
              onChange={(v) =>
                updateConfig((prev) => updateInsertHint(prev, { color: v }))
              }
            />
          </SettingsRow>

          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Gradient</span>
              <Switch
                checked={hint.gradient !== null}
                onCheckedChange={(v) =>
                  updateConfig((prev) =>
                    updateInsertHint(prev, {
                      gradient: v ? { ...defaultGradient } : null,
                    }),
                  )
                }
              />
            </div>
            {hint.gradient && (
              <GradientEditor
                value={hint.gradient}
                onChange={(v) =>
                  updateConfig((prev) =>
                    updateInsertHint(prev, { gradient: v }),
                  )
                }
              />
            )}
          </div>
        </>
      )}
    </SettingsGroup>
  );
}
