import { useState } from "react";
import { useConfig } from "@/lib/config-context";
import { Button, Input, Switch, Badge, Card, CardContent, Separator, Textarea } from "spatial-grid-nav/primitives";
import { PageHeader, SettingsGroup, SettingsRow } from "spatial-grid-nav/layouts";
import { IconPlus, IconTrash } from "@tabler/icons-react";
import type { LayerRule } from "@/lib/types";

function generateId(): string {
  return Math.random().toString(36).substring(2, 10);
}

export function AdvancedSection() {
  const { config, updateConfig } = useConfig();
  const [newNamespace, setNewNamespace] = useState("");

  if (!config) return null;

  function addLayerRule() {
    if (!newNamespace.trim()) return;
    const newRule: LayerRule = {
      id: generateId(),
      matches: [{ namespace: newNamespace.trim(), atStartup: null }],
      blockOutFrom: null,
      opacity: null,
      placeWithinBackdrop: null,
    };
    updateConfig((prev) => ({
      ...prev,
      layerRules: [...prev.layerRules, newRule],
    }));
    setNewNamespace("");
  }

  function deleteLayerRule(id: string) {
    updateConfig((prev) => ({
      ...prev,
      layerRules: prev.layerRules.filter((r) => r.id !== id),
    }));
  }

  return (
    <div>
      <PageHeader title="Advanced" />

      <div className="space-y-6">
        <SettingsGroup
          title="Layer Rules"
        >
          {config.layerRules.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-8">
              <p className="text-sm text-muted-foreground">
                No layer rules configured.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {config.layerRules.map((rule) => (
                <Card key={rule.id} size="sm">
                  <CardContent className="flex items-center gap-2 py-2">
                    <div className="flex flex-1 flex-wrap items-center gap-1.5">
                      {rule.matches.map((m, i) => (
                        <Badge key={i} variant="outline">
                          {m.namespace ?? "any"}
                        </Badge>
                      ))}
                      {rule.placeWithinBackdrop && (
                        <Badge variant="secondary">backdrop</Badge>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      aria-label="Delete"
                      onClick={() => deleteLayerRule(rule.id)}
                    >
                      <IconTrash size={14} />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <div className="flex items-center gap-2 pt-2">
            <Input
              value={newNamespace}
              onChange={(e) => setNewNamespace(e.target.value)}
              placeholder="Namespace (e.g. waybar)"
              className="flex-1"
              onKeyDown={(e) => {
                if (e.key === "Enter") addLayerRule();
              }}
            />
            <Button variant="outline" size="sm" onClick={addLayerRule}>
              <IconPlus size={16} />
              Add
            </Button>
          </div>
        </SettingsGroup>

        <SettingsGroup title="Cursor">
          <SettingsRow label="Theme" description="XCursor theme name">
            <Input
              value={config.cursor.xcursorTheme ?? ""}
              placeholder="default"
              className="w-44"
              onChange={(e) =>
                updateConfig((prev) => ({
                  ...prev,
                  cursor: {
                    ...prev.cursor,
                    xcursorTheme: e.target.value || null,
                  },
                }))
              }
            />
          </SettingsRow>

          <SettingsRow label="Size" description="Cursor size in pixels">
            <Input
              type="number"
              value={config.cursor.xcursorSize ?? ""}
              placeholder="24"
              min={1}
              className="w-24"
              onChange={(e) =>
                updateConfig((prev) => ({
                  ...prev,
                  cursor: {
                    ...prev.cursor,
                    xcursorSize: e.target.value === "" ? null : Number(e.target.value),
                  },
                }))
              }
            />
          </SettingsRow>

          <SettingsRow label="Hide When Typing" description="Hide the cursor when typing on the keyboard">
            <Switch
              checked={config.cursor.hideWhenTyping}
              onCheckedChange={(v) =>
                updateConfig((prev) => ({
                  ...prev,
                  cursor: { ...prev.cursor, hideWhenTyping: v },
                }))
              }
            />
          </SettingsRow>

          <SettingsRow label="Hide After Inactive (ms)" description="Hide cursor after inactivity in milliseconds">
            <Input
              type="number"
              value={config.cursor.hideAfterInactiveMs ?? ""}
              placeholder="Not set"
              min={0}
              className="w-28"
              onChange={(e) =>
                updateConfig((prev) => ({
                  ...prev,
                  cursor: {
                    ...prev.cursor,
                    hideAfterInactiveMs: e.target.value === "" ? null : Number(e.target.value),
                  },
                }))
              }
            />
          </SettingsRow>
        </SettingsGroup>

        <SettingsGroup title="Clipboard">
          <SettingsRow label="Disable Primary Selection" description="Prevent middle-click paste from the selection clipboard">
            <Switch
              checked={config.clipboard.disablePrimary}
              onCheckedChange={(v) =>
                updateConfig((prev) => ({
                  ...prev,
                  clipboard: { ...prev.clipboard, disablePrimary: v },
                }))
              }
            />
          </SettingsRow>
        </SettingsGroup>

        <SettingsGroup title="Xwayland Satellite">
          <SettingsRow label="Path" description="Path to the xwayland-satellite binary">
            <Input
              value={config.xwaylandSatellite.path ?? ""}
              placeholder="xwayland-satellite"
              className="w-64"
              onChange={(e) =>
                updateConfig((prev) => ({
                  ...prev,
                  xwaylandSatellite: {
                    ...prev.xwaylandSatellite,
                    path: e.target.value || null,
                  },
                }))
              }
            />
          </SettingsRow>
        </SettingsGroup>

        <SettingsGroup title="Config Notification">
          <SettingsRow label="Disable Failed Notification" description="Do not show a notification when config reload fails">
            <Switch
              checked={config.configNotification.disableFailed}
              onCheckedChange={(v) =>
                updateConfig((prev) => ({
                  ...prev,
                  configNotification: { ...prev.configNotification, disableFailed: v },
                }))
              }
            />
          </SettingsRow>
        </SettingsGroup>

        <SettingsGroup title="Hotkey Overlay">
          <SettingsRow label="Skip at Startup" description={"Don't show the \"Important Hotkeys\" popup at startup"}>
            <Switch
              checked={config.hotkeyOverlay.skipAtStartup}
              onCheckedChange={(v) =>
                updateConfig((prev) => ({
                  ...prev,
                  hotkeyOverlay: { ...prev.hotkeyOverlay, skipAtStartup: v },
                }))
              }
            />
          </SettingsRow>

          <SettingsRow label="Hide Not Bound" description="Hide key bindings that are not bound">
            <Switch
              checked={config.hotkeyOverlay.hideNotBound}
              onCheckedChange={(v) =>
                updateConfig((prev) => ({
                  ...prev,
                  hotkeyOverlay: { ...prev.hotkeyOverlay, hideNotBound: v },
                }))
              }
            />
          </SettingsRow>
        </SettingsGroup>

        <SettingsGroup
          title="Raw Configuration"
        >
          <Separator className="my-2" />
          <Textarea
            readOnly
            className="min-h-24 font-mono text-xs"
            value="# Edit ~/.config/niri/config.kdl directly for advanced settings not covered by this UI."
          />
          <p className="text-xs text-muted-foreground mt-2">
            Config file: ~/.config/niri/config.kdl
          </p>
        </SettingsGroup>
      </div>
    </div>
  );
}
