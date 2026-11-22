"use client";
import Logo from "@/components/common/Logo";
import { ThemeToggleButton } from "@/components/common/ThemeToggleButton";
import UserDropdown from "@/components/header/UserDropdown";
import CompanyContextSwitcher from "@/components/header/CompanyContextSwitcher";
import SandboxProfileSwitcher from "@/components/common/SandboxProfileSwitcher";
import { useSidebar } from "@/context/SidebarContext";
import Link from "next/link";
import React, { useState, useEffect } from "react";
import { Menu, X, Search, MoreHorizontal } from "lucide-react";
import CommandPaletteModal from "@/components/command-palette/CommandPaletteModal";

const AppHeader: React.FC = () => {
  const [isApplicationMenuOpen, setApplicationMenuOpen] = useState(false);
  const [isCommandPaletteOpen, setCommandPaletteOpen] = useState(false);

  const { isMobileOpen, toggleSidebar, toggleMobileSidebar } = useSidebar();

  const handleToggle = () => {
    if (window.innerWidth >= 1024) {
      toggleSidebar();
    } else {
      toggleMobileSidebar();
    }
  };

  const toggleApplicationMenu = () => {
    setApplicationMenuOpen(!isApplicationMenuOpen);
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <header className="sticky top-0 flex w-full bg-white/85 backdrop-blur-md border-slate-200 z-30 dark:border-slate-800/90 dark:bg-[#0d1321]/85 lg:border-b">
      <div className="flex flex-col items-center justify-between grow lg:flex-row lg:px-6">
        <div className="flex items-center justify-between w-full gap-2 px-3 py-2.5 border-b border-slate-200 dark:border-slate-800 sm:gap-3 lg:justify-normal lg:border-b-0 lg:px-0 lg:h-14">
          <button
            className="items-center justify-center w-9 h-9 text-slate-500 border-slate-200 rounded-md hover:bg-slate-100/80 hover:text-slate-900 dark:border-slate-800 lg:flex dark:text-slate-400 dark:hover:bg-white/[0.05] dark:hover:text-slate-100 lg:border transition-colors"
            onClick={handleToggle}
            aria-label="Alternar barra lateral"
          >
            {isMobileOpen ? (
              <X className="w-5 h-5" aria-hidden="true" />
            ) : (
              <Menu className="w-4 h-4" aria-hidden="true" />
            )}
          </button>

          <Link href="/app" className="lg:hidden">
            <Logo width={148} height={40} />
          </Link>

          <div className="flex items-center gap-1 lg:hidden">
            <button
              type="button"
              onClick={() => setCommandPaletteOpen(true)}
              aria-label="Abrir búsqueda rápida"
              className="flex items-center justify-center w-9 h-9 text-slate-600 rounded-lg hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
            >
              <Search className="w-4 h-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={toggleApplicationMenu}
              aria-label="Abrir menú de acciones"
              aria-expanded={isApplicationMenuOpen}
              className="flex items-center justify-center w-9 h-9 text-slate-600 rounded-lg hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
            >
              <MoreHorizontal className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>

          <div className="hidden lg:block">
            <div
              onClick={() => setCommandPaletteOpen(true)}
              className="relative cursor-pointer group"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setCommandPaletteOpen(true);
                }
              }}
              aria-label="Abrir paleta de comandos y búsqueda global (⌘K)"
            >
              <span className="absolute -translate-y-1/2 left-3.5 top-1/2 pointer-events-none text-slate-400 group-hover:text-brand-500 dark:text-slate-500 dark:group-hover:text-brand-400 transition-colors">
                <Search className="w-4 h-4" aria-hidden="true" />
              </span>
              <input
                type="text"
                readOnly
                placeholder="Buscar DI, código LER, NIMA o comando..."
                className="h-9 w-full rounded-md border border-slate-200 bg-slate-50/70 py-1.5 pl-10 pr-14 text-[13px] text-slate-800 placeholder:text-slate-400 group-hover:border-brand-400 group-hover:bg-white dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-100 dark:placeholder:text-slate-500 dark:group-hover:border-brand-700 xl:w-[360px] cursor-pointer transition-colors"
              />

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setCommandPaletteOpen(true);
                }}
                className="absolute right-2 top-1/2 inline-flex -translate-y-1/2 items-center gap-0.5 rounded border border-slate-200 bg-white px-1.5 py-0.5 font-mono text-[10.5px] text-slate-500 group-hover:border-brand-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:group-hover:border-brand-700 transition-colors"
              >
                <span>⌘</span>
                <span>K</span>
              </button>
            </div>
          </div>
        </div>
        <div
          className={`${
            isApplicationMenuOpen ? "flex" : "hidden"
          } items-center justify-between w-full gap-4 px-5 py-4 lg:flex shadow-theme-md lg:justify-end lg:px-0 lg:shadow-none`}
        >
          <div className="flex items-center gap-2 2xsm:gap-3">
            {/* <!-- Selector de Empresa Activa / Perfil Operativo (Multiempresa / Consultoría) --> */}
            <CompanyContextSwitcher />

            {/* <!-- Sandbox Profile Switcher (Solo Admin) --> */}
            <SandboxProfileSwitcher />

            {/* <!-- Dark Mode Toggler --> */}
            <ThemeToggleButton />
            {/* <!-- Dark Mode Toggler --> */}

            {/* <NotificationDropdown /> */}
            {/* <!-- Notification Menu Area --> */}
          </div>
          {/* <!-- User Area --> */}
          <UserDropdown /> 
    
        </div>
      </div>

      {/* Modal flotante Command Palette */}
      <CommandPaletteModal
        isOpen={isCommandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
      />
    </header>
  );
};

export default AppHeader;
