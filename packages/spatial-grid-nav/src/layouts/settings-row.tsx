import type { ReactNode } from "react";

interface SettingsRowProps {
  label: string;
  description?: string;
  children: ReactNode;
}

export function SettingsRow({
  label,
  description,
  children,
}: SettingsRowProps) {
  return (
    <div className="group flex items-center justify-between gap-10 rounded-xl px-4 py-3.5 transition-colors hover:bg-accent-color-subtle">
      <div className="min-w-0 flex-1">
        <div className="text-[13px] text-foreground">{label}</div>
        {description && (
          <div className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">
            {description}
          </div>
        )}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}
