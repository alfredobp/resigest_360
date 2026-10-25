"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/context/ThemeContext";
import {
  quickSearchService,
  SearchRecordItem,
} from "@/services/quickSearchService";
import {
  Search,
  FileText,
  Building2,
  Truck,
  ShieldCheck,
  Moon,
  Sun,
  PlusCircle,
  HelpCircle,
  X,
  Loader2,
  FolderOpen,
  LayoutDashboard,
  Layers,
  ArrowRight,
  Sparkles,
} from "lucide-react";

interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface PaletteActionItem {
  id: string;
  title: string;
  subtitle: string;
  category: "action" | "navigation" | "records";
  badge?: string;
  icon: React.ReactNode;
  onSelect: () => void;
}

export const CommandPaletteModal: React.FC<CommandPaletteModalProps> = ({
  isOpen,
  onClose,
}) => {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [dbResults, setDbResults] = useState<SearchRecordItem[]>([]);
  const [isLoadingDb, setIsLoadingDb] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Navegación estática
  const navigationActions = useMemo<PaletteActionItem[]>(() => [
    {
      id: "nav-dashboard",
      title: "Dashboard Principal",
      subtitle: "Vista general y métricas de residuos",
      category: "navigation",
      badge: "Vista",
      icon: <LayoutDashboard className="w-4 h-4 text-brand-500" />,
      onSelect: () => {
        router.push("/app");
        onClose();
      },
    },
    {
      id: "nav-contratos",
      title: "Contratos de Tratamiento",
      subtitle: "Gestión de contratos con productores y gestores",
      category: "navigation",
      badge: "Módulo",
      icon: <FileText className="w-4 h-4 text-emerald-500" />,
      onSelect: () => {
        router.push("/residuos/contratos");
        onClose();
      },
    },
    {
      id: "nav-di",
      title: "Documentos de Identificación (DI)",
      subtitle: "Traslados, firmas y seguimiento de residuos",
      category: "navigation",
      badge: "Módulo",
      icon: <Layers className="w-4 h-4 text-blue-500" />,
      onSelect: () => {
        router.push("/residuos/documentos-identificacion");
        onClose();
      },
    },
    {
      id: "nav-deca",
      title: "Control DeCA",
      subtitle: "Verificación de firmas de transportistas",
      category: "navigation",
      badge: "Módulo",
      icon: <ShieldCheck className="w-4 h-4 text-amber-500" />,
      onSelect: () => {
        router.push("/residuos/deca");
        onClose();
      },
    },
    {
      id: "nav-empresas",
      title: "Empresas y Contactos",
      subtitle: "Directorio unificado de productores y clientes",
      category: "navigation",
      badge: "Directorio",
      icon: <Building2 className="w-4 h-4 text-purple-500" />,
      onSelect: () => {
        router.push("/residuos/empresas");
        onClose();
      },
    },
    {
      id: "nav-gestores",
      title: "Gestores de Residuos",
      subtitle: "Plantas de valorización y eliminación",
      category: "navigation",
      badge: "Directorio",
      icon: <ShieldCheck className="w-4 h-4 text-teal-500" />,
      onSelect: () => {
        router.push("/residuos/gestores");
        onClose();
      },
    },
    {
      id: "nav-transportistas",
      title: "Transportistas",
      subtitle: "Empresas de transporte registradas",
      category: "navigation",
      badge: "Directorio",
      icon: <Truck className="w-4 h-4 text-orange-500" />,
      onSelect: () => {
        router.push("/residuos/transportistas");
        onClose();
      },
    },
    {
      id: "nav-archivo",
      title: "Archivo Cronológico",
      subtitle: "Libro de registro de entradas y salidas",
      category: "navigation",
      badge: "Registro",
      icon: <FolderOpen className="w-4 h-4 text-indigo-500" />,
      onSelect: () => {
        router.push("/residuos/archivo-cronologico");
        onClose();
      },
    },
    {
      id: "nav-soporte",
      title: "Soporte y Manual",
      subtitle: "Documentación, preguntas frecuentes y asistencia",
      category: "navigation",
      badge: "Ayuda",
      icon: <HelpCircle className="w-4 h-4 text-sky-500" />,
      onSelect: () => {
        router.push("/support");
        onClose();
      },
    },
  ], [router, onClose]);

  // Acciones directas del sistema
  const systemActions = useMemo<PaletteActionItem[]>(() => [
    {
      id: "act-new-contract",
      title: "Crear Nuevo Contrato",
      subtitle: "Redactar un nuevo contrato de tratamiento",
      category: "action",
      badge: "Acción",
      icon: <PlusCircle className="w-4 h-4 text-emerald-500" />,
      onSelect: () => {
        router.push("/residuos/contratos");
        onClose();
      },
    },
    {
      id: "act-new-di",
      title: "Crear Nuevo DI (Documento de Identificación)",
      subtitle: "Registrar un nuevo traslado de residuos",
      category: "action",
      badge: "Acción",
      icon: <PlusCircle className="w-4 h-4 text-blue-500" />,
      onSelect: () => {
        router.push("/residuos/documentos-identificacion/nuevo");
        onClose();
      },
    },
    {
      id: "act-toggle-theme",
      title: theme === "dark" ? "Cambiar a Modo Claro" : "Cambiar a Modo Oscuro",
      subtitle: "Alternar la apariencia visual de la plataforma",
      category: "action",
      badge: "Tema",
      icon: theme === "dark" ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-500" />,
      onSelect: () => {
        toggleTheme();
        onClose();
      },
    },
  ], [router, onClose, theme, toggleTheme]);

  // Búsqueda en base de datos con debounce
  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (trimmed.length < 2) {
      setDbResults([]);
      setIsLoadingDb(false);
      return;
    }

    setIsLoadingDb(true);
    const timer = setTimeout(async () => {
      try {
        const records = await quickSearchService.searchRecords(trimmed);
        setDbResults(records);
      } catch (err) {
        console.error("Error al buscar registros en Command Palette:", err);
        setDbResults([]);
      } finally {
        setIsLoadingDb(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Mapear resultados de BD a items seleccionables
  const dbActionItems = useMemo<PaletteActionItem[]>(() => {
    return dbResults.map((r) => {
      let icon = <FileText className="w-4 h-4 text-emerald-500" />;
      if (r.category === "documents") icon = <Layers className="w-4 h-4 text-blue-500" />;
      if (r.category === "companies") icon = <Building2 className="w-4 h-4 text-purple-500" />;
      if (r.category === "gestores") icon = <ShieldCheck className="w-4 h-4 text-teal-500" />;
      if (r.category === "carriers") icon = <Truck className="w-4 h-4 text-orange-500" />;

      return {
        id: r.id,
        title: r.title,
        subtitle: r.subtitle,
        category: "records",
        badge: r.badge,
        icon,
        onSelect: () => {
          router.push(r.href);
          onClose();
        },
      };
    });
  }, [dbResults, router, onClose]);

  // Filtrado de acciones locales según búsqueda
  const filteredLocalActions = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) {
      return {
        actions: systemActions,
        navigation: navigationActions,
      };
    }

    return {
      actions: systemActions.filter(
        (a) => a.title.toLowerCase().includes(q) || a.subtitle.toLowerCase().includes(q)
      ),
      navigation: navigationActions.filter(
        (n) => n.title.toLowerCase().includes(q) || n.subtitle.toLowerCase().includes(q)
      ),
    };
  }, [searchQuery, systemActions, navigationActions]);

  // Todos los elementos activos en lista plana para navegación con teclado
  const allFlattenedItems = useMemo<PaletteActionItem[]>(() => {
    return [
      ...filteredLocalActions.actions,
      ...filteredLocalActions.navigation,
      ...dbActionItems,
    ];
  }, [filteredLocalActions, dbActionItems]);

  // Asegurar que selectedIndex permanezca dentro de los límites
  useEffect(() => {
    setSelectedIndex(0);
  }, [searchQuery, allFlattenedItems.length]);

  // Auto-focus al abrir
  useEffect(() => {
    if (isOpen) {
      setSearchQuery("");
      setSelectedIndex(0);
      setDbResults([]);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Manejo de teclas globales del modal
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < allFlattenedItems.length - 1 ? prev + 1 : 0
        );
        return;
      }

      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev > 0 ? prev - 1 : Math.max(allFlattenedItems.length - 1, 0)
        );
        return;
      }

      if (e.key === "Enter") {
        e.preventDefault();
        if (allFlattenedItems[selectedIndex]) {
          allFlattenedItems[selectedIndex].onSelect();
        }
      }
    },
    [allFlattenedItems, selectedIndex, onClose]
  );

  // Desplazar visualmente al elemento seleccionado si queda fuera de vista
  useEffect(() => {
    if (!listRef.current) return;
    const activeEl = listRef.current.querySelector<HTMLElement>(`[data-palette-index="${selectedIndex}"]`);
    if (activeEl) {
      activeEl.scrollIntoView({ block: "nearest" });
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  let runningIndex = 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4 bg-gray-900/60 backdrop-blur-sm transition-opacity duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Paleta de comandos y búsqueda global"
    >
      <div
        className="w-full max-w-2xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Cabecera del input */}
        <div className="relative flex items-center px-4 py-3.5 border-b border-gray-200 dark:border-gray-800">
          <Search className="w-5 h-5 text-gray-400 dark:text-gray-500 mr-3 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar páginas, contratos, DIs, empresas o comandos..."
            className="w-full bg-transparent text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 text-base outline-none border-none ring-0 focus:ring-0 focus:outline-none"
          />
          {isLoadingDb && (
            <Loader2 className="w-4 h-4 text-brand-500 animate-spin mr-2 shrink-0" />
          )}
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 mr-1"
              aria-label="Limpiar búsqueda"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded px-2 py-0.5 text-[11px] font-medium bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700">
            ESC
          </kbd>
        </div>

        {/* Lista de resultados */}
        <div
          ref={listRef}
          className="max-h-[60vh] overflow-y-auto p-2 space-y-4 divide-y divide-gray-100 dark:divide-gray-800/60"
        >
          {allFlattenedItems.length === 0 ? (
            <div className="py-12 text-center text-sm text-gray-500 dark:text-gray-400">
              <Sparkles className="w-8 h-8 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
              <p className="font-medium text-gray-700 dark:text-gray-300">No se encontraron resultados</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                Prueba con otro término como &quot;contrato&quot;, &quot;DI&quot;, &quot;empresa&quot; o &quot;modo oscuro&quot;.
              </p>
            </div>
          ) : (
            <>
              {/* Sección: Acciones Rápidas */}
              {filteredLocalActions.actions.length > 0 && (
                <div className="pt-2 first:pt-0">
                  <div className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 flex items-center justify-between">
                    <span>Acciones del Sistema</span>
                    <span className="text-[10px] text-gray-400 font-normal">Acceso directo</span>
                  </div>
                  <div className="space-y-1">
                    {filteredLocalActions.actions.map((item) => {
                      const itemIdx = runningIndex++;
                      const isSelected = itemIdx === selectedIndex;
                      return (
                        <div
                          key={item.id}
                          data-palette-index={itemIdx}
                          onClick={item.onSelect}
                          onMouseEnter={() => setSelectedIndex(itemIdx)}
                          className={`flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-colors ${
                            isSelected
                              ? "bg-brand-500/10 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400"
                              : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 shrink-0">
                              {item.icon}
                            </div>
                            <div className="truncate">
                              <p className="text-sm font-medium leading-tight truncate">
                                {item.title}
                              </p>
                              <p className="text-xs text-gray-400 dark:text-gray-500 leading-tight truncate mt-0.5">
                                {item.subtitle}
                              </p>
                            </div>
                          </div>
                          {item.badge && (
                            <span className="ml-2 px-2 py-0.5 text-[11px] font-medium rounded-md bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 shrink-0">
                              {item.badge}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Sección: Navegación */}
              {filteredLocalActions.navigation.length > 0 && (
                <div className="pt-2 first:pt-0">
                  <div className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                    Navegación
                  </div>
                  <div className="space-y-1">
                    {filteredLocalActions.navigation.map((item) => {
                      const itemIdx = runningIndex++;
                      const isSelected = itemIdx === selectedIndex;
                      return (
                        <div
                          key={item.id}
                          data-palette-index={itemIdx}
                          onClick={item.onSelect}
                          onMouseEnter={() => setSelectedIndex(itemIdx)}
                          className={`flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-colors ${
                            isSelected
                              ? "bg-brand-500/10 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400"
                              : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 shrink-0">
                              {item.icon}
                            </div>
                            <div className="truncate">
                              <p className="text-sm font-medium leading-tight truncate">
                                {item.title}
                              </p>
                              <p className="text-xs text-gray-400 dark:text-gray-500 leading-tight truncate mt-0.5">
                                {item.subtitle}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {item.badge && (
                              <span className="px-2 py-0.5 text-[11px] font-medium rounded-md bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                                {item.badge}
                              </span>
                            )}
                            <ArrowRight className="w-3.5 h-3.5 text-gray-400 opacity-0 group-hover:opacity-100" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Sección: Registros Encontrados (Base de Datos) */}
              {dbActionItems.length > 0 && (
                <div className="pt-2 first:pt-0">
                  <div className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 flex items-center justify-between">
                    <span>Registros de la Base de Datos</span>
                    <span className="text-[10px] text-gray-400 font-normal">{dbActionItems.length} coincidencia(s)</span>
                  </div>
                  <div className="space-y-1">
                    {dbActionItems.map((item) => {
                      const itemIdx = runningIndex++;
                      const isSelected = itemIdx === selectedIndex;
                      return (
                        <div
                          key={item.id}
                          data-palette-index={itemIdx}
                          onClick={item.onSelect}
                          onMouseEnter={() => setSelectedIndex(itemIdx)}
                          className={`flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-colors ${
                            isSelected
                              ? "bg-brand-500/10 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400"
                              : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 shrink-0">
                              {item.icon}
                            </div>
                            <div className="truncate">
                              <p className="text-sm font-medium leading-tight truncate">
                                {item.title}
                              </p>
                              <p className="text-xs text-gray-400 dark:text-gray-500 leading-tight truncate mt-0.5">
                                {item.subtitle}
                              </p>
                            </div>
                          </div>
                          {item.badge && (
                            <span className="ml-2 px-2 py-0.5 text-[11px] font-medium rounded-md bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300 shrink-0">
                              {item.badge}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Barra inferior de atajos */}
        <div className="px-4 py-2.5 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 font-mono text-[10px]">↑</kbd>
              <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 font-mono text-[10px]">↓</kbd>
              <span>Navegar</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 font-mono text-[10px]">↵</kbd>
              <span>Seleccionar</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 font-mono text-[10px]">ESC</kbd>
              <span>Cerrar</span>
            </span>
          </div>
          <span className="text-[11px] text-gray-400 dark:text-gray-500 hidden sm:inline">
            ResiGest 360 Command Palette
          </span>
        </div>
      </div>
    </div>
  );
};

export default CommandPaletteModal;
