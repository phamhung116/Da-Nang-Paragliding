import type { HTMLAttributes, PropsWithChildren } from "react";
import clsx from "clsx";

export const Card = ({ children, className, ...props }: PropsWithChildren<HTMLAttributes<HTMLDivElement>>) => (
  <div className={clsx("ui-card", className)} {...props}>
    {children}
  </div>
);

export const Panel = ({ children, className, ...props }: PropsWithChildren<HTMLAttributes<HTMLDivElement>>) => (
  <div className={clsx("ui-panel", className)} {...props}>
    {children}
  </div>
);
