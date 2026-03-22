import {
  Switch,
  Button,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "spatial-grid-nav/primitives";
import { SettingsRow } from "spatial-grid-nav/layouts";
import { IconChevronDown } from "@tabler/icons-react";
import { GradientEditor } from "./gradient-editor";
import { defaultGradient } from "@/lib/defaults";
import type { GradientConfig } from "@/lib/types";

interface GradientToggleRowProps {
  label: string;
  description: string;
  value: GradientConfig | null;
  onChange: (value: GradientConfig | null) => void;
}

function GradientToggleRow({ label, description, value, onChange }: GradientToggleRowProps) {
  return (
    <>
      <SettingsRow label={label} description={description}>
        <Switch
          checked={value !== null}
          onCheckedChange={(v) => onChange(v ? { ...defaultGradient } : null)}
        />
      </SettingsRow>
      {value && (
        <div className="px-4 pb-3">
          <GradientEditor value={value} onChange={onChange} />
        </div>
      )}
    </>
  );
}

interface GradientOptionsSectionProps {
  activeGradient: GradientConfig | null;
  inactiveGradient: GradientConfig | null;
  urgentGradient: GradientConfig | null;
  onActiveGradientChange: (value: GradientConfig | null) => void;
  onInactiveGradientChange: (value: GradientConfig | null) => void;
  onUrgentGradientChange: (value: GradientConfig | null) => void;
  /** Subject noun used in descriptions (e.g. "border", "ring", "tab indicator") */
  subject: string;
}

export function GradientOptionsSection({
  activeGradient,
  inactiveGradient,
  urgentGradient,
  onActiveGradientChange,
  onInactiveGradientChange,
  onUrgentGradientChange,
  subject,
}: GradientOptionsSectionProps) {
  return (
    <Collapsible>
      <CollapsibleTrigger
        render={<Button variant="ghost" size="sm" className="w-full justify-between" />}
      >
        Gradient Options
        <IconChevronDown size={16} />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="pt-1">
          <GradientToggleRow
            label="Active Gradient"
            description={`Gradient overlay on the focused window ${subject}`}
            value={activeGradient}
            onChange={onActiveGradientChange}
          />
          <GradientToggleRow
            label="Inactive Gradient"
            description={`Gradient overlay on unfocused window ${subject}s`}
            value={inactiveGradient}
            onChange={onInactiveGradientChange}
          />
          <GradientToggleRow
            label="Urgent Gradient"
            description={`Gradient overlay on urgent window ${subject}s`}
            value={urgentGradient}
            onChange={onUrgentGradientChange}
          />
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
