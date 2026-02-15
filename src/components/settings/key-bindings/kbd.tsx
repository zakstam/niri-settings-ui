import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/utils";

type KbdProps = {
  children: ReactNode;
} & Omit<HTMLAttributes<HTMLElement>, "children">;

export function Kbd({ children, className, ...props }: KbdProps) {
  return (
    <kbd
      {...props}
      className={cn(
        "inline-flex h-5 min-w-5 items-center justify-center rounded border border-border bg-muted/50 px-1.5 text-[10px] font-medium text-muted-foreground",
        className,
      )}
    >
      {children}
    </kbd>
  );
}
