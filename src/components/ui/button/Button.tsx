import React, { type ReactNode } from "react";
import { Loader2 } from "lucide-react";

export type ButtonSize = "xs" | "sm" | "md" | "icon";
export type ButtonVariant =
  | "primary"
  | "outline"
  | "ghost"
  | "danger"
  | "danger-outline"
  | "soft";

export interface ButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  children?: ReactNode;
  size?: ButtonSize;
  variant?: ButtonVariant;
  startIcon?: ReactNode;
  endIcon?: ReactNode;
  loading?: boolean;
  className?: string;
}

const Button: React.FC<ButtonProps> = ({
  children,
  size = "md",
  variant = "primary",
  startIcon,
  endIcon,
  loading = false,
  onClick,
  className = "",
  disabled = false,
  type = "button",
  ...rest
}) => {
  const sizeClasses: Record<ButtonSize, string> = {
    xs: "h-7 px-2.5 text-[11px] gap-1",
    sm: "px-3 py-1.5 text-xs gap-1.5",
    md: "px-4 py-2 text-[13px] gap-1.5",
    icon: "h-8 w-8 p-0",
  };

  const variantClasses: Record<ButtonVariant, string> = {
    primary:
      "bg-brand-500 text-white border border-brand-600/20 shadow-[0_1px_2px_rgba(5,150,105,0.22)] hover:bg-brand-600 active:translate-y-[0.5px] disabled:bg-brand-300",
    outline:
      "bg-white text-slate-700 border border-slate-200 shadow-[0_1px_2px_rgba(15,23,42,0.03)] hover:bg-slate-50 hover:border-slate-300 hover:text-slate-900 dark:bg-[#111827] dark:text-slate-300 dark:border-slate-700/90 dark:hover:bg-slate-800/80 dark:hover:text-white",
    ghost:
      "bg-transparent text-slate-600 border border-transparent hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/80 dark:hover:text-white",
    danger:
      "bg-red-600 text-white border border-red-700/20 shadow-[0_1px_2px_rgba(220,38,38,0.22)] hover:bg-red-700 active:translate-y-[0.5px] disabled:bg-red-300",
    "danger-outline":
      "bg-white text-red-600 border border-red-200/90 shadow-[0_1px_2px_rgba(15,23,42,0.02)] hover:bg-red-50 hover:border-red-300 hover:text-red-700 dark:bg-[#111827] dark:text-red-400 dark:border-red-900/70 dark:hover:bg-red-950/40",
    soft:
      "bg-brand-50 text-brand-700 border border-brand-200/80 hover:bg-brand-100/80 dark:bg-brand-500/15 dark:text-brand-300 dark:border-brand-500/25 dark:hover:bg-brand-500/25",
  };

  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center font-semibold rounded-md transition-all whitespace-nowrap ${
        sizeClasses[size]
      } ${variantClasses[variant]} ${
        isDisabled ? "cursor-not-allowed opacity-50" : ""
      } ${className}`.trim()}
      onClick={onClick}
      disabled={isDisabled}
      {...rest}
    >
      {loading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" aria-hidden="true" />
      ) : (
        startIcon && <span className="flex items-center shrink-0">{startIcon}</span>
      )}
      {children}
      {!loading && endIcon && <span className="flex items-center shrink-0">{endIcon}</span>}
    </button>
  );
};

export default Button;
