import { useConfig } from "@/lib/config-context";
import { PageHeader, SettingsGroup, SettingsRow } from "spatial-grid-nav/layouts";
import { GapsSettings } from "./gaps-settings";
import { ColumnSettings } from "./column-settings";
import { StrutsSettings } from "./struts-settings";
import { ColorEditor } from "../appearance/color-editor";

export function LayoutSection() {
  const { config, updateConfig } = useConfig();

  return (
    <div>
      <PageHeader
        title="Layout"
        description="Configure window gaps, column behavior, and workspace struts"
      />
      <div className="space-y-6">
        <GapsSettings />
        <ColumnSettings />
        <StrutsSettings />

        {config && (
          <SettingsGroup title="Background">
            <SettingsRow label="Background Color" description="Color shown behind windows">
              <ColorEditor
                value={config.layout.backgroundColor}
                onChange={(v) =>
                  updateConfig((prev) => ({
                    ...prev,
                    layout: { ...prev.layout, backgroundColor: v },
                  }))
                }
              />
            </SettingsRow>
          </SettingsGroup>
        )}
      </div>
    </div>
  );
}
