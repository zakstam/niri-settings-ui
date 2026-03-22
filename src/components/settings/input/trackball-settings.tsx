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
import { SliderInput } from "@/lib/slider-input";
import { accelProfileItems, mouseScrollMethodItems } from "@/lib/defaults";
import type { NiriConfig, PointerConfig } from "@/lib/types";

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
    <div className="space-y-6">
      <SettingsGroup title="General">
        <SettingsRow label="Disable Trackball" description="Ignore all trackball input">
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
          <SliderInput
            value={tb.accelSpeed ?? 0}
            min={-1}
            max={1}
            step={0.1}
            fallback={0}
            sliderClassName="w-48"
            inputClassName="w-24"
            onValueChange={(v) => updateConfig((prev) => updateTrackball(prev, { accelSpeed: v }))}
          />
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
                {mouseScrollMethodItems.map((item) => (
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
