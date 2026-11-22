"use client";
import React, { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import LogoReduced from "@/components/common/LogoReduced";
import { usePathname } from "next/navigation";
import { useSidebar } from "../context/SidebarContext";
import {
  BoxCubeIcon,
  CalenderIcon,
  ChevronDownIcon,
  GridIcon,
  HorizontaLDots,
  ListIcon,
  PieChartIcon,
  PlugInIcon,
  TableIcon,
  UserCircleIcon,
  TaskIcon,
  DocsIcon,
  PaperPlaneIcon,
  DollarLineIcon,
  InfoIcon
} from "../icons/index";
import Logo from "@/components/common/Logo";
import adminPlatformService from "@/services/adminPlatformService";
import dashboardService from "@/services/dashboardService";
import { useSandbox } from "@/context/SandboxContext";
import { useTenant } from "@/context/TenantContext";
import { PROFILE_DEFINITIONS } from "@/lib/profiles/moduleCatalog";

type NavItem = {
  name: string;
  icon: React.ReactNode;
  path?: string;
  subItems?: Array<{ name: string; path: string; pro?: boolean; new?: boolean }>;
};

const adminNavItems: NavItem[] = [
  {
    icon: (
      <svg className="w-6 h-6 stroke-current" fill="none" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    name: "Modo Admin / Empresas",
    path: "/platform-admin",
  },
];

type NavGroup = {
  label: string;
  items: NavItem[];
};

const navGroups: NavGroup[] = [
  {
    label: "Operativa",
    items: [
      {
        icon: <GridIcon />,
        name: "Dashboard",
        path: "/app",
      },
      {
        icon: (
          <svg className="w-6 h-6 stroke-current" fill="none" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        ),
        name: "Vista Conductor (Móvil)",
        path: "/transporte",
      },
      {
        icon: <PaperPlaneIcon />,
        name: "Documentos de Identificación",
        path: "/residuos/documentos-identificacion",
      },
      {
        icon: (
          <svg className="w-6 h-6 stroke-current" fill="none" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        ),
        name: "Notificaciones Previas (NT)",
        path: "/residuos/notificaciones-previas",
      },
      {
        icon: (
          <svg className="w-6 h-6 stroke-current" fill="none" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 17a2 2 0 100 4 2 2 0 000-4zm10 0a2 2 0 100 4 2 2 0 000-4zM3 4h11v11H3V4zm11 4h4l3 3v4h-7V8z" />
          </svg>
        ),
        name: "Control DeCA",
        path: "/residuos/deca",
      },
      {
        icon: <DollarLineIcon />,
        name: "Operaciones Comerciales",
        path: "/residuos/operaciones",
      },
    ],
  },
  {
    label: "Cumplimiento y Registros",
    items: [
      {
        icon: <HorizontaLDots />,
        name: "Contratos",
        path: "/residuos/contratos",
      },
      {
        icon: <ListIcon />,
        name: "Archivo Cronológico",
        path: "/residuos/archivo-cronologico",
      },
      {
        icon: <TableIcon />,
        name: "Memorias Anuales",
        path: "/residuos/memorias-anuales",
      },
    ],
  },
  {
    label: "Red y Maestros",
    items: [
      {
        icon: <DocsIcon />,
        name: "Mi Empresa",
        path: "/residuos/mi-empresa",
      },
      {
        icon: <UserCircleIcon />,
        name: "Empresas y Contactos",
        path: "/residuos/empresas",
      },
      {
        icon: <TaskIcon />,
        name: "Gestores",
        path: "/residuos/gestores",
      },
      {
        icon: (
          <svg className="w-6 h-6 stroke-current" fill="none" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        ),
        name: "Mi Flota",
        path: "/residuos/flota",
      },
      {
        icon: <CalenderIcon />,
        name: "Transportistas",
        path: "/residuos/transportistas",
      },
    ],
  },
  {
    label: "Sistema",
    items: [
      {
        icon: <PlugInIcon />,
        name: "Integraciones y Auditoría",
        path: "/residuos/integraciones",
      },
      {
        icon: <InfoIcon />,
        name: "Soporte y Manual",
        path: "/support",
      },
    ],
  },
];

const navItems: NavItem[] = navGroups.flatMap((g) => g.items);

const othersItems: NavItem[] = [
  {
    icon: <PieChartIcon />,
    name: "Gráficos",
    subItems: [
      { name: "Gráfico de líneas", path: "/line-chart", pro: false },
      { name: "Gráfico de barras", path: "/bar-chart", pro: false },
    ],
  },
  {
    icon: <BoxCubeIcon />,
    name: "Elementos UI",
    subItems: [
      { name: "Alertas", path: "/alerts", pro: false },
      { name: "Avatares", path: "/avatars", pro: false },
      { name: "Insignias", path: "/badge", pro: false },
      { name: "Botones", path: "/buttons", pro: false },
      { name: "Imágenes", path: "/images", pro: false },
      { name: "Vídeos", path: "/videos", pro: false },
    ],
  },
  {
    icon: <PlugInIcon />,
    name: "Autenticación",
    subItems: [
      { name: "Iniciar Sesión", path: "/signin", pro: false },
      { name: "Registrarse", path: "/signup", pro: false },
    ],
  },
];

const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const { isPathVisible, profile } = useSandbox();
  const {
    canAccessRoute,
    perfilOperativo,
    activeCompany,
    activeCompanyId,
    isPlatformAdmin,
    isDelegated,
    canViewCommercial,
    exitDelegationContext,
    loading: tenantLoading,
  } = useTenant();
  const pathname = usePathname();
  const isAdminControlOnlyMode = isPlatformAdmin && !activeCompany;

  const [navBadges, setNavBadges] = useState<
    Record<string, { count: number; tone: "alert" | "neutral"; title: string }>
  >({});

  useEffect(() => {
    if (tenantLoading || isAdminControlOnlyMode) return;
    let cancelled = false;
    const scopedCompanyId = isPlatformAdmin && !activeCompanyId ? null : activeCompanyId;

    dashboardService
      .getExecutiveOverview({
        companyId: scopedCompanyId,
        includeCommercial: canViewCommercial,
      })
      .then((overview) => {
        if (cancelled) return;
        const next: Record<string, { count: number; tone: "alert" | "neutral"; title: string }> = {};

        const diCritical =
          overview.alertas.disDiscrepanciaCount +
          overview.alertas.disSinContratoCount +
          overview.alertas.disTratamientoNoAutorizadoCount;
        const diTotal = overview.alertas.disEnTransitoCount + diCritical;
        if (diTotal > 0) {
          next["/residuos/documentos-identificacion"] = {
            count: diTotal,
            tone: "alert",
            title: `${overview.alertas.disEnTransitoCount} en tránsito, ${diCritical} incidencias críticas`,
          };
        }

        const contractsTotal =
          overview.alertas.contratosCaducadosCount + overview.alertas.contratosPorVencerCount;
        if (contractsTotal > 0) {
          next["/residuos/contratos"] = {
            count: contractsTotal,
            tone: overview.alertas.contratosCaducadosCount > 0 ? "alert" : "neutral",
            title: `${overview.alertas.contratosCaducadosCount} caducados, ${overview.alertas.contratosPorVencerCount} próximos a vencer`,
          };
        }

        if (overview.comercial.operacionesAbiertas > 0) {
          next["/residuos/operaciones"] = {
            count: overview.comercial.operacionesAbiertas,
            tone: "neutral",
            title: `${overview.comercial.operacionesAbiertas} operaciones comerciales abiertas`,
          };
        }

        if (overview.alertas.autorizacionesPorVencerCount > 0) {
          next["/residuos/gestores"] = {
            count: overview.alertas.autorizacionesPorVencerCount,
            tone: "neutral",
            title: `${overview.alertas.autorizacionesPorVencerCount} autorizaciones próximas a vencer`,
          };
        }

        setNavBadges(next);
      })
      .catch(() => {
        // Silenciar si aún no hay sesión o datos disponibles
      });

    return () => {
      cancelled = true;
    };
}, [tenantLoading, isAdminControlOnlyMode, activeCompanyId, isPlatformAdmin, canViewCommercial]);

const checkMenuPathVisible = useCallback(
  (path?: string): boolean => {
    if (!path) return true;
    if (path === "/transporte") {
      if (isPlatformAdmin && profile !== "all") {
        return profile === "transportista";
      }
      return isPlatformAdmin || perfilOperativo === "transportista";
    }
    if (isPlatformAdmin && profile !== "all") {
      return isPathVisible(path);
    }
    if (tenantLoading && !activeCompany) {
      return path === "/app" || path === "/support" || path === "/residuos/mi-empresa";
    }
    return canAccessRoute(path);
  },
  [isPlatformAdmin, profile, isPathVisible, perfilOperativo, tenantLoading, activeCompany, canAccessRoute]
);

const renderMenuItems = (
  navItemsList: NavItem[],
  menuType: "main" | "others"
) => {
  const filteredList = navItemsList.filter((nav) => {
    if (nav.path) return checkMenuPathVisible(nav.path);
    if (nav.subItems) return nav.subItems.some((s) => checkMenuPathVisible(s.path));
    return true;
  });

  return (
    <ul className="flex flex-col gap-1">
      {filteredList.map((nav, index) => (
        <li key={nav.name}>
          {nav.subItems ? (
            <button
              onClick={() => handleSubmenuToggle(index, menuType)}
              className={`menu-item group  ${openSubmenu?.type === menuType && openSubmenu?.index === index
                ? "menu-item-active"
                : "menu-item-inactive"
                } cursor-pointer ${!isExpanded && !isHovered
                  ? "lg:justify-center"
                  : "lg:justify-start"
                }`}
            >
              <span
                className={` ${openSubmenu?.type === menuType && openSubmenu?.index === index
                  ? "menu-item-icon-active"
                  : "menu-item-icon-inactive"
                  }`}
              >
                {nav.icon}
              </span>
              {(isExpanded || isHovered || isMobileOpen) && (
                <span className="menu-item-text">{nav.name}</span>
              )}
              {(isExpanded || isHovered || isMobileOpen) && (
                <ChevronDownIcon
                  className={`ml-auto w-5 h-5 transition-transform duration-200  ${openSubmenu?.type === menuType &&
                    openSubmenu?.index === index
                    ? "rotate-180 text-brand-500"
                    : ""
                    }`}
                />
              )}
            </button>
          ) : (
            nav.path && (() => {
              const badge = navBadges[nav.path];
              const isCollapsed = !isExpanded && !isHovered && !isMobileOpen;
              return (
                <Link
                  href={nav.path}
                  title={badge ? `${nav.name} (${badge.title})` : nav.name}
                  className={`menu-item group ${isActive(nav.path) ? "menu-item-active" : "menu-item-inactive"
                    }`}
                >
                  <span
                    className={`relative ${isActive(nav.path)
                      ? "menu-item-icon-active"
                      : "menu-item-icon-inactive"
                      }`}
                  >
                    {nav.icon}
                    {isCollapsed && badge && (
                      <span
                        className={`absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full ring-2 ring-white dark:ring-[#0d1321] ${badge.tone === "alert" ? "bg-red-500" : "bg-slate-400"
                          }`}
                      />
                    )}
                  </span>
                  {!isCollapsed && (
                    <span className="menu-item-text truncate">{nav.name}</span>
                  )}
                  {!isCollapsed && badge && (
                    <span
                      className={`ml-auto inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[11px] font-bold tabular-nums leading-none ${badge.tone === "alert"
                          ? "bg-red-50 text-red-600 dark:bg-red-500/15 dark:text-red-400"
                          : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                        }`}
                    >
                      {badge.count > 99 ? "99+" : badge.count}
                    </span>
                  )}
                </Link>
              );
            })()
          )}
          {nav.subItems && (isExpanded || isHovered || isMobileOpen) && (
            <div
              ref={(el) => {
                subMenuRefs.current[`${menuType}-${index}`] = el;
              }}
              className="overflow-hidden transition-all duration-300"
              style={{
                height:
                  openSubmenu?.type === menuType && openSubmenu?.index === index
                    ? `${subMenuHeight[`${menuType}-${index}`]}px`
                    : "0px",
              }}
            >
              <ul className="mt-2 space-y-1 ml-9">
                {nav.subItems.map((subItem) => (
                  <li key={subItem.name}>
                    <Link
                      href={subItem.path}
                      className={`menu-dropdown-item ${isActive(subItem.path)
                        ? "menu-dropdown-item-active"
                        : "menu-dropdown-item-inactive"
                        }`}
                    >
                      {subItem.name}
                      <span className="flex items-center gap-1 ml-auto">
                        {subItem.new && (
                          <span
                            className={`ml-auto ${isActive(subItem.path)
                              ? "menu-dropdown-badge-active"
                              : "menu-dropdown-badge-inactive"
                              } menu-dropdown-badge `}
                          >
                            new
                          </span>
                        )}
                        {subItem.pro && (
                          <span
                            className={`ml-auto ${isActive(subItem.path)
                              ? "menu-dropdown-badge-active"
                              : "menu-dropdown-badge-inactive"
                              } menu-dropdown-badge `}
                          >
                            pro
                          </span>
                        )}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </li>
      ))}
    </ul>
  );
};

const [isAdmin, setIsAdmin] = useState(false);

useEffect(() => {
  adminPlatformService.checkIsAdmin().then(setIsAdmin).catch(() => setIsAdmin(false));
}, []);

const [openSubmenu, setOpenSubmenu] = useState<{
  type: "main" | "others";
  index: number;
} | null>(null);
const [subMenuHeight, setSubMenuHeight] = useState<Record<string, number>>(
  {}
);
const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});

const isActive = useCallback(
  (path: string) =>
    pathname === path || (path !== "/app" && pathname.startsWith(`${path}/`)),
  [pathname]
);

useEffect(() => {
  // Check if the current path matches any submenu item
  let submenuMatched = false;
  ["main", "others"].forEach((menuType) => {
    const items = menuType === "main" ? navItems : othersItems;
    items.forEach((nav, index) => {
      if (nav.subItems) {
        nav.subItems.forEach((subItem) => {
          if (isActive(subItem.path)) {
            setOpenSubmenu({
              type: menuType as "main" | "others",
              index,
            });
            submenuMatched = true;
          }
        });
      }
    });
  });

  // If no submenu item matches, close the open submenu
  if (!submenuMatched) {
    setOpenSubmenu(null);
  }
}, [pathname, isActive]);

useEffect(() => {
  // Set the height of the submenu items when the submenu is opened
  if (openSubmenu !== null) {
    const key = `${openSubmenu.type}-${openSubmenu.index}`;
    if (subMenuRefs.current[key]) {
      setSubMenuHeight((prevHeights) => ({
        ...prevHeights,
        [key]: subMenuRefs.current[key]?.scrollHeight || 0,
      }));
    }
  }
}, [openSubmenu]);

const handleSubmenuToggle = (index: number, menuType: "main" | "others") => {
  setOpenSubmenu((prevOpenSubmenu) => {
    if (
      prevOpenSubmenu &&
      prevOpenSubmenu.type === menuType &&
      prevOpenSubmenu.index === index
    ) {
      return null;
    }
    return { type: menuType, index };
  });
};

return (
  <aside
    className={`fixed mt-14 flex flex-col lg:mt-0 top-0 px-3 left-0 bg-white dark:bg-[#0d1321] border-r border-slate-200 dark:border-slate-800/90 text-slate-900 h-screen transition-all duration-200 ease-in-out z-50
        ${isExpanded || isMobileOpen
        ? "w-[252px]"
        : isHovered
          ? "w-[252px]"
          : "w-[76px]"
      }
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0`}
    onMouseEnter={() => !isExpanded && setIsHovered(true)}
    onMouseLeave={() => setIsHovered(false)}
  >
    <div
      className={`h-14 flex items-center border-b border-slate-200/80 dark:border-slate-800/80 mb-3 ${!isExpanded && !isHovered ? "lg:justify-center" : "justify-start px-1"
        }`}
    >
        <Link href={isAdminControlOnlyMode ? "/platform-admin" : "/app"}>
          {isExpanded || isHovered || isMobileOpen ? (
            <Logo width={168} height={46} />
          ) : (
            <LogoReduced width={38} height={38} />
          )}
        </Link>
    </div>
    <div className="flex flex-col overflow-y-auto duration-200 ease-linear no-scrollbar">
      <nav className="mb-6">
        <div className="flex flex-col gap-3">
          {isAdmin && (
              <div className={isAdminControlOnlyMode ? "" : "pb-3 border-b border-slate-100 dark:border-slate-800/80"}>
                <h2
                  className={`mb-2 px-2.5 text-[10.5px] uppercase tracking-wider flex leading-[18px] font-semibold text-brand-600 dark:text-brand-400 ${!isExpanded && !isHovered
                    ? "lg:justify-center"
                    : "justify-start"
                    }`}
                >
                  {isExpanded || isHovered || isMobileOpen ? (
                    "Control de Plataforma"
                  ) : (
                  <HorizontaLDots />
                  )}
                </h2>
                {renderMenuItems(adminNavItems, "main")}
                {isAdminControlOnlyMode && (isExpanded || isHovered || isMobileOpen) && (
                  <p className="mt-2 px-2.5 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                    Modo administración global. Selecciona una empresa delegada para operar en su nombre.
                  </p>
                )}
              </div>
            )}

                    {!isAdminControlOnlyMode && (
                      <div className="flex flex-col gap-4">
                        {navGroups.map((group, groupIdx) => {
                          const visibleItems = group.items.filter((nav) => {
                            if (nav.path) return checkMenuPathVisible(nav.path);
                            if (nav.subItems) return nav.subItems.some((s) => checkMenuPathVisible(s.path));
                            return true;
                          });
                          if (visibleItems.length === 0) return null;
                          const groupLabel =
                            groupIdx === 0 && isDelegated ? `${group.label} · Delegada` : group.label;
                          return (
                            <div
                              key={group.label}
                              className={
                                groupIdx > 0
                                  ? "pt-3 border-t border-slate-100 dark:border-slate-800/70"
                                  : ""
                              }
                            >
                              <h2
                                className={`mb-1.5 px-2.5 text-[10px] font-semibold uppercase tracking-wider flex leading-[18px] text-slate-400 dark:text-slate-500 ${
                                  !isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
                                }`}
                              >
                                {isExpanded || isHovered || isMobileOpen ? (
                                  groupLabel
                                ) : (
                                  <HorizontaLDots />
                                )}
                              </h2>
                              {renderMenuItems(visibleItems, "main")}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Indicador de empresa activa / delegación */}
                    {activeCompany && (isExpanded || isHovered || isMobileOpen) && (
                      <div className="mt-2 p-2.5 bg-slate-50 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800 rounded-lg text-xs space-y-1.5">
                        <div className="flex items-center justify-between gap-2 font-semibold text-slate-800 dark:text-slate-100">
                          <span className="truncate">{activeCompany.nombre_comercial || activeCompany.razon_social}</span>
                        </div>
                        <p className="text-[11px] text-brand-600 dark:text-brand-400 font-medium">
                          {isDelegated ? "Actuando en nombre de" : `Perfil: ${PROFILE_DEFINITIONS[perfilOperativo].shortLabel}`}
                        </p>
                        {isPlatformAdmin && (
                          <button
                            type="button"
                            onClick={async () => {
                              await exitDelegationContext();
                              window.location.href = "/platform-admin";
                            }}
                            className="w-full text-left text-[11px] font-semibold text-amber-700 dark:text-amber-400 hover:underline pt-1"
                          >
                            ← Salir y volver a Control Admin
                          </button>
                        )}
                      </div>
                    )}
                  </div>
        </nav>
      </div>
      </aside>
      );
};

      export default AppSidebar;
