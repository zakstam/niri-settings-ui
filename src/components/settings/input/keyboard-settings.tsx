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

export function KeyboardSettings() {
  const { config, updateConfig } = useConfig();

  if (!config) return null;

  const { xkb } = config.input.keyboard;

  return (
    <div className="space-y-6">
      <SettingsGroup title="XKB Configuration" description="X keyboard extension layout settings">
        <SettingsRow label="Layout" description="Keyboard layout (e.g. us, de, fr)">
          <Input
            value={xkb.layout ?? ""}
            placeholder="us"
            className="w-48"
            onChange={(e) =>
              updateConfig((prev) => ({
                ...prev,
                input: {
                  ...prev.input,
                  keyboard: {
                    ...prev.input.keyboard,
                    xkb: {
                      ...prev.input.keyboard.xkb,
                      layout: e.target.value || null,
                    },
                  },
                },
              }))
            }
          />
        </SettingsRow>

        <SettingsRow label="Model" description="Keyboard model (e.g. pc104, pc105)">
          <Input
            value={xkb.model ?? ""}
            placeholder="pc105"
            className="w-48"
            onChange={(e) =>
              updateConfig((prev) => ({
                ...prev,
                input: {
                  ...prev.input,
                  keyboard: {
                    ...prev.input.keyboard,
                    xkb: {
                      ...prev.input.keyboard.xkb,
                      model: e.target.value || null,
                    },
                  },
                },
              }))
            }
          />
        </SettingsRow>

        <SettingsRow label="Variant" description="Layout variant (e.g. dvorak, colemak)">
          <Input
            value={xkb.variant ?? ""}
            placeholder=""
            className="w-48"
            onChange={(e) =>
              updateConfig((prev) => ({
                ...prev,
                input: {
                  ...prev.input,
                  keyboard: {
                    ...prev.input.keyboard,
                    xkb: {
                      ...prev.input.keyboard.xkb,
                      variant: e.target.value || null,
                    },
                  },
                },
              }))
            }
          />
        </SettingsRow>

        <SettingsRow label="Options" description="XKB options (e.g. ctrl:nocaps, compose:ralt)">
          <Input
            value={xkb.options ?? ""}
            placeholder=""
            className="w-48"
            onChange={(e) =>
              updateConfig((prev) => ({
                ...prev,
                input: {
                  ...prev.input,
                  keyboard: {
                    ...prev.input.keyboard,
                    xkb: {
                      ...prev.input.keyboard.xkb,
                      options: e.target.value || null,
                    },
                  },
                },
              }))
            }
          />
        </SettingsRow>

        <SettingsRow label="Rules" description="XKB rules file">
          <Input
            value={xkb.rules ?? ""}
            placeholder=""
            className="w-48"
            onChange={(e) =>
              updateConfig((prev) => ({
                ...prev,
                input: {
                  ...prev.input,
                  keyboard: {
                    ...prev.input.keyboard,
                    xkb: {
                      ...prev.input.keyboard.xkb,
                      rules: e.target.value || null,
                    },
                  },
                },
              }))
            }
          />
        </SettingsRow>
      </SettingsGroup>

      <SettingsGroup title="Numlock">
        <SettingsRow label="Enable Numlock" description="Turn on Num Lock at startup">
          <Switch
            checked={config.input.keyboard.numlock}
            onCheckedChange={(v) =>
              updateConfig((prev) => ({
                ...prev,
                input: {
                  ...prev.input,
                  keyboard: {
                    ...prev.input.keyboard,
                    numlock: v,
                  },
                },
              }))
            }
          />
        </SettingsRow>
      </SettingsGroup>

      <SettingsGroup title="Key Repeat">
        <SettingsRow label="Repeat Delay (ms)" description="Delay before key repeat starts">
          <Input
            type="number"
            value={config.input.keyboard.repeatDelay ?? ""}
            placeholder="600"
            min={0}
            className="w-28"
            onChange={(e) =>
              updateConfig((prev) => ({
                ...prev,
                input: {
                  ...prev.input,
                  keyboard: {
                    ...prev.input.keyboard,
                    repeatDelay: e.target.value === "" ? null : Number(e.target.value),
                  },
                },
              }))
            }
          />
        </SettingsRow>

        <SettingsRow label="Repeat Rate" description="Keys per second during repeat">
          <Input
            type="number"
            value={config.input.keyboard.repeatRate ?? ""}
            placeholder="25"
            min={0}
            className="w-28"
            onChange={(e) =>
              updateConfig((prev) => ({
                ...prev,
                input: {
                  ...prev.input,
                  keyboard: {
                    ...prev.input.keyboard,
                    repeatRate: e.target.value === "" ? null : Number(e.target.value),
                  },
                },
              }))
            }
          />
        </SettingsRow>

        <SettingsRow label="Track Layout" description="Track keyboard layout changes per-window or globally">
          <Select
            value={config.input.keyboard.trackLayout ?? "__none__"}
            onValueChange={(v) =>
              updateConfig((prev) => ({
                ...prev,
                input: {
                  ...prev.input,
                  keyboard: {
                    ...prev.input.keyboard,
                    trackLayout: v === "__none__" ? null : v,
                  },
                },
              }))
            }
          >
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="__none__">Not Set</SelectItem>
                <SelectItem value="window">Window</SelectItem>
                <SelectItem value="global">Global</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </SettingsRow>
      </SettingsGroup>
    </div>
  );
}
