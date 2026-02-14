import { PageHeader } from "spatial-grid-nav/layouts";
import { RingSettings } from "./ring-settings";
import { BorderSettings } from "./border-settings";
import { ShadowSettings } from "./shadow-settings";
import { TabIndicatorSettings } from "./tab-indicator-settings";
import { InsertHintSettings } from "./insert-hint-settings";

export function AppearanceSection() {
  return (
    <div>
      <PageHeader
        title="Appearance"
        description="Configure focus ring, borders, shadows, and visual indicators"
      />
      <div className="space-y-6">
        <RingSettings />
        <BorderSettings />
        <ShadowSettings />
        <TabIndicatorSettings />
        <InsertHintSettings />
      </div>
    </div>
  );
}
