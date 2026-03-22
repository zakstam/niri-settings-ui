import { useConfig } from "@/lib/config-context";
import {
  Input,
  Switch,
  Button,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "spatial-grid-nav/primitives";
import { SettingsGroup, SettingsRow } from "spatial-grid-nav/layouts";
import { IconChevronDown } from "@tabler/icons-react";
import { ColorEditor } from "./color-editor";
import { GradientEditor } from "./gradient-editor";
import type { NiriConfig, TabIndicatorConfig, GradientConfig } from "@/lib/types";

function updateTabIndicator(
  prev: NiriConfig,
  patch: Partial<TabIndicatorConfig>,
): NiriConfig {
  return {
    ...prev,
    layout: {
      ...prev.layout,
      tabIndicator: { ...prev.layout.tabIndicator, ...patch },
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

export function TabIndicatorSettings() {
  const { config, updateConfig } = useConfig();

  if (!config) return null;

  const indicator = config.layout.tabIndicator;

  return (
    <SettingsGroup title="Tab Indicator" description="Visual indicator for tabbed column display">
      <SettingsRow label="Disable Tab Indicator" description="Hide the tab indicator">
        <Switch
          checked={indicator.off}
          onCheckedChange={(v) =>
            updateConfig((prev) => updateTabIndicator(prev, { off: v }))
          }
        />
      </SettingsRow>

      {!indicator.off && (
        <>
          <SettingsRow label="Active Color" description="Color of the active tab indicator">
            <ColorEditor
              value={indicator.activeColor}
              onChange={(v) =>
                updateConfig((prev) => updateTabIndicator(prev, { activeColor: v }))
              }
            />
          </SettingsRow>

          <SettingsRow label="Inactive Color" description="Color of inactive tab indicators">
            <ColorEditor
              value={indicator.inactiveColor}
              onChange={(v) =>
                updateConfig((prev) => updateTabIndicator(prev, { inactiveColor: v }))
              }
            />
          </SettingsRow>

          <SettingsRow label="Urgent Color" description="Color of the tab indicator for urgent windows">
            <ColorEditor
              value={indicator.urgentColor}
              onChange={(v) =>
                updateConfig((prev) => updateTabIndicator(prev, { urgentColor: v }))
              }
            />
          </SettingsRow>

          <SettingsRow label="Hide When Single Tab" description="Hide the indicator when there is only one tab">
            <Switch
              checked={indicator.hideWhenSingleTab}
              onCheckedChange={(v) =>
                updateConfig((prev) => updateTabIndicator(prev, { hideWhenSingleTab: v }))
              }
            />
          </SettingsRow>

          <SettingsRow label="Place Within Column" description="Place the indicator within the column area">
            <Switch
              checked={indicator.placeWithinColumn}
              onCheckedChange={(v) =>
                updateConfig((prev) => updateTabIndicator(prev, { placeWithinColumn: v }))
              }
            />
          </SettingsRow>

          <SettingsRow label="Gap" description="Gap between the indicator and the window">
            <Input
              type="number"
              value={indicator.gap ?? ""}
              placeholder="Not set"
              className="w-20"
              onChange={(e) =>
                updateConfig((prev) =>
                  updateTabIndicator(prev, {
                    gap: e.target.value === "" ? null : Number(e.target.value),
                  }),
                )
              }
            />
          </SettingsRow>

          <SettingsRow label="Width" description="Width of the tab indicator">
            <Input
              type="number"
              value={indicator.width ?? ""}
              placeholder="Not set"
              className="w-20"
              onChange={(e) =>
                updateConfig((prev) =>
                  updateTabIndicator(prev, {
                    width: e.target.value === "" ? null : Number(e.target.value),
                  }),
                )
              }
            />
          </SettingsRow>

          <SettingsRow label="Length" description="Length of the tab indicator">
            <Input
              type="number"
              value={indicator.length ?? ""}
              placeholder="Not set"
              className="w-20"
              onChange={(e) =>
                updateConfig((prev) =>
                  updateTabIndicator(prev, {
                    length: e.target.value === "" ? null : Number(e.target.value),
                  }),
                )
              }
            />
          </SettingsRow>

          <SettingsRow label="Position" description="Where to place the tab indicator">
            <Select
              value={indicator.position ?? "__none__"}
              onValueChange={(v) =>
                updateConfig((prev) =>
                  updateTabIndicator(prev, { position: v === "__none__" ? null : v }),
                )
              }
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="__none__">Not Set</SelectItem>
                  <SelectItem value="left">Left</SelectItem>
                  <SelectItem value="right">Right</SelectItem>
                  <SelectItem value="top">Top</SelectItem>
                  <SelectItem value="bottom">Bottom</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </SettingsRow>

          <SettingsRow label="Gaps Between Tabs" description="Gap size between individual tab indicators">
            <Input
              type="number"
              value={indicator.gapsBetweenTabs ?? ""}
              placeholder="Not set"
              className="w-20"
              onChange={(e) =>
                updateConfig((prev) =>
                  updateTabIndicator(prev, {
                    gapsBetweenTabs: e.target.value === "" ? null : Number(e.target.value),
                  }),
                )
              }
            />
          </SettingsRow>

          <SettingsRow label="Corner Radius" description="Corner radius of the tab indicator">
            <Input
              type="number"
              value={indicator.cornerRadius ?? ""}
              placeholder="Not set"
              step={0.1}
              className="w-20"
              onChange={(e) =>
                updateConfig((prev) =>
                  updateTabIndicator(prev, {
                    cornerRadius: e.target.value === "" ? null : Number(e.target.value),
                  }),
                )
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
              <div className="pt-1">
                <SettingsRow
                  label="Active Gradient"
                  description="Gradient overlay on the active tab indicator"
                >
                  <Switch
                    checked={indicator.activeGradient !== null}
                    onCheckedChange={(v) =>
                      updateConfig((prev) =>
                        updateTabIndicator(prev, {
                          activeGradient: v ? { ...defaultGradient } : null,
                        }),
                      )
                    }
                  />
                </SettingsRow>
                {indicator.activeGradient && (
                  <div className="px-4 pb-3">
                    <GradientEditor
                      value={indicator.activeGradient}
                      onChange={(v) =>
                        updateConfig((prev) =>
                          updateTabIndicator(prev, { activeGradient: v }),
                        )
                      }
                    />
                  </div>
                )}

                <SettingsRow
                  label="Inactive Gradient"
                  description="Gradient overlay on inactive tab indicators"
                >
                  <Switch
                    checked={indicator.inactiveGradient !== null}
                    onCheckedChange={(v) =>
                      updateConfig((prev) =>
                        updateTabIndicator(prev, {
                          inactiveGradient: v ? { ...defaultGradient } : null,
                        }),
                      )
                    }
                  />
                </SettingsRow>
                {indicator.inactiveGradient && (
                  <div className="px-4 pb-3">
                    <GradientEditor
                      value={indicator.inactiveGradient}
                      onChange={(v) =>
                        updateConfig((prev) =>
                          updateTabIndicator(prev, { inactiveGradient: v }),
                        )
                      }
                    />
                  </div>
                )}

                <SettingsRow
                  label="Urgent Gradient"
                  description="Gradient overlay on urgent tab indicators"
                >
                  <Switch
                    checked={indicator.urgentGradient !== null}
                    onCheckedChange={(v) =>
                      updateConfig((prev) =>
                        updateTabIndicator(prev, {
                          urgentGradient: v ? { ...defaultGradient } : null,
                        }),
                      )
                    }
                  />
                </SettingsRow>
                {indicator.urgentGradient && (
                  <div className="px-4 pb-3">
                    <GradientEditor
                      value={indicator.urgentGradient}
                      onChange={(v) =>
                        updateConfig((prev) =>
                          updateTabIndicator(prev, { urgentGradient: v }),
                        )
                      }
                    />
                  </div>
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>
        </>
      )}
    </SettingsGroup>
  );
}
