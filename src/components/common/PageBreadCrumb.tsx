'use client';

import Link from "next/link";
import React from "react";
import { ChevronRight } from "lucide-react";
import { useTenant } from "@/context/TenantContext";
import { shouldRenderUiHint } from "@/lib/ui/tipsPreference";

interface BreadcrumbProps {
  pageTitle: string;
  title?: string;
  subtitle?: string;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
  alwaysShowSubtitle?: boolean;
  alwaysShowBadge?: boolean;
}

const PageBreadcrumb: React.FC<BreadcrumbProps> = ({
  pageTitle,
  title,
  subtitle,
  badge,
  actions,
  className = "",
  alwaysShowSubtitle = false,
  alwaysShowBadge = false,
}) => {
  const { showUiTips } = useTenant();
  const visibleSubtitle = subtitle && shouldRenderUiHint(showUiTips, alwaysShowSubtitle) ? subtitle : undefined;
  const visibleBadge = badge && shouldRenderUiHint(showUiTips, alwaysShowBadge) ? badge : undefined;
  const hasUnifiedHeader = Boolean(title || subtitle || badge || actions);
  const heading = title || pageTitle;

  const breadcrumbNav = (
    <nav aria-label="Breadcrumb">
      <ol className="flex items-center gap-1.5 text-xs">
        <li>
          <Link
            className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
            href="/app"
          >
            <span>Inicio</span>
            <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
          </Link>
        </li>
        <li className="font-medium text-slate-800 dark:text-slate-200">
          {pageTitle}
        </li>
      </ol>
    </nav>
  );

  if (!hasUnifiedHeader) {
    return (
      <div className={`flex flex-wrap items-center justify-end gap-3 mb-3 ${className}`}>
        {breadcrumbNav}
      </div>
    );
  }

  return (
    <div className={`flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between mb-4 ${className}`}>
      <div className="min-w-0">
        <div className="flex items-center gap-2.5 flex-wrap">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {heading}
          </h1>
          {visibleBadge}
        </div>
        {visibleSubtitle && (
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {visibleSubtitle}
          </p>
        )}
      </div>

      <div className="flex flex-col items-start sm:items-end gap-2 shrink-0">
        {breadcrumbNav}
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
};

export default PageBreadcrumb;
