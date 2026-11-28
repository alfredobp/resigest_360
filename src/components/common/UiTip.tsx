'use client';

import React from 'react';
import { useTenant } from '@/context/TenantContext';
import { shouldRenderUiHint } from '@/lib/ui/tipsPreference';

interface UiTipProps {
  children: React.ReactNode;
  alwaysShow?: boolean;
}

/**
 * Envuelve tips, coletillas normativas, subtítulos explicativos o bloques de instrucciones
 * para que solo se muestren cuando la empresa tiene activado `mostrar_ayudas_ui`.
 * En modo simplificado (por defecto) no renderiza nada.
 */
const UiTip: React.FC<UiTipProps> = ({ children, alwaysShow = false }) => {
  const { showUiTips } = useTenant();
  if (!shouldRenderUiHint(showUiTips, alwaysShow)) {
    return null;
  }
  return <>{children}</>;
};

export default UiTip;
