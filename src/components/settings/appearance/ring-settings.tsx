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

const defaultGradient: GradientConfig = {
  fromColor: "#ff0000",
  toColor: "#0000ff",
  angle: 180,
  relativeTo: null,
  colorSpace: null,
};

export function RingSettings() {
  const { config, updateConfig } = useConfig();

  if (!config) return null;

  const ring = config.layout.focusRing;

  return (
    <SettingsGroup title="Focus Ring" description="Visual indicator around the focused window">
      <SettingsRow label="Disable Focus Ring" description="Turn off the focus ring entirely">
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
            <div className="flex items-center gap-3">
              <Slider
                value={[ring.width ?? 0]}
                min={0}
                max={20}
                step={1}
                onValueChange={(val) => { const v = Array.isArray(val) ? val[0] : val;
                  updateConfig((prev) => updateFocusRing(prev, { width: v }));
                }}
                className="w-32"
              />
              <Input
                type="number"
                value={ring.width ?? ""}
                min={0}
                max={20}
                className="w-20"
                onChange={(e) =>
                  updateConfig((prev) =>
                    updateFocusRing(prev, { width: Number(e.target.value) || 0 }),
                  )
                }
              />
            </div>
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
                      checked={ring.activeGradient !== null}
                      onCheckedChange={(v) =>
                        updateConfig((prev) =>
                          updateFocusRing(prev, {
                            activeGradient: v ? { ...defaultGradient } : null,
                          }),
                        )
                      }
                    />
                  </div>
                  {ring.activeGradient && (
                    <GradientEditor
                      value={ring.activeGradient}
                      onChange={(v) =>
                        updateConfig((prev) =>
                          updateFocusRing(prev, { activeGradient: v }),
                        )
                      }
                    />
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Inactive Gradient</span>
                    <Switch
                      checked={ring.inactiveGradient !== null}
                      onCheckedChange={(v) =>
                        updateConfig((prev) =>
                          updateFocusRing(prev, {
                            inactiveGradient: v ? { ...defaultGradient } : null,
                          }),
                        )
                      }
                    />
                  </div>
                  {ring.inactiveGradient && (
                    <GradientEditor
                      value={ring.inactiveGradient}
                      onChange={(v) =>
                        updateConfig((prev) =>
                          updateFocusRing(prev, { inactiveGradient: v }),
                        )
                      }
                    />
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Urgent Gradient</span>
                    <Switch
                      checked={ring.urgentGradient !== null}
                      onCheckedChange={(v) =>
                        updateConfig((prev) =>
                          updateFocusRing(prev, {
                            urgentGradient: v ? { ...defaultGradient } : null,
                          }),
                        )
                      }
                    />
                  </div>
                  {ring.urgentGradient && (
                    <GradientEditor
                      value={ring.urgentGradient}
                      onChange={(v) =>
                        updateConfig((prev) =>
                          updateFocusRing(prev, { urgentGradient: v }),
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
