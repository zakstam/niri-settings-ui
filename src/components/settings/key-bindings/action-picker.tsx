import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";

const NIRI_ACTIONS = [
  "spawn",
  "spawn-sh",
  "close-window",
  "focus-column-left",
  "focus-column-right",
  "focus-window-up",
  "focus-window-down",
  "focus-window-or-workspace-up",
  "focus-window-or-workspace-down",
  "move-column-left",
  "move-column-right",
  "move-window-up",
  "move-window-down",
  "move-window-up-or-to-workspace-up",
  "move-window-down-or-to-workspace-down",
  "focus-column-first",
  "focus-column-last",
  "move-column-to-first",
  "move-column-to-last",
  "focus-workspace-up",
  "focus-workspace-down",
  "focus-workspace-previous",
  "focus-workspace-1",
  "focus-workspace-2",
  "focus-workspace-3",
  "focus-workspace-4",
  "focus-workspace-5",
  "focus-workspace-6",
  "focus-workspace-7",
  "focus-workspace-8",
  "focus-workspace-9",
  "move-column-to-workspace-up",
  "move-column-to-workspace-down",
  "move-column-to-workspace-1",
  "move-column-to-workspace-2",
  "move-column-to-workspace-3",
  "move-column-to-workspace-4",
  "move-column-to-workspace-5",
  "move-column-to-workspace-6",
  "move-column-to-workspace-7",
  "move-column-to-workspace-8",
  "move-column-to-workspace-9",
  "move-workspace-up",
  "move-workspace-down",
  "focus-monitor-left",
  "focus-monitor-right",
  "focus-monitor-up",
  "focus-monitor-down",
  "move-column-to-monitor-left",
  "move-column-to-monitor-right",
  "move-column-to-monitor-up",
  "move-column-to-monitor-down",
  "move-window-to-monitor-left",
  "move-window-to-monitor-right",
  "move-window-to-monitor-up",
  "move-window-to-monitor-down",
  "toggle-window-floating",
  "switch-focus-between-floating-and-tiling",
  "switch-preset-column-width",
  "switch-preset-window-height",
  "maximize-column",
  "fullscreen-window",
  "center-column",
  "center-visible-columns",
  "set-column-width",
  "set-window-height",
  "expand-column-to-available-width",
  "consume-or-expel-window-left",
  "consume-or-expel-window-right",
  "toggle-column-tabbed-display",
  "screenshot",
  "screenshot-screen",
  "screenshot-window",
  "quit",
  "power-off-monitors",
  "toggle-keyboard-shortcuts-inhibit",
  "show-hotkey-overlay",
  "toggle-overview",
  "switch-layout",
  "load-config-file",
] as const;

interface ActionPickerProps {
  value: string;
  onChange: (action: string) => void;
}

export function ActionPicker({ value, onChange }: ActionPickerProps) {
  return (
    <Combobox
      value={value}
      onValueChange={(v) => {
        if (v !== null) onChange(v);
      }}
      items={NIRI_ACTIONS}
    >
      <ComboboxInput placeholder="Select action..." />
      <ComboboxContent>
        <ComboboxEmpty>No matching action.</ComboboxEmpty>
        <ComboboxList>
          {(item) => (
            <ComboboxItem key={item} value={item}>
              {item}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}
