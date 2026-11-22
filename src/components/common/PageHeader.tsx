'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import PageBreadCrumb from '@/components/common/PageBreadCrumb';
import Button from '@/components/ui/button/Button';

export interface PageHeaderProps {
  title: string;
  breadcrumbTitle?: string;
  hideBreadcrumb?: boolean;
  description?: string;
  badge?: React.ReactNode;
  backHref?: string;
  backLabel?: string;
  onBack?: () => void;
  actions?: React.ReactNode;
  className?: string;
}

const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  breadcrumbTitle,
  hideBreadcrumb = false,
  description,
  badge,
  backHref,
  backLabel = 'Volver',
  onBack,
  actions,
  className = '',
}) => {
  return (
    <div className={className}>
      {!hideBreadcrumb && <PageBreadCrumb pageTitle={breadcrumbTitle ?? title} />}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3 min-w-0">
          {backHref && (
            <Link
              href={backHref}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900 dark:bg-[#111827] dark:text-slate-300 dark:border-slate-700/90 dark:hover:bg-slate-800/80 transition-colors shrink-0"
            >
              <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{backLabel}</span>
            </Link>
          )}
          {!backHref && onBack && (
            <Button
              variant="outline"
              size="sm"
              startIcon={<ArrowLeft className="w-3.5 h-3.5" />}
              onClick={onBack}
              className="shrink-0"
            >
              {backLabel}
            </Button>
          )}

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white truncate">
                {title}
              </h1>
              {badge}
            </div>
            {description && (
              <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                {description}
              </p>
            )}
          </div>
        </div>

        {actions && (
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};

export default PageHeader;
