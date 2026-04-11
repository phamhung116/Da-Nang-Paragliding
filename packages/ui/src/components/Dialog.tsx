import type { ReactNode } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import clsx from "clsx";

type DialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  className?: string;
};

export const Dialog = ({ open, onOpenChange, title, description, icon, children, footer, className }: DialogProps) => (
  <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="ui-dialog__overlay" />
      <DialogPrimitive.Content className={clsx("ui-dialog__content", className)}>
        <div className="ui-dialog__header">
          {icon ? (
            <div className="ui-dialog__icon" aria-hidden="true">
              {icon}
            </div>
          ) : null}
          <div className="ui-dialog__heading">
            <DialogPrimitive.Title className="ui-dialog__title">{title}</DialogPrimitive.Title>
            {description ? <DialogPrimitive.Description className="ui-dialog__description">{description}</DialogPrimitive.Description> : null}
          </div>
          <DialogPrimitive.Close className="ui-dialog__close" aria-label="Dong">
            x
          </DialogPrimitive.Close>
        </div>
        {children ? <div className="ui-dialog__body">{children}</div> : null}
        {footer ? <div className="ui-dialog__footer">{footer}</div> : null}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  </DialogPrimitive.Root>
);
