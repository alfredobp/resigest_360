import { siraValidationSchema } from '../sira';

describe('siraValidationSchema - Validaciones normativas SIRA', () => {
  const validBasePayload = {
    numero_documento: 'DI-2026-0001',
    fecha_documento: '2026-10-24',
    production_center_id: 1,

    productor_nima: '2800000001',
    productor_cif: 'B12345678',
    productor_razon_social: 'Productor S.L.',
    productor_direccion: 'Calle Industria 1',
    productor_municipio: 'Madrid',
    productor_provincia: 'Madrid',

    gestor_nima: '2800000002',
    gestor_cif: 'A87654321',
    gestor_razon_social: 'Gestora de Residuos S.A.',
    gestor_direccion: 'Avenida Reciclaje 100',
    gestor_municipio: 'Pinto',
    gestor_provincia: 'Madrid',

    codigo_ler: '15 01 01',
    descripcion_residuo: 'Envases de papel y cartón',
    operacion_tratamiento: 'R03',
    peligrosidad: 'no-peligroso',
    estado_fisico: 'solido',
    cantidad: 250.5,
    unidad: 'kg',
  };

  describe('Validación de casos válidos (Happy Path)', () => {
    it('debe validar correctamente un documento sin transportista asignado', () => {
      const result = siraValidationSchema.safeParse(validBasePayload);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.numero_documento).toBe('DI-2026-0001');
        expect(result.data.cantidad).toBe(250.5);
      }
    });

    it('debe convertir y validar la cantidad numérica enviada como string', () => {
      const payloadWithStringQuantity = {
        ...validBasePayload,
        cantidad: '500.75',
      };

      const result = siraValidationSchema.safeParse(payloadWithStringQuantity);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.cantidad).toBe(500.75);
      }
    });

    it('debe validar correctamente con transportista completo', () => {
      const payloadWithCarrier = {
        ...validBasePayload,
        transportista_cif: 'B99999999',
        transportista_razon_social: 'Logística Verde S.L.',
        transportista_nima: '2800000003',
        transportista_direccion: 'Carretera Norte Km 5',
        transportista_municipio: 'Alcobendas',
        transportista_provincia: 'Madrid',
        transportista_codigo_postal: '28100',
      };

      const result = siraValidationSchema.safeParse(payloadWithCarrier);

      expect(result.success).toBe(true);
    });
  });

  describe('Campos obligatorios y helper requiredString', () => {
    const requiredFields = [
      'numero_documento',
      'fecha_documento',
      'productor_nima',
      'productor_cif',
      'productor_razon_social',
      'productor_direccion',
      'productor_municipio',
      'productor_provincia',
      'gestor_cif',
      'gestor_razon_social',
      'gestor_nima',
      'gestor_direccion',
      'gestor_municipio',
      'gestor_provincia',
      'codigo_ler',
      'descripcion_residuo',
    ] as const;

    requiredFields.forEach((field) => {
      it(`debe fallar si ${field} está ausente, vacío o solo contiene espacios`, () => {
        const payloadMissing = { ...validBasePayload, [field]: undefined };
        const resultMissing = siraValidationSchema.safeParse(payloadMissing);
        expect(resultMissing.success).toBe(false);

        const payloadWhitespace = { ...validBasePayload, [field]: '    ' };
        const resultWhitespace = siraValidationSchema.safeParse(payloadWhitespace);
        expect(resultWhitespace.success).toBe(false);

        const payloadNull = { ...validBasePayload, [field]: null };
        const resultNull = siraValidationSchema.safeParse(payloadNull);
        expect(resultNull.success).toBe(false);
      });
    });
  });

  describe('Operación de tratamiento (operacion_tratamiento)', () => {
    it.each(['R1', 'R13', 'r01', 'D1', 'D10', 'd5'])(
      'debe aceptar código de operación válido: %s',
      (code) => {
        const result = siraValidationSchema.safeParse({
          ...validBasePayload,
          operacion_tratamiento: code,
        });
        expect(result.success).toBe(true);
      }
    );

    it('debe fallar si tiene menos de 2 caracteres', () => {
      const result = siraValidationSchema.safeParse({
        ...validBasePayload,
        operacion_tratamiento: 'R',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('al menos 2 caracteres');
      }
    });

    it.each(['X01', '12', 'R123', 'D'])(
      'debe rechazar código de operación inválido: %s',
      (code) => {
        const result = siraValidationSchema.safeParse({
          ...validBasePayload,
          operacion_tratamiento: code,
        });
        expect(result.success).toBe(false);
      }
    );
  });

  describe('Peligrosidad, estado físico y unidades', () => {
    it.each(['peligroso', 'no-peligroso'])('debe aceptar valor válido de peligrosidad: %s', (val) => {
      const result = siraValidationSchema.safeParse({
        ...validBasePayload,
        peligrosidad: val,
      });
      expect(result.success).toBe(true);
    });

    it('debe rechazar valores inválidos de peligrosidad', () => {
      const result = siraValidationSchema.safeParse({
        ...validBasePayload,
        peligrosidad: 'desconocido',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Selecciona peligrosidad');
      }
    });

    it.each(['solido', 'liquido', 'pastoso', 'gaseoso'])(
      'debe aceptar estado físico válido: %s',
      (estado) => {
        const result = siraValidationSchema.safeParse({
          ...validBasePayload,
          estado_fisico: estado,
        });
        expect(result.success).toBe(true);
      }
    );

    it('debe rechazar un estado físico inválido', () => {
      const result = siraValidationSchema.safeParse({
        ...validBasePayload,
        estado_fisico: 'plasma',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Selecciona estado físico');
      }
    });

    it.each(['kg', 'toneladas', 'litros', 'm3', 'unidades'])(
      'debe aceptar unidad válida: %s',
      (unidad) => {
        const result = siraValidationSchema.safeParse({
          ...validBasePayload,
          unidad,
        });
        expect(result.success).toBe(true);
      }
    );

    it('debe rechazar una unidad inválida', () => {
      const result = siraValidationSchema.safeParse({
        ...validBasePayload,
        unidad: 'gramos',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Selecciona una unidad');
      }
    });

    it.each([0, -10, 'abc', NaN, null])(
      'debe rechazar cantidades inválidas: %s',
      (cant) => {
        const result = siraValidationSchema.safeParse({
          ...validBasePayload,
          cantidad: cant,
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe(
            'La cantidad debe ser un número válido mayor que 0'
          );
        }
      }
    );
  });

  describe('Regla normativa LER con asterisco (*)', () => {
    it('debe fallar si el código LER contiene asterisco (*) y la peligrosidad es no-peligroso', () => {
      const result = siraValidationSchema.safeParse({
        ...validBasePayload,
        codigo_ler: '13 02 05*',
        peligrosidad: 'no-peligroso',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        const issue = result.error.issues.find((i) => i.path.includes('peligrosidad'));
        expect(issue).toBeDefined();
        expect(issue?.message).toBe(
          'El código LER con asterisco (*) corresponde a un residuo peligroso obligatorio.'
        );
      }
    });

    it('debe aceptar código LER con asterisco (*) si se marca explícitamente como peligroso', () => {
      const result = siraValidationSchema.safeParse({
        ...validBasePayload,
        codigo_ler: '13 02 05*',
        peligrosidad: 'peligroso',
      });

      expect(result.success).toBe(true);
    });
  });

  describe('Validación condicional del transportista', () => {
    it('debe fallar si se incluye CIF de transportista pero falta NIMA', () => {
      const result = siraValidationSchema.safeParse({
        ...validBasePayload,
        transportista_cif: 'B11111111',
        transportista_direccion: 'Calle Test 1',
        transportista_municipio: 'Madrid',
        transportista_provincia: 'Madrid',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        const issue = result.error.issues.find((i) => i.path.includes('transportista_nima'));
        expect(issue?.message).toBe('El NIMA del transportista es obligatorio para SIRA');
      }
    });

    it('debe fallar si se incluye CIF de transportista pero falta dirección', () => {
      const result = siraValidationSchema.safeParse({
        ...validBasePayload,
        transportista_cif: 'B11111111',
        transportista_nima: '2800000004',
        transportista_direccion: '   ',
        transportista_municipio: 'Madrid',
        transportista_provincia: 'Madrid',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        const issue = result.error.issues.find((i) => i.path.includes('transportista_direccion'));
        expect(issue?.message).toBe('La dirección del transportista es obligatoria');
      }
    });

    it('debe fallar si se incluye razón social de transportista pero falta municipio', () => {
      const result = siraValidationSchema.safeParse({
        ...validBasePayload,
        transportista_razon_social: 'TransLogística Express',
        transportista_nima: '2800000004',
        transportista_direccion: 'Calle Test 1',
        transportista_provincia: 'Madrid',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        const issue = result.error.issues.find((i) => i.path.includes('transportista_municipio'));
        expect(issue?.message).toBe('El municipio del transportista es obligatorio');
      }
    });

    it('debe fallar si se incluye razón social de transportista pero falta provincia', () => {
      const result = siraValidationSchema.safeParse({
        ...validBasePayload,
        transportista_razon_social: 'TransLogística Express',
        transportista_nima: '2800000004',
        transportista_direccion: 'Calle Test 1',
        transportista_municipio: 'Madrid',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        const issue = result.error.issues.find((i) => i.path.includes('transportista_provincia'));
        expect(issue?.message).toBe('La provincia del transportista es obligatoria');
      }
    });

    it('debe ser válido si se incluye solo razón social con todos los datos requeridos de transporte', () => {
      const result = siraValidationSchema.safeParse({
        ...validBasePayload,
        transportista_razon_social: 'TransLogística Express',
        transportista_nima: '2800000004',
        transportista_direccion: 'Calle Test 1',
        transportista_municipio: 'Madrid',
        transportista_provincia: 'Madrid',
      });

      expect(result.success).toBe(true);
    });
  });
});
