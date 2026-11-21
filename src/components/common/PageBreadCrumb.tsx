import Link from "next/link";
import React from "react";

interface BreadcrumbProps {
  pageTitle: string;
}

const PageBreadcrumb: React.FC<BreadcrumbProps> = ({ pageTitle }) => {
  return (
    <div className="flex flex-wrap items-center justify-end gap-3 mb-3">
      <nav aria-label="Breadcrumb">
        <ol className="flex items-center gap-1.5 text-xs">
          <li>
            <Link
              className="inline-flex items-center gap-1.5 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
              href="/app"
            >
              Inicio
              <svg
                className="stroke-current"
                width="15"
                height="15"
                viewBox="0 0 17 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M6.0765 12.667L10.2432 8.50033L6.0765 4.33366"
                  stroke=""
                  strokeWidth="1.3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>
          </li>
          <li className="font-medium text-slate-800 dark:text-slate-200">
            {pageTitle}
          </li>
        </ol>
      </nav>
    </div>
  );
};

export default PageBreadcrumb;
