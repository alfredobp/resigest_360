'use client';

import React from 'react';

export interface TabItem<T extends string = string> {
  id: T;
  label: string;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  disabled?: boolean;
  hidden?: boolean;
}

export interface TabsProps<T extends string = string> {
  items: TabItem<T>[];
  activeTab: T;
  onChange: (id: T) => void;
  variant?: 'underline' | 'pills';
  className?: string;
}

export function Tabs<T extends string = string>({
  items,
  activeTab,
  onChange,
  variant = 'underline',
  className = '',
}: TabsProps<T>) {
  const visibleItems = items.filter((item) => !item.hidden);

  if (variant === 'pills') {
    return (
      <div
        role="tablist"
        className={`inline-flex flex-wrap items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700/70 ${className}`.trim()}
      >
        {visibleItems.map((item) => {
          const isActive = item.id === activeTab;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              disabled={item.disabled}
              onClick={() => onChange(item.id)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                isActive
                  ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-white'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              {item.icon && <span className="flex items-center shrink-0">{item.icon}</span>}
              <span>{item.label}</span>
              {item.badge !== undefined && item.badge !== null && (
                <span className="ml-0.5">{item.badge}</span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div
      role="tablist"
      className={`border-b border-slate-200 dark:border-slate-800 flex flex-wrap gap-6 ${className}`.trim()}
    >
      {visibleItems.map((item) => {
        const isActive = item.id === activeTab;
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            disabled={item.disabled}
            onClick={() => onChange(item.id)}
            className={`pb-3.5 text-sm font-medium border-b-2 transition-colors inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${
              isActive
                ? 'border-brand-600 text-brand-600 dark:border-brand-400 dark:text-brand-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            {item.icon && <span className="flex items-center shrink-0">{item.icon}</span>}
            <span>{item.label}</span>
            {item.badge !== undefined && item.badge !== null && (
              <span>{item.badge}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export default Tabs;
