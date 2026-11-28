import React from "react";

type BadgeVariant = "light" | "solid";
type BadgeSize = "sm" | "md";
type BadgeColor =
  | "primary"
  | "success"
  | "error"
  | "warning"
  | "info"
  | "light"
  | "dark";

interface BadgeProps {
  variant?: BadgeVariant; // Light or solid variant
  size?: BadgeSize; // Badge size
  color?: BadgeColor; // Badge color
  startIcon?: React.ReactNode; // Icon at the start
  endIcon?: React.ReactNode; // Icon at the end
  children: React.ReactNode; // Badge content
  className?: string; // Optional custom classes
}

const Badge: React.FC<BadgeProps> = ({
  variant = "light",
  color = "primary",
  size = "md",
  startIcon,
  endIcon,
  children,
  className = "",
}) => {
  const baseStyles =
    "inline-flex items-center px-2 py-0.5 justify-center gap-1.5 rounded-full font-semibold tracking-tight border";

  // Define size styles
  const sizeStyles = {
    sm: "text-[11px] leading-4",
    md: "text-xs leading-4",
  };

  // Define color styles for variants (Precisión Industrial)
  const variants = {
    light: {
      primary:
        "bg-brand-50 text-brand-700 border-brand-200/80 dark:bg-brand-500/15 dark:text-brand-300 dark:border-brand-500/25",
      success:
        "bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/25",
      error:
        "bg-red-50 text-red-700 border-red-200/80 dark:bg-red-500/15 dark:text-red-300 dark:border-red-500/25",
      warning:
        "bg-amber-50 text-amber-700 border-amber-200/80 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/25",
      info: "bg-sky-50 text-sky-700 border-sky-200/80 dark:bg-sky-500/15 dark:text-sky-300 dark:border-sky-500/25",
      light: "bg-slate-100 text-slate-700 border-slate-200/80 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
      dark: "bg-slate-700 text-white border-slate-700 dark:bg-slate-800 dark:text-white dark:border-slate-700",
    },
    solid: {
      primary: "bg-brand-500 text-white border-brand-600/20",
      success: "bg-emerald-600 text-white border-emerald-700/20",
      error: "bg-red-600 text-white border-red-700/20",
      warning: "bg-amber-600 text-white border-amber-700/20",
      info: "bg-sky-600 text-white border-sky-700/20",
      light: "bg-slate-500 text-white border-slate-600/20",
      dark: "bg-slate-900 text-white border-slate-800",
    },
  };

  // Get styles based on size and color variant
  const sizeClass = sizeStyles[size];
  const colorStyles = variants[variant][color];

  return (
    <span className={`${baseStyles} ${sizeClass} ${colorStyles} ${className}`.trim()}>
      {startIcon && <span className="mr-1">{startIcon}</span>}
      {children}
      {endIcon && <span className="ml-1">{endIcon}</span>}
    </span>
  );
};

export default Badge;
