import { useConfig } from "@/lib/config-context";
import {
  Input,
  Switch,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "spatial-grid-nav/primitives";
import { SettingsGroup, SettingsRow } from "spatial-grid-nav/layouts";
import { ColorEditor } from "./color-editor";
import { GradientOptionsSection } from "./gradient-options-section";
import type { NiriConfig, TabIndicatorConfig } from "@/lib/types";

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

export function TabIndicatorSettings() {
  const { config, updateConfig } = useConfig();

  if (!config) return null;

  const indicator = config.layout.tabIndicator;

  return (
    <SettingsGroup title="Tab Indicator">
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

          <GradientOptionsSection
            subject="tab indicator"
            activeGradient={indicator.activeGradient}
            inactiveGradient={indicator.inactiveGradient}
            urgentGradient={indicator.urgentGradient}
            onActiveGradientChange={(v) =>
              updateConfig((prev) => updateTabIndicator(prev, { activeGradient: v }))
            }
            onInactiveGradientChange={(v) =>
              updateConfig((prev) => updateTabIndicator(prev, { inactiveGradient: v }))
            }
            onUrgentGradientChange={(v) =>
              updateConfig((prev) => updateTabIndicator(prev, { urgentGradient: v }))
            }
          />
        </>
      )}
    </SettingsGroup>
  );
}
