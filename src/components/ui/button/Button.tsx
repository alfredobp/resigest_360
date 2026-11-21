import React, { type ReactNode } from "react";

interface ButtonProps {
  children: ReactNode; // Button text or content
  size?: "sm" | "md"; // Button size
  variant?: "primary" | "outline"; // Button variant
  startIcon?: ReactNode; // Icon before the text
  endIcon?: ReactNode; // Icon after the text
  onClick?: () => void; // Click handler
  disabled?: boolean; // Disabled state
  className?: string; // Disabled state
  type?: "button" | "submit" | "reset"; // Button type
}

const Button: React.FC<ButtonProps> = ({
  children,
  size = "md",
  variant = "primary",
  startIcon,
  endIcon,
  onClick,
  className = "",
  disabled = false,
  type = "button",
}) => {
  // Size Classes (Precisión Industrial)
  const sizeClasses = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-[13px]",
  };

  // Variant Classes
  const variantClasses = {
    primary:
      "bg-brand-500 text-white border border-brand-600/20 shadow-[0_1px_2px_rgba(5,150,105,0.22)] hover:bg-brand-600 active:translate-y-[0.5px] disabled:bg-brand-300",
    outline:
      "bg-white text-slate-700 border border-slate-200 shadow-[0_1px_2px_rgba(15,23,42,0.03)] hover:bg-slate-50 hover:border-slate-300 hover:text-slate-900 dark:bg-[#111827] dark:text-slate-300 dark:border-slate-700/90 dark:hover:bg-slate-800/80 dark:hover:text-white",
  };

  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center font-semibold gap-1.5 rounded-md transition-all ${className} ${
        sizeClasses[size]
      } ${variantClasses[variant]} ${
        disabled ? "cursor-not-allowed opacity-50" : ""
      }`}
      onClick={onClick}
      disabled={disabled}
    >
      {startIcon && <span className="flex items-center">{startIcon}</span>}
      {children}
      {endIcon && <span className="flex items-center">{endIcon}</span>}
    </button>
  );
};

export default Button;
