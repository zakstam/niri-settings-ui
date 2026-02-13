import { useConfig } from "@/lib/config-context";
import { SettingsRow } from "@/components/layout/settings-row";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { NiriConfig, OutputConfig } from "@/lib/types";

const transformItems = [
  { label: "Normal", value: "normal" },
  { label: "90", value: "90" },
  { label: "180", value: "180" },
  { label: "270", value: "270" },
  { label: "Flipped", value: "flipped" },
  { label: "Flipped 90", value: "flipped-90" },
  { label: "Flipped 180", value: "flipped-180" },
  { label: "Flipped 270", value: "flipped-270" },
];

interface OutputCardProps {
  output: OutputConfig;
  index: number;
}

function updateOutput(
  prev: NiriConfig,
  index: number,
  patch: Partial<OutputConfig>,
): NiriConfig {
  const outputs = prev.outputs.map((o, i) =>
    i === index ? { ...o, ...patch } : o,
  );
  return { ...prev, outputs };
}

export function OutputCard({ output, index }: OutputCardProps) {
  const { updateConfig } = useConfig();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {output.name}
          {output.off && (
            <Badge variant="secondary">Disabled</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <SettingsRow label="Disable Output" description="Turn off this output">
          <Switch
            checked={output.off}
            onCheckedChange={(v) =>
              updateConfig((prev) => updateOutput(prev, index, { off: v }))
            }
          />
        </SettingsRow>

        <SettingsRow label="Mode" description="Resolution and refresh rate (e.g. 1920x1080@60.000)">
          <Input
            value={output.mode ?? ""}
            placeholder="1920x1080@60.000"
            className="w-48"
            onChange={(e) =>
              updateConfig((prev) =>
                updateOutput(prev, index, { mode: e.target.value || null }),
              )
            }
          />
        </SettingsRow>

        <SettingsRow label="Scale" description="Output scale factor (e.g. 1, 1.5, 2)">
          <Input
            type="number"
            value={output.scale ?? ""}
            placeholder="1"
            min={0.25}
            max={8}
            step={0.25}
            className="w-24"
            onChange={(e) =>
              updateConfig((prev) =>
                updateOutput(prev, index, {
                  scale: e.target.value === "" ? null : Number(e.target.value),
                }),
              )
            }
          />
        </SettingsRow>

        <SettingsRow label="Transform" description="Rotation and mirroring of the output">
          <Select
            value={output.transform ?? "normal"}
            onValueChange={(v) =>
              updateConfig((prev) =>
                updateOutput(prev, index, { transform: v === "normal" ? null : v }),
              )
            }
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {transformItems.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </SettingsRow>

        <SettingsRow label="Position" description="X and Y position of this output in the layout">
          <div className="flex items-center gap-2">
            <Input
              type="number"
              value={output.positionX ?? ""}
              placeholder="X"
              className="w-20"
              onChange={(e) =>
                updateConfig((prev) =>
                  updateOutput(prev, index, {
                    positionX: e.target.value === "" ? null : Number(e.target.value),
                  }),
                )
              }
            />
            <span className="text-xs text-muted-foreground">x</span>
            <Input
              type="number"
              value={output.positionY ?? ""}
              placeholder="Y"
              className="w-20"
              onChange={(e) =>
                updateConfig((prev) =>
                  updateOutput(prev, index, {
                    positionY: e.target.value === "" ? null : Number(e.target.value),
                  }),
                )
              }
            />
          </div>
        </SettingsRow>
      </CardContent>
    </Card>
  );
}
