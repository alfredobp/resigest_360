'use client';

import React from "react";
import { useTenant } from "@/context/TenantContext";
import { shouldRenderUiHint } from "@/lib/ui/tipsPreference";

interface ComponentCardProps {
  title?: string;
  children: React.ReactNode;
  className?: string; // Additional custom classes for styling
  desc?: string; // Description text
  alwaysShowDesc?: boolean;
}

const ComponentCard: React.FC<ComponentCardProps> = ({
  title = "",
  children,
  className = "",
  desc = "",
  alwaysShowDesc = false,
}) => {
  const { showUiTips } = useTenant();
  const visibleDesc = desc?.trim() && shouldRenderUiHint(showUiTips, alwaysShowDesc) ? desc : "";
  const hasHeader = Boolean(title?.trim() || visibleDesc);

  return (
    <div
      className={`rounded-[10px] border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)] dark:border-slate-800 dark:bg-[#111827] ${className}`}
    >
      {/* Card Header */}
      {hasHeader && (
        <div className="px-4 py-3.5 sm:px-5">
          {title && (
            <h3 className="text-[13.5px] font-semibold tracking-tight text-slate-900 dark:text-slate-100">
              {title}
            </h3>
          )}
          {visibleDesc && (
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              {visibleDesc}
            </p>
          )}
        </div>
      )}

      {/* Card Body */}
      <div
        className={`p-4 sm:p-5 ${hasHeader ? "border-t border-slate-200/80 dark:border-slate-800" : ""
          }`}
      >
        <div className="space-y-4">{children}</div>
      </div>
    </div>
  );
};

export default ComponentCard;
