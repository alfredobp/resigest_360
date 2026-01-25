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

    production_center_id: z.any()
        .transform((val) => Number(val))
        .refine((val) => !isNaN(val) && val > 0, { message: "Debes seleccionar un centro de producción" }),

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
        .min(3, "Debe tener 3 caracteres (Ej: R13)")
        .regex(/^(R|D)\d{2}$/, "Formato inválido. Debe ser Rxx o Dxx (ej: R01, D15)"),

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
