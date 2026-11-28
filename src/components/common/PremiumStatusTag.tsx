'use client';

import React from 'react';
import { Clock, Lock } from 'lucide-react';
import {
  evaluateCompanyPremiumFeature,
  type CompanyPremiumFields,
  type PremiumFeatureKey,
} from '@/lib/auth/premiumAccess';

interface PremiumStatusTagProps {
  company?: CompanyPremiumFields | null;
  feature: PremiumFeatureKey;
  className?: string;
}

/**
 * Etiqueta de estado Premium para la app principal:
 * - Si el plan está activo con >15 días (o sin fecha de expiración), no muestra nada.
 * - Si faltan <=15 días para expirar, muestra "Válido hasta DD/MM/YYYY".
 * - Si no está activo o ha caducado, muestra aviso de Plan Premium requerido.
 */
export default function PremiumStatusTag({
  company,
  feature,
  className = '',
}: PremiumStatusTagProps) {
  const evaluation = evaluateCompanyPremiumFeature(company, feature);

  if (evaluation.active && !evaluation.showExpiringWarning) {
    return null;
  }

  if (evaluation.active && evaluation.showExpiringWarning && evaluation.validUntil) {
    const formattedDate = new Date(evaluation.validUntil).toLocaleDateString('es-ES');
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800 ${className}`}
      >
        <Clock className="w-3.5 h-3.5 shrink-0" />
        Válido hasta {formattedDate}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 ${className}`}
    >
      <Lock className="w-3.5 h-3.5 shrink-0" />
      {evaluation.status === 'expired' ? 'Cortesía caducada · Plan Premium' : 'Plan Premium requerido'}
    </span>
  );
}
