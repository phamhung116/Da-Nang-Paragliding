import type { HTMLAttributes, PropsWithChildren } from "react";
import clsx from "clsx";

export const Container = ({ children, className, ...props }: PropsWithChildren<HTMLAttributes<HTMLDivElement>>) => (
  <div className={clsx("ui-container", className)} {...props}>
    {children}
  </div>
);
