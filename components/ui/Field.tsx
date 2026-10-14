"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";

// =============================================================
// Form primitives sharing the dashboard's dark-glass input style.
// =============================================================

const controlClasses = cn(
  "w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5",
  "text-sm text-white outline-none transition-all",
  "placeholder:text-slate-500",
  "focus:border-indigo-500/40 focus:bg-white/[0.06] focus:ring-2 focus:ring-indigo-500/20",
  "disabled:cursor-not-allowed disabled:opacity-50"
);

export interface FieldProps {
  label?: string;
  hint?: string;
  error?: string;
  className?: string;
  children: React.ReactNode;
}

export function Field({
  label,
  hint,
  error,
  className,
  children,
}: FieldProps) {
  return (
    <label className={cn("block space-y-1.5", className)}>
      {label && (
        <span className="block text-[12px] font-medium text-slate-400">
          {label}
        </span>
      )}
      {children}
      {error ? (
        <span className="block text-[11px] text-rose-400">{error}</span>
      ) : hint ? (
        <span className="block text-[11px] text-slate-500">{hint}</span>
      ) : null}
    </label>
  );
}

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, invalid, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        controlClasses,
        invalid && "border-rose-500/50 focus:border-rose-500/60 focus:ring-rose-500/20",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, invalid, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        controlClasses,
        "min-h-[120px] resize-y leading-relaxed",
        invalid && "border-rose-500/50 focus:border-rose-500/60 focus:ring-rose-500/20",
        className
      )}
      {...props}
    />
  )
);
Textarea.displayName = "Textarea";

export type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement>;

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, ...props }, ref) => (
    <select
      ref={ref}
      className={cn(
        controlClasses,
        "cursor-pointer appearance-none bg-[#0c1224] pr-9",
        "[&>option]:bg-[#0c1224] [&>option]:text-white",
        className
      )}
      {...props}
    >
      {children}
    </select>
  )
);
Select.displayName = "Select";

export interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: string;
  disabled?: boolean;
}

export function Toggle({
  checked,
  onChange,
  label,
  description,
  disabled,
}: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "flex w-full items-center justify-between gap-4 rounded-xl px-3 py-3 text-left",
        "transition-colors hover:bg-white/[0.03]",
        disabled && "cursor-not-allowed opacity-50"
      )}
    >
      <span className="min-w-0">
        <span className="block text-sm font-medium text-slate-200">
          {label}
        </span>
        {description && (
          <span className="mt-0.5 block text-[12px] text-slate-500">
            {description}
          </span>
        )}
      </span>
      <span
        className={cn(
          "relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200",
          checked ? "bg-indigo-500" : "bg-white/15"
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all duration-200",
            checked ? "left-[22px]" : "left-0.5"
          )}
        />
      </span>
    </button>
  );
}
