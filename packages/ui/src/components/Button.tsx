import type { ButtonHTMLAttributes, PropsWithChildren } from "react";
import clsx from "clsx";

type ButtonProps = PropsWithChildren<
  ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: "primary" | "secondary" | "ghost";
  }
>;

export const Button = ({ children, className, variant = "primary", ...props }: ButtonProps) => (
  <button className={clsx("ui-button", `ui-button--${variant}`, className)} {...props}>
    {children}
  </button>
);
