'use client';

import React, { useEffect, useState } from 'react';
import { Building2 } from 'lucide-react';
import { companyService } from '@/services/companyService';
import type { Company } from '@/types/wasteManagement';

export default function ActiveCompanySwitcher() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [activeId, setActiveId] = useState<number | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const list = await companyService.getMyCompanies();
        if (!mounted || list.length <= 1) return;
        setCompanies(list);
        const stored = companyService.getActiveCompanyId();
        const valid = list.find((c) => c.id === stored) ? stored : list[0].id;
        setActiveId(valid);
      } catch {
        // Silencioso en rutas sin sesión o si no hay empresas propias múltiples
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  if (companies.length <= 1) {
    return null;
  }

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextId = Number(e.target.value);
    setActiveId(nextId);
    companyService.setActiveCompanyId(nextId);
    window.location.reload();
  };

  return (
    <div
      className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-gray-50 px-2.5 py-1.5 text-xs text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
      title="Empresa titular activa del tenant"
    >
      <Building2 className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
      <select
        aria-label="Cambiar empresa activa"
        value={activeId ?? ''}
        onChange={handleChange}
        className="max-w-[160px] truncate bg-transparent text-xs font-medium outline-none cursor-pointer"
      >
        {companies.map((c) => (
          <option key={c.id} value={c.id} className="bg-white text-gray-900 dark:bg-gray-900 dark:text-gray-100">
            {c.razon_social} ({c.cif})
          </option>
        ))}
      </select>
    </div>
  );
}

