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

export function FocusSettings() {
  const { config, updateConfig } = useConfig();

  if (!config) return null;

  const ffmEnabled = config.input.focusFollowsMouse !== null;

  return (
    <div className="space-y-8">
      <SettingsGroup title="Focus Behavior" description="Configure how window focus follows the mouse">
        <SettingsRow label="Warp Mouse to Focus" description="Move the mouse cursor to the newly focused window">
          <Switch
            checked={config.input.warpMouseToFocus}
            onCheckedChange={(v) =>
              updateConfig((prev) => ({
                ...prev,
                input: { ...prev.input, warpMouseToFocus: v },
              }))
            }
          />
        </SettingsRow>

        <SettingsRow label="Focus Follows Mouse" description="Automatically focus the window under the mouse cursor">
          <Switch
            checked={ffmEnabled}
            onCheckedChange={(v) =>
              updateConfig((prev) => ({
                ...prev,
                input: {
                  ...prev.input,
                  focusFollowsMouse: v ? { maxScrollAmount: null } : null,
                },
              }))
            }
          />
        </SettingsRow>

        {ffmEnabled && (
          <SettingsRow
            label="Max Scroll Amount"
            description="Maximum pixels to scroll the workspace to bring the focused window into view (e.g. 25%)"
          >
            <Input
              value={config.input.focusFollowsMouse?.maxScrollAmount ?? ""}
              placeholder="25%"
              className="w-32"
              onChange={(e) =>
                updateConfig((prev) => ({
                  ...prev,
                  input: {
                    ...prev.input,
                    focusFollowsMouse: {
                      ...prev.input.focusFollowsMouse!,
                      maxScrollAmount: e.target.value || null,
                    },
                  },
                }))
              }
            />
          </SettingsRow>
        )}
      </SettingsGroup>

      <SettingsGroup title="Input Options" description="Additional input behavior settings">
        <SettingsRow label="Disable Power Key Handling" description="Prevent niri from handling the power key">
          <Switch
            checked={config.input.disablePowerKeyHandling}
            onCheckedChange={(v) =>
              updateConfig((prev) => ({
                ...prev,
                input: { ...prev.input, disablePowerKeyHandling: v },
              }))
            }
          />
        </SettingsRow>

        <SettingsRow label="Workspace Auto Back-and-Forth" description="Switching to the current workspace switches to the previous one">
          <Switch
            checked={config.input.workspaceAutoBackAndForth}
            onCheckedChange={(v) =>
              updateConfig((prev) => ({
                ...prev,
                input: { ...prev.input, workspaceAutoBackAndForth: v },
              }))
            }
          />
        </SettingsRow>

        <SettingsRow label="Mod Key" description="Modifier key used for niri keybindings">
          <Select
            value={config.input.modKey ?? "__none__"}
            onValueChange={(v) =>
              updateConfig((prev) => ({
                ...prev,
                input: { ...prev.input, modKey: v === "__none__" ? null : v },
              }))
            }
          >
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="__none__">Not Set</SelectItem>
                <SelectItem value="Super">Super</SelectItem>
                <SelectItem value="Alt">Alt</SelectItem>
                <SelectItem value="Ctrl">Ctrl</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </SettingsRow>

        <SettingsRow label="Mod Key (Nested)" description="Mod key when running nested inside another niri">
          <Select
            value={config.input.modKeyNested ?? "__none__"}
            onValueChange={(v) =>
              updateConfig((prev) => ({
                ...prev,
                input: { ...prev.input, modKeyNested: v === "__none__" ? null : v },
              }))
            }
          >
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="__none__">Not Set</SelectItem>
                <SelectItem value="Super">Super</SelectItem>
                <SelectItem value="Alt">Alt</SelectItem>
                <SelectItem value="Ctrl">Ctrl</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </SettingsRow>
      </SettingsGroup>
    </div>
  );
}
