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
} from "spatial-grid-nav/primitives";
import { SettingsGroup, SettingsRow } from "spatial-grid-nav/layouts";
import { IconPlus, IconTrash } from "@tabler/icons-react";
import type { ColumnWidth, NiriConfig } from "@/lib/types";

const centerFocusedItems = [
  { label: "Never", value: "never" },
  { label: "Always", value: "always" },
  { label: "On Overflow", value: "on-overflow" },
];

const widthTypeItems = [
  { label: "Proportion", value: "proportion" },
  { label: "Fixed", value: "fixed" },
];

interface ColumnWidthEditorProps {
  widths: ColumnWidth[];
  onChange: (widths: ColumnWidth[]) => void;
  label: string;
}

function ColumnWidthEditor({ widths, onChange, label }: ColumnWidthEditorProps) {
  function addWidth() {
    onChange([...widths, { type: "proportion", value: 0.5 }]);
  }

  function removeWidth(index: number) {
    onChange(widths.filter((_, i) => i !== index));
  }

  function updateWidth(index: number, patch: Partial<ColumnWidth>) {
    onChange(
      widths.map((w, i) => {
        if (i !== index) return w;
        const updated = { ...w, ...patch };
        if (patch.type && patch.type !== w.type) {
          return {
            type: patch.type,
            value: patch.type === "proportion" ? 0.5 : 800,
          } as ColumnWidth;
        }
        return updated as ColumnWidth;
      }),
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">{label}</span>
        <Button variant="outline" size="xs" onClick={addWidth}>
          <IconPlus size={14} data-icon="inline-start" />
          Add
        </Button>
      </div>
      {widths.length === 0 ? (
        <p className="text-xs text-muted-foreground">No presets defined.</p>
      ) : (
        <div className="space-y-2">
          {widths.map((w, index) => (
            <div key={index} className="flex items-center gap-2">
              <Select
                value={w.type}
                onValueChange={(v) =>
                  updateWidth(index, { type: v as ColumnWidth["type"] })
                }
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {widthTypeItems.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              <Input
                type="number"
                value={w.value}
                step={w.type === "proportion" ? 0.1 : 1}
                min={w.type === "proportion" ? 0 : 1}
                max={w.type === "proportion" ? 1 : 10000}
                className="w-24"
                onChange={(e) =>
                  updateWidth(index, { value: Number(e.target.value) || 0 })
                }
              />
              <span className="text-xs text-muted-foreground">
                {w.type === "proportion" ? "ratio" : "px"}
              </span>
              <Button
                variant="ghost"
                size="icon-xs"
                aria-label="Remove"
                onClick={() => removeWidth(index)}
              >
                <IconTrash size={14} />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface DefaultWidthEditorProps {
  value: ColumnWidth[] | null;
  onChange: (value: ColumnWidth[] | null) => void;
}

function DefaultWidthEditor({ value, onChange }: DefaultWidthEditorProps) {
  const state = value === null ? "unset" : value.length === 0 ? "empty" : "custom";
  const first = value !== null && value.length > 0 ? value[0] : null;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Select
          value={state}
          onValueChange={(v) => {
            if (v === "unset") {
              onChange(null);
            } else if (v === "empty") {
              onChange([]);
            } else {
              onChange([{ type: "proportion", value: 0.5 }]);
            }
          }}
        >
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="unset">Not Set</SelectItem>
              <SelectItem value="empty">Auto (empty)</SelectItem>
              <SelectItem value="custom">Custom</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
      {first && (
        <div className="flex items-center gap-2">
          <Select
            value={first.type}
            onValueChange={(v) => {
              const type = v as ColumnWidth["type"];
              onChange([{
                type,
                value: type === "proportion" ? 0.5 : 800,
              }]);
            }}
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {widthTypeItems.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          <Input
            type="number"
            value={first.value}
            step={first.type === "proportion" ? 0.1 : 1}
            min={first.type === "proportion" ? 0 : 1}
            className="w-24"
            onChange={(e) =>
              onChange([{ ...first, value: Number(e.target.value) || 0 }])
            }
          />
          <span className="text-xs text-muted-foreground">
            {first.type === "proportion" ? "ratio" : "px"}
          </span>
        </div>
      )}
    </div>
  );
}

function updateLayout(
  prev: NiriConfig,
  patch: Partial<NiriConfig["layout"]>,
): NiriConfig {
  return { ...prev, layout: { ...prev.layout, ...patch } };
}

export function ColumnSettings() {
  const { config, updateConfig } = useConfig();

  if (!config) return null;

  return (
    <div className="space-y-6">
      <SettingsGroup title="Column Behavior">
        <SettingsRow label="Center Focused Column" description="Whether to center the focused column on screen">
          <Select
            value={config.layout.centerFocusedColumn ?? undefined}
            onValueChange={(v) => { if (v) updateConfig((prev) => updateLayout(prev, { centerFocusedColumn: v })); }}
          >
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {centerFocusedItems.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </SettingsRow>
      </SettingsGroup>

      <SettingsGroup
        title="Preset Column Widths"
      >
        <ColumnWidthEditor
          label="Column Width Presets"
          widths={config.layout.presetColumnWidths}
          onChange={(widths) =>
            updateConfig((prev) => updateLayout(prev, { presetColumnWidths: widths }))
          }
        />
      </SettingsGroup>

      <SettingsGroup
        title="Preset Window Heights"
      >
        <ColumnWidthEditor
          label="Window Height Presets"
          widths={config.layout.presetWindowHeights}
          onChange={(widths) =>
            updateConfig((prev) => updateLayout(prev, { presetWindowHeights: widths }))
          }
        />
      </SettingsGroup>

      <SettingsGroup title="Default Column Width">
        <DefaultWidthEditor
          value={config.layout.defaultColumnWidth}
          onChange={(v) =>
            updateConfig((prev) => updateLayout(prev, { defaultColumnWidth: v }))
          }
        />
      </SettingsGroup>

      <SettingsGroup title="Additional Column Options">
        <SettingsRow label="Always Center Single Column" description="Always center a column if it's the only one on the workspace">
          <Switch
            checked={config.layout.alwaysCenterSingleColumn}
            onCheckedChange={(v) =>
              updateConfig((prev) => updateLayout(prev, { alwaysCenterSingleColumn: v }))
            }
          />
        </SettingsRow>

        <SettingsRow label="Empty Workspace Above First" description="Put an empty workspace above the first one">
          <Switch
            checked={config.layout.emptyWorkspaceAboveFirst}
            onCheckedChange={(v) =>
              updateConfig((prev) => updateLayout(prev, { emptyWorkspaceAboveFirst: v }))
            }
          />
        </SettingsRow>

        <SettingsRow label="Default Column Display" description="Default display mode for new columns">
          <Select
            value={config.layout.defaultColumnDisplay ?? "__none__"}
            onValueChange={(v) =>
              updateConfig((prev) => updateLayout(prev, { defaultColumnDisplay: v === "__none__" ? null : v }))
            }
          >
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="__none__">Not Set</SelectItem>
                <SelectItem value="tabbed">Tabbed</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </SettingsRow>
      </SettingsGroup>
    </div>
  );
}
