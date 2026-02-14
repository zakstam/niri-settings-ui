import { useConfig } from "@/lib/config-context";
import { Input } from "spatial-grid-nav/primitives";
import { SettingsGroup, SettingsRow } from "spatial-grid-nav/layouts";

export function StrutsSettings() {
  const { config, updateConfig } = useConfig();

  if (!config) return null;

  const struts = config.layout.struts;

  function updateStruts(patch: Partial<typeof struts>) {
    updateConfig((prev) => ({
      ...prev,
      layout: {
        ...prev.layout,
        struts: { ...prev.layout.struts, ...patch },
      },
    }));
  }

  return (
    <SettingsGroup
      title="Struts"
      description="Reserved space on workspace edges where windows will not be placed"
    >
      <SettingsRow label="Left" description="Reserved space on the left edge in pixels">
        <Input
          type="number"
          value={struts.left ?? ""}
          placeholder="0"
          min={0}
          className="w-24"
          onChange={(e) =>
            updateStruts({
              left: e.target.value === "" ? null : Number(e.target.value),
            })
          }
        />
      </SettingsRow>

      <SettingsRow label="Right" description="Reserved space on the right edge in pixels">
        <Input
          type="number"
          value={struts.right ?? ""}
          placeholder="0"
          min={0}
          className="w-24"
          onChange={(e) =>
            updateStruts({
              right: e.target.value === "" ? null : Number(e.target.value),
            })
          }
        />
      </SettingsRow>

      <SettingsRow label="Top" description="Reserved space on the top edge in pixels">
        <Input
          type="number"
          value={struts.top ?? ""}
          placeholder="0"
          min={0}
          className="w-24"
          onChange={(e) =>
            updateStruts({
              top: e.target.value === "" ? null : Number(e.target.value),
            })
          }
        />
      </SettingsRow>

      <SettingsRow label="Bottom" description="Reserved space on the bottom edge in pixels">
        <Input
          type="number"
          value={struts.bottom ?? ""}
          placeholder="0"
          min={0}
          className="w-24"
          onChange={(e) =>
            updateStruts({
              bottom: e.target.value === "" ? null : Number(e.target.value),
            })
          }
        />
      </SettingsRow>
    </SettingsGroup>
  );
}
