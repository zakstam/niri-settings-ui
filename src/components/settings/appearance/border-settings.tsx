import { useConfig } from "@/lib/config-context";
import { SettingsGroup } from "@/components/layout/settings-group";
import { SettingsRow } from "@/components/layout/settings-row";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { IconChevronDown } from "@tabler/icons-react";
import { ColorEditor } from "./color-editor";
import { GradientEditor } from "./gradient-editor";
import type { NiriConfig, RingBorderConfig, GradientConfig } from "@/lib/types";

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

const defaultGradient: GradientConfig = {
  fromColor: "#ff0000",
  toColor: "#0000ff",
  angle: 180,
  relativeTo: null,
  colorSpace: null,
};

export function BorderSettings() {
  const { config, updateConfig } = useConfig();

  if (!config) return null;

  const border = config.layout.border;

  return (
    <SettingsGroup title="Window Border" description="Border drawn around windows">
      <SettingsRow label="Disable Border" description="Turn off window borders entirely">
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
            <div className="flex items-center gap-3">
              <Slider
                value={[border.width ?? 0]}
                min={0}
                max={20}
                step={1}
                onValueChange={(val) => { const v = Array.isArray(val) ? val[0] : val;
                  updateConfig((prev) => updateBorder(prev, { width: v }));
                }}
                className="w-32"
              />
              <Input
                type="number"
                value={border.width ?? ""}
                min={0}
                max={20}
                className="w-20"
                onChange={(e) =>
                  updateConfig((prev) =>
                    updateBorder(prev, { width: Number(e.target.value) || 0 }),
                  )
                }
              />
            </div>
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

          <Collapsible>
            <CollapsibleTrigger
              render={<Button variant="ghost" size="sm" className="w-full justify-between" />}
            >
              Gradient Options
              <IconChevronDown size={16} />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="space-y-4 pt-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Active Gradient</span>
                    <Switch
                      checked={border.activeGradient !== null}
                      onCheckedChange={(v) =>
                        updateConfig((prev) =>
                          updateBorder(prev, {
                            activeGradient: v ? { ...defaultGradient } : null,
                          }),
                        )
                      }
                    />
                  </div>
                  {border.activeGradient && (
                    <GradientEditor
                      value={border.activeGradient}
                      onChange={(v) =>
                        updateConfig((prev) =>
                          updateBorder(prev, { activeGradient: v }),
                        )
                      }
                    />
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Inactive Gradient</span>
                    <Switch
                      checked={border.inactiveGradient !== null}
                      onCheckedChange={(v) =>
                        updateConfig((prev) =>
                          updateBorder(prev, {
                            inactiveGradient: v ? { ...defaultGradient } : null,
                          }),
                        )
                      }
                    />
                  </div>
                  {border.inactiveGradient && (
                    <GradientEditor
                      value={border.inactiveGradient}
                      onChange={(v) =>
                        updateConfig((prev) =>
                          updateBorder(prev, { inactiveGradient: v }),
                        )
                      }
                    />
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Urgent Gradient</span>
                    <Switch
                      checked={border.urgentGradient !== null}
                      onCheckedChange={(v) =>
                        updateConfig((prev) =>
                          updateBorder(prev, {
                            urgentGradient: v ? { ...defaultGradient } : null,
                          }),
                        )
                      }
                    />
                  </div>
                  {border.urgentGradient && (
                    <GradientEditor
                      value={border.urgentGradient}
                      onChange={(v) =>
                        updateConfig((prev) =>
                          updateBorder(prev, { urgentGradient: v }),
                        )
                      }
                    />
                  )}
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </>
      )}
    </SettingsGroup>
  );
}
