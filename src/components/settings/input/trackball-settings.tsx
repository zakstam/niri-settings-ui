import { useConfig } from "@/lib/config-context";
import { SettingsGroup } from "@/components/layout/settings-group";
import { SettingsRow } from "@/components/layout/settings-row";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { NiriConfig, PointerConfig } from "@/lib/types";

const accelProfileItems = [
  { label: "Adaptive", value: "adaptive" },
  { label: "Flat", value: "flat" },
];

const scrollMethodItems = [
  { label: "No Scroll", value: "no-scroll" },
  { label: "On Button Down", value: "on-button-down" },
];

function updateTrackball(
  prev: NiriConfig,
  patch: Partial<PointerConfig>,
): NiriConfig {
  return {
    ...prev,
    input: {
      ...prev.input,
      trackball: { ...prev.input.trackball, ...patch },
    },
  };
}

export function TrackballSettings() {
  const { config, updateConfig } = useConfig();

  if (!config) return null;

  const tb = config.input.trackball;

  return (
    <div className="space-y-8">
      <SettingsGroup title="General">
        <SettingsRow label="Disable Trackball" description="Turn off trackball input entirely">
          <Switch
            checked={tb.off}
            onCheckedChange={(v) => updateConfig((prev) => updateTrackball(prev, { off: v }))}
          />
        </SettingsRow>

        <SettingsRow label="Natural Scroll" description="Reverse scroll direction">
          <Switch
            checked={tb.naturalScroll}
            onCheckedChange={(v) => updateConfig((prev) => updateTrackball(prev, { naturalScroll: v }))}
          />
        </SettingsRow>

        <SettingsRow label="Middle Emulation" description="Emulate middle button by pressing left and right buttons simultaneously">
          <Switch
            checked={tb.middleEmulation}
            onCheckedChange={(v) => updateConfig((prev) => updateTrackball(prev, { middleEmulation: v }))}
          />
        </SettingsRow>

        <SettingsRow label="Left Handed" description="Swap left and right buttons">
          <Switch
            checked={tb.leftHanded}
            onCheckedChange={(v) => updateConfig((prev) => updateTrackball(prev, { leftHanded: v }))}
          />
        </SettingsRow>
      </SettingsGroup>

      <SettingsGroup title="Acceleration">
        <SettingsRow label="Acceleration Speed" description="Pointer acceleration speed (-1 to 1)">
          <div className="flex items-center gap-4">
            <Slider
              value={[tb.accelSpeed ?? 0]}
              min={-1}
              max={1}
              step={0.1}
              onValueChange={(val) => { const v = Array.isArray(val) ? val[0] : val; updateConfig((prev) => updateTrackball(prev, { accelSpeed: v })); }}
              className="w-48"
            />
            <Input
              type="number"
              value={tb.accelSpeed ?? 0}
              min={-1}
              max={1}
              step={0.1}
              className="w-24"
              onChange={(e) =>
                updateConfig((prev) =>
                  updateTrackball(prev, {
                    accelSpeed: e.target.value === "" ? null : Number(e.target.value),
                  }),
                )
              }
            />
          </div>
        </SettingsRow>

        <SettingsRow label="Acceleration Profile" description="Method used for pointer acceleration">
          <Select
            value={tb.accelProfile ?? "adaptive"}
            onValueChange={(v) => updateConfig((prev) => updateTrackball(prev, { accelProfile: v }))}
          >
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {accelProfileItems.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </SettingsRow>
      </SettingsGroup>

      <SettingsGroup title="Scrolling">
        <SettingsRow label="Scroll Method" description="How scrolling is performed with the trackball">
          <Select
            value={tb.scrollMethod ?? "no-scroll"}
            onValueChange={(v) => updateConfig((prev) => updateTrackball(prev, { scrollMethod: v }))}
          >
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {scrollMethodItems.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </SettingsRow>

        <SettingsRow label="Scroll Button" description="Mouse button number used for on-button-down scrolling">
          <Input
            type="number"
            value={tb.scrollButton ?? ""}
            placeholder="274"
            min={0}
            className="w-28"
            onChange={(e) =>
              updateConfig((prev) =>
                updateTrackball(prev, {
                  scrollButton: e.target.value === "" ? null : Number(e.target.value),
                }),
              )
            }
          />
        </SettingsRow>

        <SettingsRow label="Scroll Button Lock" description="Lock scroll button so you do not have to hold it">
          <Switch
            checked={tb.scrollButtonLock}
            onCheckedChange={(v) => updateConfig((prev) => updateTrackball(prev, { scrollButtonLock: v }))}
          />
        </SettingsRow>
      </SettingsGroup>
    </div>
  );
}
