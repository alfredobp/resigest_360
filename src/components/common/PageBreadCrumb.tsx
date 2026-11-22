import Link from "next/link";
import React from "react";
import { ChevronRight } from "lucide-react";

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
    </div>
  );
};

export default PageBreadcrumb;
