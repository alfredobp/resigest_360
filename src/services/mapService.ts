import { createClient } from '@/lib/supabase/client';

export interface MapPoint {
  id: number;
  name: string;
  description: string;
  category: string;
  latitude: number;
  longitude: number;
  address?: string;
  created_at?: string;
}

export const mapService = {
  async getPoints(): Promise<MapPoint[]> {
    const supabase = createClient();
    
    try {
      const { data, error } = await supabase
        .from('map_points')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching map points:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getPoints:', error);
      return [];
    }
  },

  async addPoint(point: Omit<MapPoint, 'id' | 'created_at'>): Promise<MapPoint | null> {
    const supabase = createClient();
    
    try {
      const { data, error } = await supabase
        .from('map_points')
        .insert([point])
        .select()
        .single();

      if (error) {
        console.error('Error adding map point:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in addPoint:', error);
      return null;
    }
  },

  async deletePoint(id: number): Promise<boolean> {
    const supabase = createClient();
    
    try {
      const { error } = await supabase
        .from('map_points')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting map point:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in deletePoint:', error);
      return false;
    }
  },

  async updatePoint(id: number, point: Partial<Omit<MapPoint, 'id' | 'created_at'>>): Promise<MapPoint | null> {
    const supabase = createClient();
    
    try {
      const { data, error } = await supabase
        .from('map_points')
        .update(point)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating map point:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in updatePoint:', error);
      return null;
    }
  }
};

// Sample data for Madrid
export const madridSamplePoints: Omit<MapPoint, 'id' | 'created_at'>[] = [
  {
    name: 'Puerta del Sol',
    description: 'Plaza emblemática del centro de Madrid, considerada el kilómetro cero de España.',
    category: 'Monumento',
    latitude: 40.4168,
    longitude: -3.7038,
    address: 'Puerta del Sol, s/n, 28013 Madrid'
  },
  {
    name: 'Palacio Real',
    description: 'Residencia oficial de la familia real española, uno de los palacios más grandes de Europa.',
    category: 'Monumento',
    latitude: 40.4179,
    longitude: -3.7143,
    address: 'Calle de Bailén, s/n, 28071 Madrid'
  },
  {
    name: 'Museo del Prado',
    description: 'Uno de los museos de arte más importantes del mundo, con obras maestras de Velázquez y Goya.',
    category: 'Museo',
    latitude: 40.4138,
    longitude: -3.6921,
    address: 'Paseo del Prado, s/n, 28014 Madrid'
  },
  {
    name: 'Parque del Retiro',
    description: 'Extenso parque público con jardines, monumentos y el famoso estanque para paseos en barca.',
    category: 'Parque',
    latitude: 40.4153,
    longitude: -3.6844,
    address: 'Plaza de la Independencia, 7, 28001 Madrid'
  },
  {
    name: 'Plaza Mayor',
    description: 'Plaza porticada del siglo XVII, centro neurálgico de la vida madrileña.',
    category: 'Plaza',
    latitude: 40.4155,
    longitude: -3.7074,
    address: 'Plaza Mayor, 28012 Madrid'
  },
  {
    name: 'Templo de Debod',
    description: 'Antiguo templo egipcio donado a España, situado en el Parque del Cuartel de la Montaña.',
    category: 'Monumento',
    latitude: 40.4240,
    longitude: -3.7178,
    address: 'Calle Ferraz, 1, 28008 Madrid'
  },
  {
    name: 'Museo Reina Sofía',
    description: 'Museo de arte moderno y contemporáneo, hogar del famoso Guernica de Picasso.',
    category: 'Museo',
    latitude: 40.4079,
    longitude: -3.6942,
    address: 'Calle de Santa Isabel, 52, 28012 Madrid'
  },
  {
    name: 'Gran Vía',
    description: 'Principal vía comercial de Madrid, conocida por sus teatros y edificios históricos.',
    category: 'Calle',
    latitude: 40.4200,
    longitude: -3.7050,
    address: 'Gran Vía, Madrid'
  },
  {
    name: 'Mercado de San Miguel',
    description: 'Mercado gourmet en estructura de hierro del siglo XX, con productos gastronómicos selectos.',
    category: 'Mercado',
    latitude: 40.4154,
    longitude: -3.7089,
    address: 'Plaza de San Miguel, s/n, 28005 Madrid'
  },
  {
    name: 'Santiago Bernabéu',
    description: 'Estadio del Real Madrid, uno de los más emblemáticos del fútbol mundial.',
    category: 'Estadio',
    latitude: 40.4530,
    longitude: -3.6884,
    address: 'Av. de Concha Espina, 1, 28036 Madrid'
  }
];
