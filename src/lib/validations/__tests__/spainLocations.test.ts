import {
  SPAIN_PROVINCES,
  MUNICIPALITIES_BY_PROVINCE,
  normalizeLocationText,
  normalizeProvinceName,
  getProvinceByPostalCode,
  getMunicipalitiesByProvince,
  findProvinceByMunicipality,
  isMunicipalityValidForProvince,
  resolveProvinceChange,
  resolveMunicipalityChange,
} from '../spainLocations';

describe('spainLocations validation & resolution', () => {
  describe('SPAIN_PROVINCES catalog', () => {
    it('contains all 52 official Spanish provinces', () => {
      expect(SPAIN_PROVINCES).toHaveLength(52);
      expect(SPAIN_PROVINCES[0]).toEqual({ code: '01', name: 'Álava' });
      expect(SPAIN_PROVINCES[51]).toEqual({ code: '52', name: 'Melilla' });
    });
  });

  describe('normalizeLocationText', () => {
    it('strips accents, whitespace and converts to lower case', () => {
      expect(normalizeLocationText('  Cádiz  ')).toBe('cadiz');
      expect(normalizeLocationText('SEVILLA')).toBe('sevilla');
      expect(normalizeLocationText('A Coruña')).toBe('a coruna');
      expect(normalizeLocationText('')).toBe('');
    });
  });

  describe('normalizeProvinceName', () => {
    it('normalizes exact names and accents', () => {
      expect(normalizeProvinceName('Madrid')).toBe('Madrid');
      expect(normalizeProvinceName('cadiz')).toBe('Cádiz');
      expect(normalizeProvinceName('CORDOBA')).toBe('Córdoba');
      expect(normalizeProvinceName('Almeria')).toBe('Almería');
    });

    it('supports 2-digit INE codes', () => {
      expect(normalizeProvinceName('11')).toBe('Cádiz');
      expect(normalizeProvinceName('41')).toBe('Sevilla');
      expect(normalizeProvinceName('28')).toBe('Madrid');
      expect(normalizeProvinceName('08')).toBe('Barcelona');
    });

    it('resolves historical or bilingual aliases', () => {
      expect(normalizeProvinceName('vizcaya')).toBe('Bizkaia');
      expect(normalizeProvinceName('guipuzcoa')).toBe('Gipuzkoa');
      expect(normalizeProvinceName('araba')).toBe('Álava');
      expect(normalizeProvinceName('baleares')).toBe('Illes Balears');
      expect(normalizeProvinceName('la coruna')).toBe('A Coruña');
      expect(normalizeProvinceName('gerona')).toBe('Girona');
      expect(normalizeProvinceName('lerida')).toBe('Lleida');
    });

    it('returns null for empty or non-matching input', () => {
      expect(normalizeProvinceName('')).toBeNull();
      expect(normalizeProvinceName(undefined)).toBeNull();
      expect(normalizeProvinceName('Francia')).toBeNull();
    });
  });

  describe('getProvinceByPostalCode', () => {
    it('identifies province from 5-digit or 2-digit postal code', () => {
      expect(getProvinceByPostalCode('11510')).toBe('Cádiz');
      expect(getProvinceByPostalCode('41001')).toBe('Sevilla');
      expect(getProvinceByPostalCode('28001')).toBe('Madrid');
      expect(getProvinceByPostalCode('08001')).toBe('Barcelona');
      expect(getProvinceByPostalCode('29001')).toBe('Málaga');
    });

    it('returns null for invalid or short codes', () => {
      expect(getProvinceByPostalCode('1')).toBeNull();
      expect(getProvinceByPostalCode('')).toBeNull();
      expect(getProvinceByPostalCode('99001')).toBeNull();
      expect(getProvinceByPostalCode(undefined)).toBeNull();
    });
  });

  describe('getMunicipalitiesByProvince', () => {
    it('returns municipalities for a recognized province', () => {
      const cadizMunis = getMunicipalitiesByProvince('Cádiz');
      expect(cadizMunis).toContain('Puerto Real');
      expect(cadizMunis).toContain('Jerez de la Frontera');
      expect(cadizMunis).toContain('Cádiz');
      expect(cadizMunis).not.toContain('Sevilla');
    });

    it('normalizes province input with accents or lower case', () => {
      const sevillaMunis = getMunicipalitiesByProvince('sevilla');
      expect(sevillaMunis).toContain('Dos Hermanas');
      expect(sevillaMunis).toContain('Alcalá de Guadaíra');
    });

    it('returns all unique municipalities when province is undefined or empty', () => {
      const all = getMunicipalitiesByProvince('');
      expect(all.length).toBeGreaterThan(100);
      expect(all).toContain('Madrid');
      expect(all).toContain('Barcelona');
    });
  });

  describe('findProvinceByMunicipality', () => {
    it('finds province by municipality name', () => {
      expect(findProvinceByMunicipality('Puerto Real')).toBe('Cádiz');
      expect(findProvinceByMunicipality('Dos Hermanas')).toBe('Sevilla');
      expect(findProvinceByMunicipality('Vigo')).toBe('Pontevedra');
      expect(findProvinceByMunicipality('Getafe')).toBe('Madrid');
    });

    it('respects current province if municipality exists in it', () => {
      expect(findProvinceByMunicipality('Cádiz', 'Cádiz')).toBe('Cádiz');
      expect(findProvinceByMunicipality('Sevilla', 'Sevilla')).toBe('Sevilla');
    });

    it('returns null if municipality is not found or empty', () => {
      expect(findProvinceByMunicipality('')).toBeNull();
      expect(findProvinceByMunicipality(undefined)).toBeNull();
      expect(findProvinceByMunicipality('LocalidadDesconocida12345')).toBeNull();
    });
  });

  describe('isMunicipalityValidForProvince', () => {
    it('returns true if municipality belongs to the province', () => {
      expect(isMunicipalityValidForProvince('Puerto Real', 'Cádiz')).toBe(true);
      expect(isMunicipalityValidForProvince('Dos Hermanas', 'Sevilla')).toBe(true);
    });

    it('returns false if municipality belongs strictly to another province', () => {
      expect(isMunicipalityValidForProvince('Puerto Real', 'Sevilla')).toBe(false);
      expect(isMunicipalityValidForProvince('Dos Hermanas', 'Cádiz')).toBe(false);
    });

    it('returns true if municipality or province is empty', () => {
      expect(isMunicipalityValidForProvince('', 'Cádiz')).toBe(true);
      expect(isMunicipalityValidForProvince('Puerto Real', '')).toBe(true);
    });

    it('returns true for custom localities not belonging to other provinces', () => {
      expect(isMunicipalityValidForProvince('Polígono Las Salinas', 'Cádiz')).toBe(true);
    });
  });

  describe('resolveProvinceChange', () => {
    it('updates province and retains valid municipality', () => {
      const result = resolveProvinceChange('Cádiz', 'Puerto Real');
      expect(result).toEqual({ provincia: 'Cádiz', municipio: 'Puerto Real' });
    });

    it('resets municipality when switching to a province where it does not belong', () => {
      const result = resolveProvinceChange('Madrid', 'Puerto Real');
      expect(result).toEqual({ provincia: 'Madrid', municipio: '' });
    });

    it('handles empty province', () => {
      const result = resolveProvinceChange('', 'Puerto Real');
      expect(result).toEqual({ provincia: '', municipio: 'Puerto Real' });
    });
  });

  describe('resolveMunicipalityChange', () => {
    it('autocompletes province when typing a recognized municipality', () => {
      const result = resolveMunicipalityChange('Dos Hermanas', '');
      expect(result).toEqual({ provincia: 'Sevilla', municipio: 'Dos Hermanas' });
    });

    it('preserves existing province if municipality is not in catalog', () => {
      const result = resolveMunicipalityChange('Mi Polígono', 'Cádiz');
      expect(result).toEqual({ provincia: 'Cádiz', municipio: 'Mi Polígono' });
    });

    it('clears municipality when empty input', () => {
      const result = resolveMunicipalityChange('', 'Cádiz');
      expect(result).toEqual({ provincia: 'Cádiz', municipio: '' });
    });
  });
});
