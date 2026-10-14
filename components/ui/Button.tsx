"use client";

import { forwardRef } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "outline";
type Size = "sm" | "md" | "lg" | "icon";

const variants: Record<Variant, string> = {
  primary: cn(
    "btn-gradient shadow-lg shadow-indigo-500/20",
    "hover:brightness-110 hover:shadow-indigo-500/30",
    "disabled:hover:brightness-100"
  ),
  secondary: cn(
    "border border-white/10 bg-white/5 text-slate-200",
    "hover:border-white/20 hover:bg-white/10 hover:text-white"
  ),
  ghost: cn(
    "text-slate-400 hover:bg-white/[0.06] hover:text-white"
  ),
  outline: cn(
    "border border-indigo-500/40 bg-indigo-500/10 text-indigo-300",
    "hover:border-indigo-500/60 hover:bg-indigo-500/20 hover:text-white"
  ),
  danger: cn(
    "border border-rose-500/30 bg-rose-500/10 text-rose-400",
    "hover:border-rose-500/50 hover:bg-rose-500/20 hover:text-rose-300"
  ),
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-[12px] gap-1.5 rounded-lg",
  md: "h-10 px-4 text-sm gap-2 rounded-xl",
  lg: "h-12 px-6 text-[15px] gap-2 rounded-xl",
  icon: "h-9 w-9 rounded-xl",
};

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      loading = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        "inline-flex shrink-0 items-center justify-center font-medium",
        "transition-all duration-200 outline-none",
        "focus-visible:ring-2 focus-visible:ring-indigo-500/40",
        "disabled:cursor-not-allowed disabled:opacity-50",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  )
);

Button.displayName = "Button";

export default Button;
