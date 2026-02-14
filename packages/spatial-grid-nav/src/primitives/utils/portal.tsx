import { createPortal } from "react-dom";
import type { ReactNode } from "react";

export interface PortalProps {
  children: ReactNode;
  container?: Element | null;
}

export function Portal({ children, container }: PortalProps) {
  const target = container ?? (typeof document !== "undefined" ? document.body : null);
  if (!target) return null;
  return createPortal(children, target);
}
