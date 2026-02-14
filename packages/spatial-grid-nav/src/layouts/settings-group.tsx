import * as React from "react";
import type { ReactNode } from "react";
import { NavigationGroup } from "../react/group.tsx";

interface SettingsGroupProps {
  title: string;
  description?: string;
  children: ReactNode;
}

export function SettingsGroup({
  title,
  description,
  children,
}: SettingsGroupProps) {
  const titleId = React.useId();

  return (
    <NavigationGroup
      label={title}
      aria-labelledby={titleId}
      className="group glass rounded-2xl border border-transparent bg-card transition-all duration-200 relative"
    >
      <div className="px-6 pt-5 pb-2">
        <h3
          id={titleId}
          className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
        >
          {title}
        </h3>
        {description && (
          <p className="mt-1 text-xs text-muted-foreground/60">
            {description}
          </p>
        )}
      </div>
      <div className="px-2 pb-2.5 space-y-0.5">{children}</div>
    </NavigationGroup>
  );
}
