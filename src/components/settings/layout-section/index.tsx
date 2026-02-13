import { useConfig } from "@/lib/config-context";
import { PageHeader } from "@/components/layout/page-header";
import { SettingsGroup } from "@/components/layout/settings-group";
import { SettingsRow } from "@/components/layout/settings-row";
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
          <SettingsGroup title="Background" description="Background color for the layout">
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
