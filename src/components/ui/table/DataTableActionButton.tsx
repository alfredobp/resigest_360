'use client';

import React from 'react';
import {
  Eye,
  Pencil,
  Trash2,
  ShieldCheck,
  Truck,
  Copy,
  Power,
  MoreHorizontal,
  UserCheck,
  UserPlus,
  UserX,
  Ban,
  CheckCircle2,
  ClipboardList,
  Send,
  QrCode,
  FileDown,
  History,
  Loader2,
  type LucideIcon,
} from 'lucide-react';

export type TableActionType =
  | 'view'
  | 'edit'
  | 'delete'
  | 'authorizations'
  | 'fleet'
  | 'copy'
  | 'toggle'
  | 'more'
  | 'act'
  | 'delegate'
  | 'revoke'
  | 'block'
  | 'activate'
  | 'audit'
  | 'send'
  | 'qr'
  | 'download'
  | 'version';

export type TableActionTone =
  | 'neutral'
  | 'primary'
  | 'brand'
  | 'info'
  | 'success'
  | 'warning'
  | 'danger';

interface TableActionPreset {
  icon: LucideIcon;
  defaultLabel: string;
  tone: TableActionTone;
}

export const TABLE_ACTION_CONFIG: Record<TableActionType, TableActionPreset> = {
  view: { icon: Eye, defaultLabel: 'Ver', tone: 'neutral' },
  edit: { icon: Pencil, defaultLabel: 'Editar', tone: 'neutral' },
  delete: { icon: Trash2, defaultLabel: 'Eliminar', tone: 'danger' },
  authorizations: { icon: ShieldCheck, defaultLabel: 'Autorizaciones', tone: 'brand' },
  fleet: { icon: Truck, defaultLabel: 'Flota', tone: 'info' },
  copy: { icon: Copy, defaultLabel: 'Copiar', tone: 'neutral' },
  toggle: { icon: Power, defaultLabel: 'Estado', tone: 'warning' },
  more: { icon: MoreHorizontal, defaultLabel: 'Más acciones', tone: 'neutral' },
  act: { icon: UserCheck, defaultLabel: 'Actuar', tone: 'primary' },
  delegate: { icon: UserPlus, defaultLabel: 'Delegar', tone: 'neutral' },
  revoke: { icon: UserX, defaultLabel: 'Revocar', tone: 'danger' },
  block: { icon: Ban, defaultLabel: 'Bloquear', tone: 'danger' },
  activate: { icon: CheckCircle2, defaultLabel: 'Activar', tone: 'success' },
  audit: { icon: ClipboardList, defaultLabel: 'Auditar', tone: 'neutral' },
  send: { icon: Send, defaultLabel: 'Enviar', tone: 'success' },
  qr: { icon: QrCode, defaultLabel: 'QR', tone: 'info' },
  download: { icon: FileDown, defaultLabel: 'PDF', tone: 'neutral' },
  version: { icon: History, defaultLabel: 'Versión', tone: 'neutral' },
};

const TONE_CLASSES: Record<TableActionTone, string> = {
  neutral:
    'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300 hover:text-slate-900 dark:bg-[#111827] dark:text-slate-300 dark:border-slate-700/90 dark:hover:bg-slate-800/80 dark:hover:text-white',
  primary:
    'bg-brand-500 text-white border-brand-600/20 shadow-[0_1px_2px_rgba(5,150,105,0.22)] hover:bg-brand-600',
  brand:
    'bg-white text-brand-700 border-brand-200 hover:bg-brand-50 dark:bg-[#111827] dark:text-brand-300 dark:border-brand-800/80 dark:hover:bg-brand-950/40',
  info:
    'bg-white text-sky-700 border-sky-200 hover:bg-sky-50 dark:bg-[#111827] dark:text-sky-400 dark:border-sky-900/80 dark:hover:bg-sky-950/40',
  success:
    'bg-white text-emerald-700 border-emerald-200 hover:bg-emerald-50 dark:bg-[#111827] dark:text-emerald-400 dark:border-emerald-900/80 dark:hover:bg-emerald-950/40',
  warning:
    'bg-white text-amber-700 border-amber-200 hover:bg-amber-50 dark:bg-[#111827] dark:text-amber-400 dark:border-amber-900/80 dark:hover:bg-amber-950/40',
  danger:
    'bg-white text-red-600 border-red-200/90 hover:bg-red-50 hover:border-red-300 dark:bg-[#111827] dark:text-red-400 dark:border-red-900/70 dark:hover:bg-red-950/40',
};

export interface DataTableActionButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  action: TableActionType;
  label?: string;
  iconOnly?: boolean;
  loading?: boolean;
  tone?: TableActionTone;
}

export const DataTableActionButton: React.FC<DataTableActionButtonProps> = ({
  action,
  label,
  iconOnly = false,
  loading = false,
  tone,
  className = '',
  title,
  disabled,
  type = 'button',
  ...rest
}) => {
  const preset = TABLE_ACTION_CONFIG[action];
  const Icon = preset.icon;
  const resolvedLabel = label ?? preset.defaultLabel;
  const resolvedTone = tone ?? preset.tone;
  const isIconOnly = iconOnly || action === 'more';
  const iconClass = action === 'more' ? 'w-4 h-4 shrink-0' : 'w-3.5 h-3.5 shrink-0';

  return (
    <button
      type={type}
      disabled={disabled || loading}
      title={title ?? (isIconOnly ? resolvedLabel : undefined)}
      aria-label={rest['aria-label'] ?? resolvedLabel}
      className={`inline-flex items-center justify-center h-7 rounded-md border text-[11px] font-semibold transition-colors whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed ${
        isIconOnly ? 'w-7 px-0' : 'px-2.5 gap-1.5'
      } ${TONE_CLASSES[resolvedTone]} ${className}`.trim()}
      {...rest}
    >
      {loading ? (
        <Loader2 className="w-3.5 h-3.5 shrink-0 animate-spin text-brand-600 dark:text-brand-400" />
      ) : (
        <Icon className={iconClass} aria-hidden="true" />
      )}
      {!isIconOnly && <span>{resolvedLabel}</span>}
    </button>
  );
};

export default DataTableActionButton;
