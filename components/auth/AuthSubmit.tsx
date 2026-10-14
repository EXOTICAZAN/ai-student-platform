"use client";

import { ButtonHTMLAttributes } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface AuthSubmitProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
}

export default function AuthSubmit({
  loading,
  children,
  className,
  disabled,
  ...props
}: AuthSubmitProps) {
  return (
    <button
      type="submit"
      disabled={disabled || loading}
      className={cn(
        "group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl",
        "bg-gradient-to-r from-indigo-600 via-blue-600 to-purple-600 px-4 py-3.5",
        "text-sm font-semibold text-white",
        "shadow-lg shadow-indigo-500/30 transition-all duration-300",
        "hover:scale-[1.02] hover:shadow-indigo-500/45",
        "disabled:opacity-60 disabled:hover:scale-100",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#050816]",
        className
      )}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      <span className="relative z-10">{children}</span>
      <span className="absolute inset-0 bg-gradient-to-r from-purple-600 to-indigo-600 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
    </button>
  );
}
