import type { HTMLAttributes, PropsWithChildren } from "react";
import clsx from "clsx";

export const Badge = ({
  children,
  className,
  tone = "default",
  ...props
}: PropsWithChildren<HTMLAttributes<HTMLSpanElement> & { tone?: "default" | "success" | "danger" }>) => (
  <span className={clsx("ui-badge", tone !== "default" && `ui-badge--${tone}`, className)} {...props}>
    {children}
  </span>
);
