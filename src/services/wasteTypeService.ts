import { createClient } from '@/lib/supabase/client';
import type { WasteType } from '@/types/wasteManagement';
import defaultLerCodes from '@/data/lerCodes.json';

const fallbackLerCodes: WasteType[] = (defaultLerCodes as any[]).map((item, idx) => ({
    id: idx + 1,
    codigo_ler: item.codigo_ler,
    descripcion: item.descripcion,
    categoria: item.categoria,
    estado: item.estado,
    operaciones_permitidas: item.operaciones_permitidas || ['R13'],
    activo: true,
    peligroso: item.peligroso,
    capitulo_codigo: item.capitulo_codigo,
    capitulo_titulo: item.capitulo_titulo,
    subcapitulo_codigo: item.subcapitulo_codigo,
    subcapitulo_titulo: item.subcapitulo_titulo,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
}));

let memoryCache: WasteType[] | null = null;

const wasteTypeService = {
    /**
     * Obtiene todos los tipos de residuos (códigos LER) activos
     */
    async getAll(): Promise<WasteType[]> {
        if (memoryCache && memoryCache.length > 0) {
            return memoryCache;
        }

        try {
            const supabase = createClient();
            const { data, error } = await supabase
                .from('waste_types')
                .select('*')
                .eq('activo', true)
                .order('codigo_ler', { ascending: true });

            if (!error && data && data.length > 50) {
                memoryCache = data;
                return data;
            }

            // Si la base de datos aún no tiene todos los códigos LER migrados,
            // devolver la lista oficial precargada para que la app funcione al 100%
            memoryCache = fallbackLerCodes;
            return fallbackLerCodes;
        } catch (err) {
            console.warn('Error fetching waste types from Supabase, using standard LER catalog:', err);
            memoryCache = fallbackLerCodes;
            return fallbackLerCodes;
        }
    },

    /**
     * Obtiene un tipo de residuo por su ID
     */
    async getById(id: number): Promise<WasteType | null> {
        const all = await this.getAll();
        return all.find(w => w.id === id) || null;
    },

    /**
     * Obtiene un tipo de residuo por su código LER
     */
    async getByCodigoLer(codigoLer: string): Promise<WasteType | null> {
        if (!codigoLer) return null;
        const norm = codigoLer.trim().replace(/\s+/g, ' ');
        const all = await this.getAll();
        return all.find(w => w.codigo_ler.trim().replace(/\s+/g, ' ') === norm) || null;
    },

    /**
     * Búsqueda predictiva rápida por código o texto de descripción
     */
    async search(query: string, limit = 50): Promise<WasteType[]> {
        const all = await this.getAll();
        if (!query || !query.trim()) {
            return all.slice(0, limit);
        }

        const q = query.toLowerCase().trim();
        return all
            .filter(w =>
                w.codigo_ler.toLowerCase().includes(q) ||
                w.descripcion.toLowerCase().includes(q) ||
                (w.capitulo_titulo && w.capitulo_titulo.toLowerCase().includes(q)) ||
                (w.subcapitulo_titulo && w.subcapitulo_titulo.toLowerCase().includes(q))
            )
            .slice(0, limit);
    }
};

export default wasteTypeService;
