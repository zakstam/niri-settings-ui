import { forwardRef, useRef } from "react";
import { useIsActiveGroup } from "./hooks.js";

export interface NavigationGroupProps
  extends React.ComponentPropsWithRef<"div"> {
  label?: string;
}

export const NavigationGroup = forwardRef<HTMLDivElement, NavigationGroupProps>(
  function NavigationGroup({ label, children, className, ...props }, ref) {
    const localRef = useRef<HTMLDivElement>(null);
    const resolvedRef = (ref ?? localRef) as React.RefObject<HTMLDivElement>;
    const isActive = useIsActiveGroup(resolvedRef);

    return (
      <div
        ref={resolvedRef}
        data-sgn-group=""
        tabIndex={-1}
        role={label ? "region" : undefined}
        aria-label={label}
        data-sgn-active={isActive ? "" : undefined}
        className={className}
        {...props}
      >
        {children}
      </div>
    );
  },
);
