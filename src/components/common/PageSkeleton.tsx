'use client';

import React from 'react';

export interface PageSkeletonProps {
  variant?: 'table' | 'table-with-stats' | 'form' | 'detail';
  rows?: number;
  label?: string;
  className?: string;
}

const PageSkeleton: React.FC<PageSkeletonProps> = ({
  variant = 'table',
  rows = 5,
  label = 'Cargando vista...',
  className = '',
}) => {
  return (
    <div
      className={`space-y-6 animate-pulse ${className}`.trim()}
      aria-busy="true"
      aria-label={label}
    >
      {/* Header skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="h-7 w-56 rounded-lg bg-slate-200 dark:bg-slate-800" />
          <div className="h-4 w-80 max-w-full rounded bg-slate-200/80 dark:bg-slate-800/80" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-9 w-32 rounded-md bg-slate-200 dark:bg-slate-800" />
        </div>
      </div>

      {/* KPI stats skeleton */}
      {variant === 'table-with-stats' && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-24 rounded-[10px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-4 space-y-3"
            >
              <div className="h-3.5 w-24 rounded bg-slate-200 dark:bg-slate-800" />
              <div className="h-6 w-20 rounded bg-slate-200/80 dark:bg-slate-800/80" />
            </div>
          ))}
        </div>
      )}

      {/* Table skeleton */}
      {(variant === 'table' || variant === 'table-with-stats') && (
        <div className="rounded-[10px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] overflow-hidden">
          <div className="h-12 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40 px-4 flex items-center justify-between">
            <div className="h-7 w-64 rounded-md bg-slate-200/80 dark:bg-slate-800/80" />
            <div className="h-7 w-24 rounded-md bg-slate-200/70 dark:bg-slate-800/70" />
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {Array.from({ length: rows }).map((_, i) => (
              <div key={i} className="h-14 px-4 flex items-center justify-between gap-4">
                <div className="h-4 w-36 rounded bg-slate-200 dark:bg-slate-800" />
                <div className="h-4 w-48 rounded bg-slate-200/70 dark:bg-slate-800/70 hidden sm:block" />
                <div className="h-5 w-20 rounded-full bg-slate-200 dark:bg-slate-800" />
                <div className="h-7 w-24 rounded-md bg-slate-200 dark:bg-slate-800" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Form skeleton */}
      {variant === 'form' && (
        <div className="space-y-6">
          <div className="flex gap-6 border-b border-slate-200 dark:border-slate-800 pb-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-4 w-28 rounded bg-slate-200 dark:bg-slate-800" />
            ))}
          </div>
          <div className="rounded-[10px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-5 space-y-4">
            <div className="h-5 w-44 rounded bg-slate-200 dark:bg-slate-800" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="h-3.5 w-24 rounded bg-slate-200/80 dark:bg-slate-800/80" />
                  <div className="h-9 w-full rounded-md bg-slate-200/70 dark:bg-slate-800/70" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Detail skeleton */}
      {variant === 'detail' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="h-48 rounded-[10px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-5 space-y-3">
              <div className="h-5 w-48 rounded bg-slate-200 dark:bg-slate-800" />
              <div className="h-4 w-full rounded bg-slate-200/70 dark:bg-slate-800/70" />
              <div className="h-4 w-3/4 rounded bg-slate-200/70 dark:bg-slate-800/70" />
            </div>
            <div className="h-40 rounded-[10px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-5 space-y-3">
              <div className="h-5 w-40 rounded bg-slate-200 dark:bg-slate-800" />
              <div className="h-4 w-5/6 rounded bg-slate-200/70 dark:bg-slate-800/70" />
            </div>
          </div>
          <div className="h-64 rounded-[10px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-5 space-y-3">
            <div className="h-5 w-32 rounded bg-slate-200 dark:bg-slate-800" />
            <div className="h-4 w-full rounded bg-slate-200/70 dark:bg-slate-800/70" />
            <div className="h-4 w-2/3 rounded bg-slate-200/70 dark:bg-slate-800/70" />
          </div>
        </div>
      )}
    </div>
  );
};

export default PageSkeleton;
