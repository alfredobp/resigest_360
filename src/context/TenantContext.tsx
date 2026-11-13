'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { canAccessPath } from '@/lib/profiles/moduleCatalog';
import {
  tenantContextService,
  setActiveCompanyCookie,
  type AccessibleCompany,
  type FullTenantContext,
} from '@/services/tenantContextService';
import type { AppModule, Company, OperationalProfile } from '@/types/wasteManagement';

interface TenantContextValue {
  tenant: FullTenantContext | null;
  loading: boolean;
  activeCompany: Company | null;
  activeCompanyId: number | null;
  perfilOperativo: OperationalProfile;
  activeModules: AppModule[];
  accessibleCompanies: AccessibleCompany[];
  isPlatformAdmin: boolean;
  canViewCommercial: boolean;
  hasModule: (module: AppModule) => boolean;
  canAccessRoute: (path?: string) => boolean;
  switchCompany: (companyId: number) => Promise<void>;
  refreshTenant: () => Promise<void>;
}

const TenantContext = createContext<TenantContextValue | undefined>(undefined);

export const TenantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tenant, setTenant] = useState<FullTenantContext | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshTenant = useCallback(async () => {
    try {
      setLoading(true);
      const ctx = await tenantContextService.getTenantContext();
      setTenant(ctx);
    } catch {
      setTenant(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshTenant();
  }, [refreshTenant]);

  const switchCompany = useCallback(
    async (companyId: number) => {
      setActiveCompanyCookie(companyId);
      await refreshTenant();
    },
    [refreshTenant]
  );

  const activeModules = tenant?.activeModules ?? [];
  const isPlatformAdmin = tenant?.isPlatformAdmin ?? false;
  const perfilOperativo: OperationalProfile = tenant?.perfilOperativo ?? 'productor';

  const hasModule = useCallback(
    (module: AppModule) => {
      if (isPlatformAdmin) return true;
      return activeModules.includes(module);
    },
    [activeModules, isPlatformAdmin]
  );

  const canAccessRoute = useCallback(
    (path?: string) => {
      if (!path) return true;
      if (!tenant) return true;
      return canAccessPath(path, activeModules, isPlatformAdmin);
    },
    [tenant, activeModules, isPlatformAdmin]
  );

  return (
    <TenantContext.Provider
      value={{
        tenant,
        loading,
        activeCompany: tenant?.activeCompany ?? null,
        activeCompanyId: tenant?.activeCompanyId ?? null,
        perfilOperativo,
        activeModules,
        accessibleCompanies: tenant?.accessibleCompanies ?? [],
        isPlatformAdmin,
        canViewCommercial: tenant?.canViewCommercial ?? false,
        hasModule,
        canAccessRoute,
        switchCompany,
        refreshTenant,
      }}
    >
      {children}
    </TenantContext.Provider>
  );
};

export const useTenant = (): TenantContextValue => {
  const ctx = useContext(TenantContext);
  if (!ctx) {
    return {
      tenant: null,
      loading: false,
      activeCompany: null,
      activeCompanyId: null,
      perfilOperativo: 'productor',
      activeModules: [],
      accessibleCompanies: [],
      isPlatformAdmin: false,
      canViewCommercial: false,
      hasModule: () => true,
      canAccessRoute: () => true,
      switchCompany: async () => {},
      refreshTenant: async () => {},
    };
  }
  return ctx;
};

