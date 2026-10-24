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
import { useSandbox } from "@/context/SandboxContext";

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

const navItems: NavItem[] = [
  {
    icon: <GridIcon />,
    name: "Dashboard",
    path: "/app",
  },
  {
    icon: <DocsIcon />,
    name: "Mi Empresa",
    path: "/residuos/mi-empresa"
  },
  {
    icon: <UserCircleIcon />,
    name: "Empresas y Contactos",
    path: "/residuos/empresas"
  },
  {
    icon: <HorizontaLDots />,
    name: "Contratos",
    path: "/residuos/contratos"
  },
  {
    icon: <TaskIcon />,
    name: "Gestores",
    path: "/residuos/gestores",
  },
  {
    icon: <CalenderIcon />,
    name: "Transportistas",
    path: "/residuos/transportistas",
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
    icon: <PaperPlaneIcon />,
    name: "Documentos de Identificación",
    path: "/residuos/documentos-identificacion",
  },
  {
    icon: <DollarLineIcon />,
    name: "Operaciones Comerciales",
    path: "/residuos/operaciones",
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
];

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
  const { isPathVisible, profile, profileLabel } = useSandbox();
  const pathname = usePathname();

  const renderMenuItems = (
    navItemsList: NavItem[],
    menuType: "main" | "others"
  ) => {
    const filteredList = navItemsList.filter((nav) => {
      if (nav.path) return isPathVisible(nav.path);
      if (nav.subItems) return nav.subItems.some((s) => isPathVisible(s.path));
      return true;
    });

    return (
      <ul className="flex flex-col gap-4">
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
            nav.path && (
              <Link
                href={nav.path}
                className={`menu-item group ${isActive(nav.path) ? "menu-item-active" : "menu-item-inactive"
                  }`}
              >
                <span
                  className={`${isActive(nav.path)
                    ? "menu-item-icon-active"
                    : "menu-item-icon-inactive"
                    }`}
                >
                  {nav.icon}
                </span>
                {(isExpanded || isHovered || isMobileOpen) && (
                  <span className="menu-item-text">{nav.name}</span>
                )}
              </Link>
            )
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

  // const isActive = (path: string) => path === pathname;
  const isActive = useCallback((path: string) => path === pathname, [pathname]);

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
      className={`fixed mt-16 flex flex-col lg:mt-0 top-0 px-5 left-0 bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-screen transition-all duration-300 ease-in-out z-50 border-r border-gray-200 
        ${isExpanded || isMobileOpen
          ? "w-[290px]"
          : isHovered
            ? "w-[290px]"
            : "w-[90px]"
        }
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`py-4 flex  ${!isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
          }`}
      >
        <Link href="/app">
          {isExpanded || isHovered || isMobileOpen ? (
            <Logo width={231} height={99} />
          ) : (
            <LogoReduced width={60} height={60} />
          )}
        </Link>
      </div>
      <div className="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar">
        <nav className="mb-6">
          <div className="flex flex-col gap-4">
            <div>
              <h2
                className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${!isExpanded && !isHovered
                  ? "lg:justify-center"
                  : "justify-start"
                  }`}
              >
                {isExpanded || isHovered || isMobileOpen ? (
                  "Menú"
                ) : (
                  <HorizontaLDots />
                )}
              </h2>
              {renderMenuItems(navItems, "main")}
            </div>

            {isAdmin && (
              <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
                <h2
                  className={`mb-4 text-xs uppercase flex leading-[20px] font-bold text-primary ${!isExpanded && !isHovered
                    ? "lg:justify-center"
                    : "justify-start"
                    }`}
                >
                  {isExpanded || isHovered || isMobileOpen ? (
                    "Administración"
                  ) : (
                    <HorizontaLDots />
                  )}
                </h2>
                {renderMenuItems(adminNavItems, "main")}
              </div>
            )}

            {/* Indicador de perfil Sandbox activo (Provisional) */}
            {profile !== 'all' && (isExpanded || isHovered || isMobileOpen) && (
              <div className="mt-2 p-3 bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50 rounded-xl text-xs">
                <div className="flex items-center gap-1.5 font-bold text-blue-700 dark:text-blue-300">
                  <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                  <span>Sandbox: {profileLabel}</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  Menú simplificado para este tipo de usuario.
                </p>
              </div>
            )}
          </div>
        </nav>
      </div>
    </aside>
  );
};

export default AppSidebar;
