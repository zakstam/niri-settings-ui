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
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Button,
} from "spatial-grid-nav/primitives";
import { SettingsRow } from "spatial-grid-nav/layouts";
import { NumberInput } from "@/lib/number-input";
import type { NiriConfig, OutputConfig } from "@/lib/types";
import { IconTrash } from "@tabler/icons-react";

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
  onRemove: () => void;
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

export function OutputCard({
  output,
  index,
  onRemove,
}: OutputCardProps) {
  const { updateConfig } = useConfig();
  const isPrimary = index === 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="truncate">{output.name}</span>
            {output.off && (
              <Badge variant="secondary">Disabled</Badge>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              type="button"
              onClick={onRemove}
              aria-label="Remove monitor"
            >
              <IconTrash size={14} />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <SettingsRow label="Disable Output" description="Power off this display">
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
          <NumberInput
            numericValue={output.scale}
            placeholder="1"
            min={0.25}
            max={8}
            step={0.25}
            className="w-24"
            onValueChange={(v) =>
              updateConfig((prev) =>
                updateOutput(prev, index, { scale: v }),
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

        <SettingsRow
          label="Position"
          description={isPrimary
            ? "Main display is fixed at 0, 0"
            : "X and Y position of this output in the layout"}
        >
          <div className="flex items-center gap-2">
            <NumberInput
              numericValue={isPrimary ? 0 : output.positionX}
              placeholder="X"
              className="w-20"
              disabled={isPrimary}
              onValueChange={(v) =>
                updateConfig((prev) =>
                  updateOutput(prev, index, {
                    positionX: isPrimary ? 0 : v,
                  }),
                )
              }
            />
            <span className="text-xs text-muted-foreground">x</span>
            <NumberInput
              numericValue={isPrimary ? 0 : output.positionY}
              placeholder="Y"
              className="w-20"
              disabled={isPrimary}
              onValueChange={(v) =>
                updateConfig((prev) =>
                  updateOutput(prev, index, {
                    positionY: isPrimary ? 0 : v,
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
