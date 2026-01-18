import { createClient } from '@/lib/supabase/client';
import type { WasteType } from '@/types/wasteManagement';

const wasteTypeService = {
    /**
     * Obtiene todos los tipos de residuos (códigos LER) activos
     */
    async getAll(): Promise<WasteType[]> {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('waste_types')
            .select('*')
            .eq('activo', true)
            .order('codigo_ler', { ascending: true });

        if (error) {
            console.error('Error fetching waste types:', error);
            throw error;
        }

        return data || [];
    },

    /**
     * Obtiene un tipo de residuo por su ID
     */
    async getById(id: number): Promise<WasteType | null> {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('waste_types')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            console.error(`Error fetching waste type with id ${id}:`, error);
            return null;
        }

        return data;
    },

    /**
     * Obtiene un tipo de residuo por su código LER
     */
    async getByCodigoLer(codigoLer: string): Promise<WasteType | null> {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('waste_types')
            .select('*')
            .eq('codigo_ler', codigoLer)
            .maybeSingle();

        if (error) {
            console.error(`Error fetching waste type with LER ${codigoLer}:`, error);
            return null;
        }

        return data;
    }
};

export default wasteTypeService;
