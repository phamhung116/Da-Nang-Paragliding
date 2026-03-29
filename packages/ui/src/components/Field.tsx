import {
  forwardRef,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes
} from "react";

type FieldProps = {
  label: string;
  hint?: string;
  children: ReactNode;
};

export const Field = ({ label, hint, children }: FieldProps) => (
  <div className="ui-field">
    <label>{label}</label>
    {children}
    {hint ? <small style={{ color: "var(--muted)" }}>{hint}</small> : null}
  </div>
);

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  (props, ref) => <input ref={ref} className="ui-input" {...props} />
);

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  (props, ref) => <select ref={ref} className="ui-select" {...props} />
);

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  (props, ref) => <textarea ref={ref} className="ui-textarea" {...props} />
);

Input.displayName = "Input";
Select.displayName = "Select";
Textarea.displayName = "Textarea";
