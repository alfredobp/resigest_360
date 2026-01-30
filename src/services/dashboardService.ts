// =====================================================
// DASHBOARD SERVICE
// Servicio para obtener estadísticas del dashboard
// =====================================================

import { createClient } from '@/lib/supabase/client';
import type { IdentificationDocument, Carrier, TreatmentManager } from '@/types/wasteManagement';

const supabase = createClient();

export const dashboardService = {
    /**
     * Obtener estadísticas generales para el dashboard
     */
    async getDashboardStats() {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Usuario no autenticado');

        // 1. Contar Gestores
        const { count: gestoresCount } = await supabase
            .from('treatment_managers')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .eq('activo', true);

        // 2. Contar Transportistas
        const { count: carriersCount } = await supabase
            .from('carriers')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .eq('activo', true);

        // 3. Contar DIs (Documentos de Identificación)
        const { count: diCount } = await supabase
            .from('identification_documents')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id);

        // 4. Calcular cantidad total de residuos (en Toneladas aprox)
        // Nota: Para una suma real exacta necesitaríamos normalizar unidades en SQL o aquí
        const { data: diData } = await supabase
            .from('identification_documents')
            .select('cantidad, unidad')
            .eq('user_id', user.id)
            .eq('estado', 'completado');

        let totalWeightTonnes = 0;
        diData?.forEach(di => {
            let weight = di.cantidad || 0;
            if (di.unidad === 'kg') weight = weight / 1000;
            else if (di.unidad === 'litros') weight = weight / 1000; // Simplificación
            // 'toneladas' ya está bien
            // 'm3' y 'unidades' son difíciles de convertir sin densidad
            totalWeightTonnes += weight;
        });

        return {
            suppliers: (gestoresCount || 0) + (carriersCount || 0),
            gestores: gestoresCount || 0,
            carriers: carriersCount || 0,
            diTotal: diCount || 0,
            totalWasteTonnes: totalWeightTonnes.toFixed(2),
        };
    },

    /**
     * Obtener datos para el gráfico de producción mensual
     */
    async getMonthlyWasteData() {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Usuario no autenticado');

        const { data } = await supabase
            .from('identification_documents')
            .select('cantidad, unidad, fecha_documento')
            .eq('user_id', user.id)
            .eq('estado', 'completado')
            .order('fecha_documento', { ascending: true });

        const monthlyData: { [key: string]: number } = {};
        const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

        data?.forEach(di => {
            const date = new Date(di.fecha_documento);
            const monthLabel = monthNames[date.getMonth()];

            let weight = di.cantidad || 0;
            if (di.unidad === 'kg' || di.unidad === 'litros') weight = weight / 1000;

            monthlyData[monthLabel] = (monthlyData[monthLabel] || 0) + weight;
        });

        return monthNames.map(name => ({
            name,
            value: parseFloat((monthlyData[name] || 0).toFixed(2))
        }));
    },

    /**
     * Obtener actividades recientes
     */
    async getRecentActivity() {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Usuario no autenticado');

        const { data: recentDIs } = await supabase
            .from('identification_documents')
            .select('id, numero_documento, fecha_documento, productor_razon_social, gestor_razon_social, estado')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(5);

        return recentDIs || [];
    }
};

export default dashboardService;
