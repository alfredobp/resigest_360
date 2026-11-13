"use client";

import { useSidebar } from "@/context/SidebarContext";
import { useTenant } from "@/context/TenantContext";
import { toast } from "@/context/ToastContext";
import { getModuleLabel, PROFILE_DEFINITIONS } from "@/lib/profiles/moduleCatalog";
import type { AppModule } from "@/types/wasteManagement";
import AppHeader from "@/layout/AppHeader";
import AppSidebar from "@/layout/AppSidebar";
import Backdrop from "@/layout/Backdrop";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import React, { useEffect, Suspense } from "react";

function AdminGuardAndDemoBanner() {
  const { tenant, loading, canAccessRoute, isPlatformAdmin, perfilOperativo, activeCompany } = useTenant();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Mostrar aviso si el middleware redirigió por módulo denegado
  useEffect(() => {
    const denied = searchParams.get("denied");
    if (!denied) return;
    const label = denied === "restricted" ? "solicitado" : getModuleLabel(denied as AppModule);
    toast.warning(`Acceso restringido: el módulo "${label}" no está habilitado para tu perfil.`);
    router.replace(pathname);
  }, [searchParams, pathname, router]);

  // Defensa en profundidad en cliente (onboarding + módulos)
  useEffect(() => {
    if (loading || !tenant) return;

    if (!tenant.hasCompletedOnboarding && !isPlatformAdmin) {
      router.replace("/onboarding");
      return;
    }

    if (!canAccessRoute(pathname)) {
      toast.warning("Este módulo no forma parte de los servicios activos de tu empresa.");
      router.replace(tenant.homePath);
    }
  }, [loading, tenant, isPlatformAdmin, canAccessRoute, pathname, router]);

  const showDemoBanner =
    process.env.NEXT_PUBLIC_ENABLE_DEMO_ACCESS === "true" &&
    tenant?.userEmail &&
    (tenant.userEmail.endsWith(".test") || tenant.userEmail === "demo@resigest.com");

  if (!showDemoBanner || !tenant) {
    return null;
  }

  return (
    <div className="bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-900/60 px-4 py-2 text-xs text-amber-900 dark:text-amber-200 flex flex-wrap items-center justify-between gap-2">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="px-2 py-0.5 rounded-full bg-amber-200/80 dark:bg-amber-900 text-amber-950 dark:text-amber-100 font-bold uppercase tracking-wider text-[10px]">
          Cuenta de prueba
        </span>
        <span className="font-medium">
          {tenant.userEmail} ·{" "}
          <strong>{activeCompany?.nombre_comercial || activeCompany?.razon_social || "Sin empresa"}</strong>{" "}
          ({PROFILE_DEFINITIONS[perfilOperativo].shortLabel})
        </span>
      </div>
      <Link
        href="/accesos-prueba"
        className="font-semibold text-amber-800 dark:text-amber-300 underline hover:text-amber-950"
      >
        Cambiar cuenta de prueba →
      </Link>
    </div>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();

  // Dynamic class for main content margin based on sidebar state
  const mainContentMargin = isMobileOpen
    ? "ml-0"
    : isExpanded || isHovered
    ? "lg:ml-[290px]"
    : "lg:ml-[90px]";

  return (
    <div className="min-h-screen xl:flex">
      {/* Sidebar and Backdrop */}
      <AppSidebar />
      <Backdrop />
      {/* Main Content Area */}
      <div
        className={`flex-1 transition-all  duration-300 ease-in-out ${mainContentMargin}`}
      >
        <Suspense fallback={null}>
          <AdminGuardAndDemoBanner />
        </Suspense>
        {/* Header */}
        <AppHeader />
        {/* Page Content */}
        <div className="p-4 mx-auto max-w-(--breakpoint-2xl) md:p-6">{children}</div>
      </div>
    </div>
  );
}
