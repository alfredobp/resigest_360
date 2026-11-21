'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { canAccessPath } from '@/lib/profiles/moduleCatalog';
import { createClient } from '@/lib/supabase/client';
import {
  tenantContextService,
  setActiveCompanyCookie,
  type AccessibleCompany,
  type FullTenantContext,
} from '@/services/tenantContextService';
import type { AppModule, Company, MembershipRole, OperationalProfile } from '@/types/wasteManagement';

interface TenantContextValue {
  tenant: FullTenantContext | null;
  loading: boolean;
  activeCompany: Company | null;
  activeCompanyId: number | null;
  perfilOperativo: OperationalProfile;
  activeModules: AppModule[];
  accessibleCompanies: AccessibleCompany[];
  membershipRole: MembershipRole;
  canWrite: boolean;
  canManageCompany: boolean;
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
    const supabase = createClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        setTenant(null);
        setLoading(false);
      } else if (
        event === 'SIGNED_IN' ||
        event === 'TOKEN_REFRESHED' ||
        event === 'USER_UPDATED'
      ) {
        refreshTenant();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [refreshTenant]);

  const switchCompany = useCallback(
    async (companyId: number) => {
      setActiveCompanyCookie(companyId);
      if (typeof window !== 'undefined') {
        try {
          window.localStorage.setItem('resigest_active_company_id', String(companyId));
        } catch {
          // Ignorar errores de acceso a localStorage en modo privado
        }
      }
      await refreshTenant();
    },
    [refreshTenant]
  );

  const activeModules = tenant?.activeModules ?? [];
  const isPlatformAdmin = tenant?.isPlatformAdmin ?? false;
  const perfilOperativo: OperationalProfile = tenant?.perfilOperativo ?? 'productor';
  const membershipRole: MembershipRole = tenant?.membershipRole ?? 'owner';
  const canWrite = tenant?.canWrite ?? true;
  const canManageCompany = tenant?.canManageCompany ?? true;

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
      return canAccessPath(path, activeModules, isPlatformAdmin, {
        membershipRole,
        perfilOperativo,
      });
    },
    [tenant, activeModules, isPlatformAdmin, membershipRole, perfilOperativo]
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
        membershipRole,
        canWrite,
        canManageCompany,
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
      membershipRole: 'owner',
      canWrite: true,
      canManageCompany: true,
      isPlatformAdmin: false,
      canViewCommercial: false,
      hasModule: () => true,
      canAccessRoute: () => true,
      switchCompany: async () => { },
      refreshTenant: async () => { },
    };
  }
  return ctx;
};

