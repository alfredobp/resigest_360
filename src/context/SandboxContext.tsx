'use client';

// ==============================================================================
// RESIGEST 360 - CONTEXTO DE PERFILES SANDBOX (PROVISIONAL)
// NOTA IMPORTANTE DE ARQUITECTURA:
// Este selector de perfiles es PROVISIONAL para el entorno de pruebas y Sandbox solicitado
// por Daniel Cantero. En producción definitiva, estos módulos se activarán/desactivarán
// automáticamente durante el proceso de alta y configuración de cada cliente.
// ==============================================================================

import React, { createContext, useContext, useState, useEffect } from 'react';
import type { SandboxProfileType } from '@/types/deca';

interface SandboxContextType {
  profile: SandboxProfileType;
  setProfile: (profile: SandboxProfileType) => void;
  isPathVisible: (path?: string) => boolean;
  profileLabel: string;
}

const SandboxContext = createContext<SandboxContextType | undefined>(undefined);

const PROFILE_LABELS: Record<SandboxProfileType, string> = {
  all: 'Modo Completo (Admin)',
  transportista: 'Transportista',
  chatarreria: 'Chatarrería / Metales',
  baterias: 'Baterías y RAEE',
  gestor_rp: 'Gestor Residuos Peligrosos',
  productor: 'Productor de Residuos',
};

// Mapeo de rutas permitidas por cada perfil
const PROFILE_ALLOWED_PATHS: Record<SandboxProfileType, string[]> = {
  all: [
    '/app',
    '/platform-admin',
    '/residuos/mi-empresa',
    '/residuos/empresas',
    '/residuos/contratos',
    '/residuos/gestores',
    '/residuos/transportistas',
    '/residuos/documentos-identificacion',
    '/residuos/deca',
    '/residuos/operaciones',
    '/residuos/archivo-cronologico',
    '/residuos/memorias-anuales',
    '/residuos/integraciones',
    '/support',
  ],
  transportista: [
    '/app',
    '/residuos/mi-empresa',
    '/residuos/transportistas',
    '/residuos/deca',
    '/residuos/documentos-identificacion',
    '/support',
  ],
  chatarreria: [
    '/app',
    '/residuos/mi-empresa',
    '/residuos/empresas',
    '/residuos/operaciones', // Báscula y liquidación
    '/residuos/documentos-identificacion',
    '/residuos/deca',
    '/residuos/archivo-cronologico',
    '/support',
  ],
  baterias: [
    '/app',
    '/residuos/mi-empresa',
    '/residuos/empresas',
    '/residuos/contratos',
    '/residuos/documentos-identificacion',
    '/residuos/deca',
    '/residuos/archivo-cronologico',
    '/support',
  ],
  gestor_rp: [
    '/app',
    '/residuos/mi-empresa',
    '/residuos/empresas',
    '/residuos/contratos',
    '/residuos/gestores',
    '/residuos/documentos-identificacion',
    '/residuos/deca',
    '/residuos/archivo-cronologico',
    '/residuos/memorias-anuales',
    '/residuos/integraciones',
    '/support',
  ],
  productor: [
    '/app',
    '/residuos/mi-empresa',
    '/residuos/empresas',
    '/residuos/contratos',
    '/residuos/documentos-identificacion',
    '/residuos/deca',
    '/residuos/archivo-cronologico',
    '/support',
  ],
};

const STORAGE_KEY = 'resigest_sandbox_profile';

export const SandboxProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [profile, setProfileState] = useState<SandboxProfileType>('all');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY) as SandboxProfileType;
      if (saved && PROFILE_LABELS[saved]) {
        setProfileState(saved);
      }
    }
  }, []);

  const setProfile = (newProfile: SandboxProfileType) => {
    setProfileState(newProfile);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, newProfile);
    }
  };

  const isPathVisible = (path?: string): boolean => {
    if (!path) return true;
    if (profile === 'all') return true;
    const allowed = PROFILE_ALLOWED_PATHS[profile] || [];
    return allowed.some((allowedPath) => path === allowedPath || path.startsWith(`${allowedPath}/`));
  };

  return (
    <SandboxContext.Provider
      value={{
        profile,
        setProfile,
        isPathVisible,
        profileLabel: PROFILE_LABELS[profile] || 'Modo Completo',
      }}
    >
      {children}
    </SandboxContext.Provider>
  );
};

export const useSandbox = () => {
  const context = useContext(SandboxContext);
  if (!context) {
    // Fallback defensivo si se usa fuera del Provider
    return {
      profile: 'all' as SandboxProfileType,
      setProfile: () => {},
      isPathVisible: () => true,
      profileLabel: 'Modo Completo',
    };
  }
  return context;
};
