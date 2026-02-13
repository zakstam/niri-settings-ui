import { useConfig } from "@/lib/config-context";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { IconPlus } from "@tabler/icons-react";
import { OutputCard } from "./output-card";

export function OutputsSection() {
  const { config, updateConfig } = useConfig();

  if (!config) return null;

  function addOutput() {
    updateConfig((prev) => ({
      ...prev,
      outputs: [
        ...prev.outputs,
        {
          name: `output-${prev.outputs.length + 1}`,
          off: false,
          mode: null,
          scale: null,
          transform: null,
          positionX: null,
          positionY: null,
        },
      ],
    }));
  }

  function removeOutput(index: number) {
    updateConfig((prev) => ({
      ...prev,
      outputs: prev.outputs.filter((_, i) => i !== index),
    }));
  }

  return (
    <div>
      <PageHeader
        title="Outputs"
        description="Configure connected displays, their resolution, scale, and position"
      />

      {config.outputs.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-border py-16">
          <p className="text-sm text-muted-foreground">
            No outputs configured. Add an output to get started.
          </p>
          <Button variant="outline" onClick={addOutput}>
            <IconPlus size={16} data-icon="inline-start" />
            Add Output
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {config.outputs.map((output, index) => (
            <div key={output.name + index} className="relative">
              <OutputCard output={output} index={index} />
              <Button
                variant="destructive"
                size="xs"
                className="absolute top-4 right-4"
                onClick={() => removeOutput(index)}
              >
                Remove
              </Button>
            </div>
          ))}
          <Button variant="outline" onClick={addOutput}>
            <IconPlus size={16} data-icon="inline-start" />
            Add Output
          </Button>
        </div>
      )}
    </div>
  );
}
