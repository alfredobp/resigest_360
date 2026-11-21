import {
  ALL_MODULES,
  canAccessPath,
  canManageCompanyWithMembershipRole,
  canWriteWithMembershipRole,
  getDefaultModulesForProfile,
  getEffectiveModules,
  getHomePathForProfile,
  getModuleLabel,
  getRequiredModuleForPath,
  isValidOperationalProfile,
  isWriteOnlyPath,
  normalizeOperationalProfile,
} from '../moduleCatalog';

describe('moduleCatalog - Perfiles Operativos y Módulos', () => {
  describe('isValidOperationalProfile & normalizeOperationalProfile', () => {
    it('debe reconocer perfiles explícitos válidos', () => {
      expect(isValidOperationalProfile('productor')).toBe(true);
      expect(isValidOperationalProfile('chatarreria')).toBe(true);
      expect(isValidOperationalProfile('invalido')).toBe(false);
      expect(normalizeOperationalProfile('baterias')).toBe('baterias');
    });

    it('debe derivar el perfil desde roles o tipo_empresa legado cuando no hay perfil_operativo', () => {
      expect(normalizeOperationalProfile(null, 'gestor', ['productor', 'gestor', 'negociante'])).toBe('completo');
      expect(normalizeOperationalProfile(null, 'negociante', ['negociante'])).toBe('negociante');
      expect(normalizeOperationalProfile(null, 'transportista', [])).toBe('transportista');
      expect(normalizeOperationalProfile(null, 'gestor', [])).toBe('gestor_rp');
      expect(normalizeOperationalProfile(null, 'productor', [])).toBe('productor');
    });
  });

  describe('getDefaultModulesForProfile & getEffectiveModules', () => {
    it('debe devolver módulos por defecto según perfil', () => {
      const prodMods = getDefaultModulesForProfile('productor');
      expect(prodMods).toContain('contratos');
      expect(prodMods).toContain('di');
      expect(prodMods).not.toContain('operaciones_comerciales');

      const transMods = getDefaultModulesForProfile('transportista');
      expect(transMods).toEqual(['di', 'deca', 'flota_transporte']);

      const negMods = getDefaultModulesForProfile('negociante');
      expect(negMods).toContain('archivo_cronologico');

      expect(getDefaultModulesForProfile('chatarreria')).toContain('contratos');
      expect(getDefaultModulesForProfile('completo')).toEqual(ALL_MODULES);
    });

    it('debe retornar vacío si no hay empresa', () => {
      expect(getEffectiveModules(null)).toEqual([]);
    });

    it('debe priorizar modulos_activos explícitos válidos, garantizar archivo_cronologico para negociante y respetar restricción comercial de consultoría', () => {
      const mods = getEffectiveModules({
        perfil_operativo: 'negociante',
        modulos_activos: ['di', 'operaciones_comerciales', 'modulo_inexistente'],
      });
      // UXDEV-06 / UX-24: archivo_cronologico es obligatorio por Art. 64 Ley 7/2022 para negociante
      expect(mods).toEqual(['di', 'operaciones_comerciales', 'archivo_cronologico']);

      const restrictedMods = getEffectiveModules(
        {
          perfil_operativo: 'chatarreria',
          modulos_activos: ['di', 'archivo_cronologico', 'operaciones_comerciales'],
        },
        { canViewCommercial: false }
      );
      expect(restrictedMods).toEqual(['di', 'archivo_cronologico']);
    });

    it('debe usar los módulos por defecto del perfil si modulos_activos está vacío', () => {
      const mods = getEffectiveModules({
        perfil_operativo: 'chatarreria',
        modulos_activos: [],
      });
      expect(mods).toContain('operaciones_comerciales');
      expect(mods).toContain('archivo_cronologico');
    });
  });

  describe('Rutas, etiquetas y homePath', () => {
    it('debe devolver /app como homePath por defecto para transportista y otros perfiles', () => {
      expect(getHomePathForProfile('transportista')).toBe('/app');
      expect(getHomePathForProfile('productor')).toBe('/app');
      expect(getHomePathForProfile('chatarreria')).toBe('/app');
    });

    it('debe devolver etiquetas legibles de módulo', () => {
      expect(getModuleLabel('operaciones_comerciales')).toContain('Operaciones Comerciales');
      expect(getModuleLabel('desconocido' as any)).toBe('desconocido');
    });

    it('debe identificar el módulo requerido por ruta', () => {
      expect(getRequiredModuleForPath('/residuos/operaciones')).toBe('operaciones_comerciales');
      expect(getRequiredModuleForPath('/residuos/operaciones/nueva')).toBe('operaciones_comerciales');
      expect(getRequiredModuleForPath('/transporte')).toBe('flota_transporte');
      expect(getRequiredModuleForPath('/app')).toBeNull();
    });

    it('debe validar canAccessPath correctamente para usuarios y admins', () => {
      const prodMods = getDefaultModulesForProfile('productor');
      expect(canAccessPath('', prodMods, false)).toBe(true);
      expect(canAccessPath('/app', prodMods, false)).toBe(true);
      expect(canAccessPath('/residuos/contratos', prodMods, false)).toBe(true);
      expect(canAccessPath('/residuos/operaciones', prodMods, false)).toBe(false);
      expect(canAccessPath('/residuos/operaciones/nueva', prodMods, false)).toBe(false);
      expect(canAccessPath('/platform-admin', prodMods, false)).toBe(false);
      expect(canAccessPath('/ruta-generica-sin-regla', prodMods, false)).toBe(true);

      // Admin tiene acceso total
      expect(canAccessPath('/platform-admin', [], true)).toBe(true);
      expect(canAccessPath('/residuos/operaciones', [], true)).toBe(true);
    });

    it('debe evaluar permisos de escritura, gestión de empresa y restricciones de rol/transportista', () => {
      expect(canWriteWithMembershipRole('owner')).toBe(true);
      expect(canWriteWithMembershipRole('consultor_admin')).toBe(true);
      expect(canWriteWithMembershipRole('consultor_operador')).toBe(true);
      expect(canWriteWithMembershipRole('lectura')).toBe(false);
      expect(canWriteWithMembershipRole('lectura', true)).toBe(true);
      expect(canWriteWithMembershipRole(undefined)).toBe(true);

      expect(canManageCompanyWithMembershipRole('owner')).toBe(true);
      expect(canManageCompanyWithMembershipRole('consultor_admin')).toBe(true);
      expect(canManageCompanyWithMembershipRole('consultor_operador')).toBe(false);
      expect(canManageCompanyWithMembershipRole('lectura')).toBe(false);
      expect(canManageCompanyWithMembershipRole('lectura', true)).toBe(true);
      expect(canManageCompanyWithMembershipRole(undefined)).toBe(true);

      expect(isWriteOnlyPath('')).toBe(false);
      expect(isWriteOnlyPath('/residuos/contratos')).toBe(false);
      expect(isWriteOnlyPath('/residuos/contratos/nuevo')).toBe(true);
      expect(isWriteOnlyPath('/residuos/operaciones/nueva/')).toBe(true);
      expect(isWriteOnlyPath('/residuos/contratos/12/editar?foo=1')).toBe(true);

      const prodMods = getDefaultModulesForProfile('productor');
      // Rol lectura bloqueado en rutas de creación/edición
      expect(
        canAccessPath('/residuos/contratos/nuevo', prodMods, false, {
          membershipRole: 'lectura',
        })
      ).toBe(false);
      expect(
        canAccessPath('/residuos/contratos', prodMods, false, {
          membershipRole: 'lectura',
        })
      ).toBe(true);

      // Perfil transportista no accede a notificaciones previas ni a nuevo DI
      const transMods = getDefaultModulesForProfile('transportista');
      expect(
        canAccessPath('/residuos/notificaciones-previas', transMods, false, {
          perfilOperativo: 'transportista',
        })
      ).toBe(false);
      expect(
        canAccessPath('/residuos/documentos-identificacion/nuevo', transMods, false, {
          perfilOperativo: 'transportista',
        })
      ).toBe(false);
      expect(
        canAccessPath('/residuos/documentos-identificacion', transMods, false, {
          perfilOperativo: 'transportista',
        })
      ).toBe(true);
    });
  });
});

