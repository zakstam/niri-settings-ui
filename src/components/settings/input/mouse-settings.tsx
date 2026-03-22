import { useConfig } from "@/lib/config-context";
import {
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

function updateMouse(
  prev: NiriConfig,
  patch: Partial<PointerConfig>,
): NiriConfig {
  return {
    ...prev,
    input: {
      ...prev.input,
      mouse: { ...prev.input.mouse, ...patch },
    },
  };
}

export function MouseSettings() {
  const { config, updateConfig } = useConfig();

  if (!config) return null;

  const mouse = config.input.mouse;

  return (
    <div className="space-y-6">
      <SettingsGroup title="General">
        <SettingsRow label="Disable Mouse" description="Ignore all mouse input">
          <Switch
            checked={mouse.off}
            onCheckedChange={(v) => updateConfig((prev) => updateMouse(prev, { off: v }))}
          />
        </SettingsRow>

        <SettingsRow label="Natural Scroll" description="Reverse scroll direction">
          <Switch
            checked={mouse.naturalScroll}
            onCheckedChange={(v) => updateConfig((prev) => updateMouse(prev, { naturalScroll: v }))}
          />
        </SettingsRow>

        <SettingsRow label="Middle Emulation" description="Emulate middle button by pressing left and right buttons simultaneously">
          <Switch
            checked={mouse.middleEmulation}
            onCheckedChange={(v) => updateConfig((prev) => updateMouse(prev, { middleEmulation: v }))}
          />
        </SettingsRow>

        <SettingsRow label="Left Handed" description="Swap left and right buttons">
          <Switch
            checked={mouse.leftHanded}
            onCheckedChange={(v) => updateConfig((prev) => updateMouse(prev, { leftHanded: v }))}
          />
        </SettingsRow>
      </SettingsGroup>

      <SettingsGroup title="Acceleration">
        <SettingsRow label="Acceleration Speed" description="Pointer acceleration speed (-1 to 1)">
          <SliderInput
            value={mouse.accelSpeed ?? 0}
            min={-1}
            max={1}
            step={0.1}
            fallback={0}
            sliderClassName="w-48"
            inputClassName="w-24"
            onValueChange={(v) => updateConfig((prev) => updateMouse(prev, { accelSpeed: v }))}
          />
        </SettingsRow>

        <SettingsRow label="Acceleration Profile" description="Method used for pointer acceleration">
          <Select
            value={mouse.accelProfile ?? "adaptive"}
            onValueChange={(v) => updateConfig((prev) => updateMouse(prev, { accelProfile: v }))}
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
        <SettingsRow label="Scroll Method" description="How scrolling is performed with the mouse">
          <Select
            value={mouse.scrollMethod ?? "no-scroll"}
            onValueChange={(v) => updateConfig((prev) => updateMouse(prev, { scrollMethod: v }))}
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

        <SettingsRow label="Scroll Factor" description="Multiplier for scroll speed (default 1.0)">
          <SliderInput
            value={mouse.scrollFactor ?? 1.0}
            min={0.1}
            max={5}
            step={0.1}
            sliderClassName="w-48"
            inputClassName="w-24"
            onValueChange={(v) => updateConfig((prev) => updateMouse(prev, { scrollFactor: v }))}
          />
        </SettingsRow>
      </SettingsGroup>
    </div>
  );
}
