import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  hint?: string;
  error?: string;
};

const fieldStyles =
  "w-full rounded-[var(--radius-md)] border border-border bg-surface-muted px-3 text-sm text-text-primary transition-all duration-200 placeholder:text-text-tertiary focus-ring focus:border-primary focus:bg-surface disabled:cursor-not-allowed disabled:opacity-50";

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, hint, error, className = "", id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <label className="block" htmlFor={inputId}>
        {label ? (
          <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-text-secondary">
            {label}
          </span>
        ) : null}
        <input
          ref={ref}
          className={`h-9 ${fieldStyles} ${error ? "border-destructive/50" : ""} ${className}`}
          id={inputId}
          {...props}
        />
        {error ? (
          <p className="mt-1.5 text-xs text-destructive">{error}</p>
        ) : hint ? (
          <p className="mt-1.5 text-xs text-text-tertiary">{hint}</p>
        ) : null}
      </label>
    );
  },
);

Input.displayName = "Input";

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
  hint?: string;
  error?: string;
};

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, hint, error, className = "", id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <label className="block" htmlFor={inputId}>
        {label ? (
          <span className="mb-1.5 block text-sm font-medium text-text-primary">
            {label}
          </span>
        ) : null}
        <textarea
          ref={ref}
          className={`min-h-28 resize-y py-2.5 leading-relaxed ${fieldStyles} ${error ? "border-destructive/50" : ""} ${className}`}
          id={inputId}
          {...props}
        />
        {error ? (
          <p className="mt-1.5 text-xs text-destructive">{error}</p>
        ) : hint ? (
          <p className="mt-1.5 text-xs text-text-tertiary">{hint}</p>
        ) : null}
      </label>
    );
  },
);

Textarea.displayName = "Textarea";
