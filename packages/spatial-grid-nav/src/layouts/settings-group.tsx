import * as React from "react";
import type { ReactNode } from "react";
import { NavigationGroup } from "../react/group.tsx";

interface SettingsGroupProps {
  title: string;
  children: ReactNode;
}

export function SettingsGroup({
  title,
  children,
}: SettingsGroupProps) {
  const titleId = React.useId();

  return (
    <NavigationGroup
      label={title}
      aria-labelledby={titleId}
      className="group rounded-xl border border-border bg-card transition-all duration-200 relative"
    >
      <div className="px-4 pt-4 pb-1">
        <h3
          id={titleId}
          className="text-xs font-medium text-muted-foreground"
        >
          {title}
        </h3>
      </div>
      <div>{children}</div>
    </NavigationGroup>
  );
}
