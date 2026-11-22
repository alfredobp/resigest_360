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
  isDelegated: boolean;
  activeDelegationExpiresAt: string | null;
  isAccountBlocked: boolean;
  blockedReason: string | null;
  hasModule: (module: AppModule) => boolean;
  canAccessRoute: (path?: string) => boolean;
  switchCompany: (companyId: number) => Promise<void>;
  exitDelegationContext: () => Promise<void>;
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

  const exitDelegationContext = useCallback(async () => {
    setActiveCompanyCookie(null);
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.removeItem('resigest_active_company_id');
      } catch {
        // Ignorar errores de acceso a localStorage en modo privado
      }
    }
    await refreshTenant();
  }, [refreshTenant]);

  const activeModules = tenant?.activeModules ?? [];
  const isPlatformAdmin = tenant?.isPlatformAdmin ?? false;
  const isDelegated = tenant?.isDelegated ?? false;
  const activeDelegationExpiresAt = tenant?.activeDelegationExpiresAt ?? null;
  const perfilOperativo: OperationalProfile = tenant?.perfilOperativo ?? 'productor';
  const membershipRole: MembershipRole = tenant?.membershipRole ?? 'owner';
  const canWrite = tenant?.canWrite ?? true;
  const canManageCompany = tenant?.canManageCompany ?? true;

  const hasModule = useCallback(
    (module: AppModule) => {
      if (isPlatformAdmin && !isDelegated) return true;
      return activeModules.includes(module);
    },
    [activeModules, isPlatformAdmin, isDelegated]
  );

  const canAccessRoute = useCallback(
    (path?: string) => {
      if (!path) return true;
      if (!tenant) return true;
      if (isPlatformAdmin && (path === '/platform-admin' || path.startsWith('/platform-admin/'))) {
        return true;
      }
      return canAccessPath(path, activeModules, isPlatformAdmin && !isDelegated, {
        membershipRole,
        perfilOperativo,
      });
    },
    [tenant, activeModules, isPlatformAdmin, isDelegated, membershipRole, perfilOperativo]
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
        isDelegated,
        activeDelegationExpiresAt,
        isAccountBlocked: tenant?.isAccountBlocked ?? false,
        blockedReason: tenant?.blockedReason ?? null,
        hasModule,
        canAccessRoute,
        switchCompany,
        exitDelegationContext,
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
      isDelegated: false,
      activeDelegationExpiresAt: null,
      isAccountBlocked: false,
      blockedReason: null,
      hasModule: () => true,
      canAccessRoute: () => true,
      switchCompany: async () => { },
      exitDelegationContext: async () => { },
      refreshTenant: async () => { },
    };
  }
  return ctx;
};

