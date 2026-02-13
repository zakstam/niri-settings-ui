import { ColorEditor } from "./color-editor";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { GradientConfig } from "@/lib/types";

const relativeToItems = [
  { label: "Window", value: "window" },
  { label: "Workspace View", value: "workspace-view" },
];

interface GradientEditorProps {
  value: GradientConfig;
  onChange: (value: GradientConfig) => void;
}

export function GradientEditor({ value, onChange }: GradientEditorProps) {
  function update(patch: Partial<GradientConfig>) {
    onChange({ ...value, ...patch });
  }

  return (
    <div className="space-y-3 rounded-lg border border-border p-3">
      <div className="space-y-2">
        <Label>From</Label>
        <ColorEditor
          value={value.fromColor}
          onChange={(v) => update({ fromColor: v })}
        />
      </div>

      <div className="space-y-2">
        <Label>To</Label>
        <ColorEditor value={value.toColor} onChange={(v) => update({ toColor: v })} />
      </div>

      <div className="flex items-center gap-3">
        <div className="space-y-1.5">
          <Label>Angle</Label>
          <Input
            type="number"
            value={value.angle ?? ""}
            min={0}
            max={360}
            step={1}
            className="w-20"
            onChange={(e) => update({ angle: Number(e.target.value) || 0 })}
          />
        </div>

        <div className="space-y-1.5">
          <Label>Relative To</Label>
          <Select
            value={value.relativeTo ?? "window"}
            onValueChange={(v) =>
              update({ relativeTo: v === "window" ? null : v })
            }
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {relativeToItems.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Color Space</Label>
        <Input
          value={value.colorSpace ?? ""}
          placeholder="srgb-linear"
          className="w-36"
          onChange={(e) =>
            update({ colorSpace: e.target.value || null })
          }
        />
      </div>
    </div>
  );
}
