"use client";
import Link from "next/link";
import React, { useState } from "react";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";
import { FileText, Send, FileCheck, BookOpen } from "lucide-react";

const OPERATIONAL_SHORTCUTS = [
  {
    id: "di",
    title: "Documentos de Identificación (DI)",
    description: "Controla traslados en tránsito, recepciones en báscula y firmas pendientes.",
    category: "RD 553/2020",
    href: "/residuos/documentos-identificacion",
    icon: <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />,
    badgeClass: "bg-blue-50 dark:bg-blue-900/30",
  },
  {
    id: "nt",
    title: "Notificaciones Previas (SIRA)",
    description: "Revisa plazos de preaviso de 10 días, vigencias y envíos E3L.",
    category: "Art. 8 RD 553/2020",
    href: "/residuos/notificaciones-previas",
    icon: <Send className="w-4 h-4 text-amber-600 dark:text-amber-400" />,
    badgeClass: "bg-amber-50 dark:bg-amber-900/30",
  },
  {
    id: "contratos",
    title: "Contratos de Tratamiento",
    description: "Verifica contratos vigentes, códigos LER amparados y formalización.",
    category: "Art. 5 RD 553/2020",
    href: "/residuos/contratos",
    icon: <FileCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />,
    badgeClass: "bg-emerald-50 dark:bg-emerald-900/30",
  },
  {
    id: "archivo",
    title: "Archivo Cronológico",
    description: "Asientos cronológicos y preparación de Memorias Anuales.",
    category: "Art. 64 Ley 7/2022",
    href: "/residuos/archivo-cronologico",
    icon: <BookOpen className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />,
    badgeClass: "bg-indigo-50 dark:bg-indigo-900/30",
  },
];

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);

  function toggleDropdown() {
    setIsOpen((prev) => !prev);
  }

  function closeDropdown() {
    setIsOpen(false);
  }

  return (
    <div className="relative">
      <button
        type="button"
        aria-label="Accesos rápidos de cumplimiento"
        className="relative dropdown-toggle flex items-center justify-center text-gray-500 transition-colors bg-white border border-gray-200 rounded-full hover:text-gray-700 h-11 w-11 hover:bg-gray-100 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
        onClick={toggleDropdown}
      >
        <svg
          className="fill-current"
          width="20"
          height="20"
          viewBox="0 0 20 20"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M10.75 2.29248C10.75 1.87827 10.4143 1.54248 10 1.54248C9.58583 1.54248 9.25004 1.87827 9.25004 2.29248V2.83613C6.08266 3.20733 3.62504 5.9004 3.62504 9.16748V14.4591H3.33337C2.91916 14.4591 2.58337 14.7949 2.58337 15.2091C2.58337 15.6234 2.91916 15.9591 3.33337 15.9591H4.37504H15.625H16.6667C17.0809 15.9591 17.4167 15.6234 17.4167 15.2091C17.4167 14.7949 17.0809 14.4591 16.6667 14.4591H16.375V9.16748C16.375 5.9004 13.9174 3.20733 10.75 2.83613V2.29248ZM14.875 14.4591V9.16748C14.875 6.47509 12.6924 4.29248 10 4.29248C7.30765 4.29248 5.12504 6.47509 5.12504 9.16748V14.4591H14.875ZM8.00004 17.7085C8.00004 18.1228 8.33583 18.4585 8.75004 18.4585H11.25C11.6643 18.4585 12 18.1228 12 17.7085C12 17.2943 11.6643 16.9585 11.25 16.9585H8.75004C8.33583 16.9585 8.00004 17.2943 8.00004 17.7085Z"
            fill="currentColor"
          />
        </svg>
      </button>
      <Dropdown
        isOpen={isOpen}
        onClose={closeDropdown}
        className="absolute -right-[240px] mt-[17px] flex max-h-[480px] w-[350px] flex-col rounded-2xl border border-gray-200 bg-white p-3 shadow-theme-lg dark:border-gray-800 dark:bg-gray-dark sm:w-[361px] lg:right-0"
      >
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-100 dark:border-gray-700">
          <h5 className="text-base font-semibold text-gray-800 dark:text-gray-200">
            Cumplimiento y Accesos Rápidos
          </h5>
          <button
            type="button"
            onClick={closeDropdown}
            aria-label="Cerrar menú"
            className="text-gray-500 transition dropdown-toggle dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
          >
            <svg
              className="fill-current"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M6.21967 7.28131C5.92678 6.98841 5.92678 6.51354 6.21967 6.22065C6.51256 5.92775 6.98744 5.92775 7.28033 6.22065L11.999 10.9393L16.7176 6.22078C17.0105 5.92789 17.4854 5.92788 17.7782 6.22078C18.0711 6.51367 18.0711 6.98855 17.7782 7.28144L13.0597 12L17.7782 16.7186C18.0711 17.0115 18.0711 17.4863 17.7782 17.7792C17.4854 18.0721 17.0105 18.0721 16.7176 17.7792L11.999 13.0607L7.28033 17.7794C6.98744 18.0722 6.51256 18.0722 6.21967 17.7794C5.92678 17.4865 5.92678 17.0116 6.21967 16.7187L10.9384 12L6.21967 7.28131Z"
                fill="currentColor"
              />
            </svg>
          </button>
        </div>
        <ul className="flex flex-col h-auto overflow-y-auto custom-scrollbar">
          {OPERATIONAL_SHORTCUTS.map((item) => (
            <li key={item.id}>
              <DropdownItem
                href={item.href}
                onItemClick={closeDropdown}
                className="flex gap-3 rounded-lg border-b border-gray-100 p-3 px-4 py-3 hover:bg-gray-100 dark:border-gray-800 dark:hover:bg-white/5"
              >
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${item.badgeClass}`}>
                  {item.icon}
                </span>

                <span className="block">
                  <span className="mb-1 block text-theme-sm font-medium text-gray-800 dark:text-white/90">
                    {item.title}
                  </span>
                  <span className="mb-1 block text-xs text-gray-500 dark:text-gray-400">
                    {item.description}
                  </span>
                  <span className="text-[11px] font-medium text-brand-600 dark:text-brand-400">
                    {item.category}
                  </span>
                </span>
              </DropdownItem>
            </li>
          ))}
        </ul>
        <Link
          href="/residuos/documentos-identificacion"
          onClick={closeDropdown}
          className="block px-4 py-2 mt-3 text-sm font-medium text-center text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
        >
          Ver documentos de identificación
        </Link>
      </Dropdown>
    </div>
  );
}
