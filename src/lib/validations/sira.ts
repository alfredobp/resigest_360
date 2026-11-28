import { z } from 'zod';

// Helper robusto para strings obligatorios con mensaje personalizado en español
// Evita errores "expected string, received undefined" convirtiendo todo a string primero
const requiredString = (message: string) =>
    z.any()
        .transform(val => (val === undefined || val === null) ? '' : String(val))
        .refine(val => val.trim().length > 0, { message });

// Esquema de validación simplificado compatible
export const siraValidationSchema = z.object({
    numero_documento: requiredString("El número de documento es obligatorio"),
    fecha_documento: requiredString("La fecha del documento es obligatoria"),

    production_center_id: z.any().optional(),

    productor_nima: requiredString("El NIMA del productor es obligatorio"),
    productor_cif: requiredString("El CIF del productor es obligatorio"),
    productor_razon_social: requiredString("La Razón Social del productor es obligatoria"),
    productor_direccion: requiredString("La dirección del productor es obligatoria"),
    productor_municipio: requiredString("El municipio del productor es obligatorio"),
    productor_provincia: requiredString("La provincia del productor es obligatoria"),

    gestor_cif: requiredString("El CIF del gestor es obligatorio"),
    gestor_razon_social: requiredString("La razón social del gestor es obligatoria"),
    gestor_nima: requiredString("El NIMA del gestor es obligatorio"),
    gestor_direccion: requiredString("La dirección del gestor es obligatoria"),
    gestor_municipio: requiredString("El municipio del gestor es obligatorio"),
    gestor_provincia: requiredString("La provincia del gestor es obligatoria"),

    codigo_ler: requiredString("El Código LER es obligatorio"),
    descripcion_residuo: requiredString("La descripción es obligatoria"),

    operacion_tratamiento: z.string()
        .min(2, "Debe tener al menos 2 caracteres (Ej: R1 o R13)")
        .regex(/^(?:[RD][1-9]|(?:R|D)(?:0[1-9]|1[0-5])(?:\d{2})?)$/i, "Formato inválido. Debe ser R01–R15 o D01–D15 (ej: R1, R01, R13, R14, R15, R1201, D10)"),

    peligrosidad: z.any().refine(val => val === 'peligroso' || val === 'no-peligroso', "Selecciona peligrosidad"),
    estado_fisico: z.any().refine(val => ['solido', 'liquido', 'pastoso', 'gaseoso'].includes(val), "Selecciona estado físico"),

    cantidad: z.any()
        .transform((val) => Number(val))
        .refine((val) => !isNaN(val) && val > 0, { message: "La cantidad debe ser un número válido mayor que 0" }),

    unidad: z.any().refine(val => ['kg', 'toneladas', 'litros', 'm3', 'unidades'].includes(val), "Selecciona una unidad"),

    // Transportista
    transportista_cif: z.string().optional(),
    transportista_razon_social: z.string().optional(),

    transportista_nima: z.string().optional(),
    transportista_direccion: z.string().optional(),
    transportista_municipio: z.string().optional(),
    transportista_provincia: z.string().optional(),
    transportista_codigo_postal: z.string().optional(),

}).superRefine((data, ctx) => {
    // Validar peligrosidad coherente con LER: si el LER contiene '*', es obligatoriamente peligroso
    if (data.codigo_ler && typeof data.codigo_ler === 'string' && data.codigo_ler.includes('*')) {
        if (data.peligrosidad !== 'peligroso') {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "El código LER con asterisco (*) corresponde a un residuo peligroso obligatorio.",
                path: ["peligrosidad"]
            });
        }
    }
    if (data.transportista_cif || data.transportista_razon_social) {
        if (!data.transportista_nima || String(data.transportista_nima).trim() === '') {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "El NIMA del transportista es obligatorio para SIRA",
                path: ["transportista_nima"]
            });
        }
        if (!data.transportista_direccion || String(data.transportista_direccion).trim() === '') {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "La dirección del transportista es obligatoria",
                path: ["transportista_direccion"]
            });
        }
        if (!data.transportista_municipio) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "El municipio del transportista es obligatorio", path: ["transportista_municipio"] });
        }
        if (!data.transportista_provincia) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "La provincia del transportista es obligatoria", path: ["transportista_provincia"] });
        }
    }
});

/**
 * Detecta cualquier SOAP Fault independientemente del prefijo de namespace
 * (p. ej. <soapenv:Fault>, <ns2:Fault>, <S:Fault>, <SOAP-ENV:Fault>, <Fault>).
 */
export function hasSiraSoapFault(responseText: string): boolean {
    if (!responseText) return false;
    return /<([a-zA-Z0-9_-]+:)?Fault\b/i.test(responseText);
}

/**
 * Determina si la respuesta XML de SIRA pasó al 100% la validación de esquema XSD (E3L v3.3)
 * y únicamente contiene avisos/errores censales de RPGR en entorno de pruebas:
 * - JA000002: NIMA de prueba no inscrito/autorizado en el censo real de la Junta.
 * - JA000027: NT de prueba asociada no figura como presentada en el censo real.
 */
export function isSiraTestModeCensusOnlyError(responseText: string): boolean {
    if (!responseText) return false;
    if (
        hasSiraSoapFault(responseText) ||
        responseText.includes('SAXParseException') ||
        responseText.includes('cvc-') ||
        responseText.includes('JA000026')
    ) {
        return false;
    }
    const codeMatches = [...responseText.matchAll(/<resultWrong\s+code="([^"]+)"/g)];
    if (codeMatches.length === 0) return false;
    return codeMatches.every((m) => m[1] === 'JA000002' || m[1] === 'JA000027');
}
