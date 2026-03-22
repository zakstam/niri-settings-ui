import { useConfig } from "@/lib/config-context";
import {
  Input,
  Switch,
  Slider,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "spatial-grid-nav/primitives";
import { SettingsGroup, SettingsRow } from "spatial-grid-nav/layouts";
import type { NiriConfig, PointerConfig } from "@/lib/types";

const accelProfileItems = [
  { label: "Adaptive", value: "adaptive" },
  { label: "Flat", value: "flat" },
];

const scrollMethodItems = [
  { label: "Two Finger", value: "two-finger" },
  { label: "Edge", value: "edge" },
  { label: "On Button Down", value: "on-button-down" },
  { label: "No Scroll", value: "no-scroll" },
];

function updateTouchpad(
  prev: NiriConfig,
  patch: Partial<PointerConfig>,
): NiriConfig {
  return {
    ...prev,
    input: {
      ...prev.input,
      touchpad: { ...prev.input.touchpad, ...patch },
    },
  };
}

export function TouchpadSettings() {
  const { config, updateConfig } = useConfig();

  if (!config) return null;

  const tp = config.input.touchpad;

  return (
    <div className="space-y-6">
      <SettingsGroup title="General">
        <SettingsRow label="Disable Touchpad" description="Turn off the touchpad entirely">
          <Switch
            checked={tp.off}
            onCheckedChange={(v) => updateConfig((prev) => updateTouchpad(prev, { off: v }))}
          />
        </SettingsRow>

        <SettingsRow label="Tap to Click" description="Tap the touchpad to register a click">
          <Switch
            checked={tp.tap}
            onCheckedChange={(v) => updateConfig((prev) => updateTouchpad(prev, { tap: v }))}
          />
        </SettingsRow>

        <SettingsRow label="Natural Scroll" description="Reverse scroll direction">
          <Switch
            checked={tp.naturalScroll}
            onCheckedChange={(v) => updateConfig((prev) => updateTouchpad(prev, { naturalScroll: v }))}
          />
        </SettingsRow>

        <SettingsRow label="Disable While Typing" description="Deactivate the touchpad when typing on the keyboard">
          <Switch
            checked={tp.dwt}
            onCheckedChange={(v) => updateConfig((prev) => updateTouchpad(prev, { dwt: v }))}
          />
        </SettingsRow>

        <SettingsRow label="Disable While Trackpointing" description="Deactivate the touchpad when using a trackpoint">
          <Switch
            checked={tp.dwtp}
            onCheckedChange={(v) => updateConfig((prev) => updateTouchpad(prev, { dwtp: v }))}
          />
        </SettingsRow>

        <SettingsRow label="Disabled on External Mouse" description="Disable when an external mouse is connected">
          <Switch
            checked={tp.disabledOnExternalMouse}
            onCheckedChange={(v) => updateConfig((prev) => updateTouchpad(prev, { disabledOnExternalMouse: v }))}
          />
        </SettingsRow>

        <SettingsRow label="Left Handed" description="Swap left and right buttons">
          <Switch
            checked={tp.leftHanded}
            onCheckedChange={(v) => updateConfig((prev) => updateTouchpad(prev, { leftHanded: v }))}
          />
        </SettingsRow>
      </SettingsGroup>

      <SettingsGroup title="Drag">
        <SettingsRow label="Drag" description="Enable tap-and-drag gestures">
          <Switch
            checked={tp.drag ?? false}
            onCheckedChange={(v) => updateConfig((prev) => updateTouchpad(prev, { drag: v }))}
          />
        </SettingsRow>

        <SettingsRow label="Drag Lock" description="Continue dragging after lifting the finger briefly">
          <Switch
            checked={tp.dragLock}
            onCheckedChange={(v) => updateConfig((prev) => updateTouchpad(prev, { dragLock: v }))}
          />
        </SettingsRow>
      </SettingsGroup>

      <SettingsGroup title="Acceleration">
        <SettingsRow label="Acceleration Speed" description="Pointer acceleration speed (-1 to 1)">
          <div className="flex items-center gap-3">
            <Slider
              value={[tp.accelSpeed ?? 0]}
              min={-1}
              max={1}
              step={0.1}
              onValueChange={(v) => updateConfig((prev) => updateTouchpad(prev, { accelSpeed: Array.isArray(v) ? v[0] : v }))}
              className="w-48"
            />
            <Input
              type="number"
              value={tp.accelSpeed ?? 0}
              min={-1}
              max={1}
              step={0.1}
              className="w-24"
              onChange={(e) =>
                updateConfig((prev) =>
                  updateTouchpad(prev, {
                    accelSpeed: e.target.value === "" ? null : Number(e.target.value),
                  }),
                )
              }
            />
          </div>
        </SettingsRow>

        <SettingsRow label="Acceleration Profile" description="Method used for pointer acceleration">
          <Select
            value={tp.accelProfile ?? "adaptive"}
            onValueChange={(v) => updateConfig((prev) => updateTouchpad(prev, { accelProfile: v }))}
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
        <SettingsRow label="Scroll Method" description="How scrolling is performed on the touchpad">
          <Select
            value={tp.scrollMethod ?? "two-finger"}
            onValueChange={(v) => updateConfig((prev) => updateTouchpad(prev, { scrollMethod: v }))}
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

        <SettingsRow label="Scroll Factor" description="Multiplier for scroll speed (default 1.0)">
          <div className="flex items-center gap-3">
            <Slider
              value={[tp.scrollFactor ?? 1.0]}
              min={0.1}
              max={5}
              step={0.1}
              onValueChange={(v) => updateConfig((prev) => updateTouchpad(prev, { scrollFactor: Array.isArray(v) ? v[0] : v }))}
              className="w-48"
            />
            <Input
              type="number"
              value={tp.scrollFactor ?? 1.0}
              min={0.1}
              max={5}
              step={0.1}
              className="w-24"
              onChange={(e) =>
                updateConfig((prev) =>
                  updateTouchpad(prev, {
                    scrollFactor: e.target.value === "" ? null : Number(e.target.value),
                  }),
                )
              }
            />
          </div>
        </SettingsRow>
      </SettingsGroup>

      <SettingsGroup title="Button Mapping">
        <SettingsRow label="Tap Button Map" description="Order of buttons when tapping with multiple fingers">
          <Select
            value={tp.tapButtonMap ?? "__none__"}
            onValueChange={(v) => updateConfig((prev) => updateTouchpad(prev, { tapButtonMap: v === "__none__" ? null : v }))}
          >
            <SelectTrigger className="w-52">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="__none__">Not Set</SelectItem>
                <SelectItem value="left-right-middle">Left-Right-Middle</SelectItem>
                <SelectItem value="left-middle-right">Left-Middle-Right</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </SettingsRow>

        <SettingsRow label="Click Method" description="Method used for button clicks on the touchpad">
          <Select
            value={tp.clickMethod ?? "__none__"}
            onValueChange={(v) => updateConfig((prev) => updateTouchpad(prev, { clickMethod: v === "__none__" ? null : v }))}
          >
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="__none__">Not Set</SelectItem>
                <SelectItem value="button-areas">Button Areas</SelectItem>
                <SelectItem value="clickfinger">Clickfinger</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </SettingsRow>
      </SettingsGroup>
    </div>
  );
}
