import { createClient } from '@/lib/supabase/client';

export interface PublishedMap {
  id: number;
  name: string;
  description: string;
  slug: string;
  user_id: string;
  center_lat: number;
  center_lng: number;
  zoom: number;
  base_layer: string;
  collection_ids: number[];
  is_published: boolean;
  allow_layer_toggle: boolean;
  show_legend: boolean;
  show_search: boolean;
  custom_style: Record<string, any>;
  view_count: number;
  created_at: string;
  updated_at: string;
}

export const publishedMapService = {
  // Obtener todos los mapas del usuario actual
  async getUserMaps(): Promise<PublishedMap[]> {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('published_maps')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching user maps:', error);
      return [];
    }

    return data || [];
  },

  // Obtener un mapa por ID (solo si es del usuario o está publicado)
  async getMapById(id: number): Promise<PublishedMap | null> {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('published_maps')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching map:', error);
      return null;
    }

    return data;
  },

  // Obtener un mapa por SLUG (público)
  async getMapBySlug(slug: string): Promise<PublishedMap | null> {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('published_maps')
      .select('*')
      .eq('slug', slug)
      .eq('is_published', true)
      .single();

    if (error) {
      console.error('Error fetching map by slug:', error);
      return null;
    }

    // Incrementar contador de vistas
    if (data) {
      await supabase
        .from('published_maps')
        .update({ view_count: data.view_count + 1 })
        .eq('id', data.id);
    }

    return data;
  },

  // Crear un nuevo mapa
  async createMap(map: Omit<PublishedMap, 'id' | 'created_at' | 'updated_at' | 'view_count' | 'slug' | 'user_id'>): Promise<PublishedMap | null> {
    const supabase = createClient();
    
    // Obtener usuario actual
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('User not authenticated');
      return null;
    }

    // Generar slug desde el backend
    const { data: slugData, error: slugError } = await supabase
      .rpc('generate_map_slug', { map_name: map.name });

    if (slugError) {
      console.error('Error generating slug:', slugError);
      return null;
    }

    const mapData = {
      ...map,
      slug: slugData,
      user_id: user.id
    };

    const { data, error } = await supabase
      .from('published_maps')
      .insert([mapData])
      .select()
      .single();

    if (error) {
      console.error('Error creating map:', error);
      return null;
    }

    return data;
  },

  // Actualizar un mapa existente
  async updateMap(id: number, updates: Partial<Omit<PublishedMap, 'id' | 'created_at' | 'updated_at' | 'slug' | 'user_id'>>): Promise<PublishedMap | null> {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('published_maps')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating map:', error);
      return null;
    }

    return data;
  },

  // Publicar/despublicar mapa
  async togglePublish(id: number, isPublished: boolean): Promise<boolean> {
    const supabase = createClient();
    
    const { error } = await supabase
      .from('published_maps')
      .update({ is_published: isPublished })
      .eq('id', id);

    if (error) {
      console.error('Error toggling publish:', error);
      return false;
    }

    return true;
  },

  // Eliminar un mapa
  async deleteMap(id: number): Promise<boolean> {
    const supabase = createClient();
    
    const { error } = await supabase
      .from('published_maps')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting map:', error);
      return false;
    }

    return true;
  },

  // Obtener las colecciones de un mapa con sus datos espaciales
  async getMapCollectionsWithData(collectionIds: number[]): Promise<any[]> {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('map_collections')
      .select('*, spatial_data(*)')
      .in('id', collectionIds);

    if (error) {
      console.error('Error fetching map collections:', error);
      return [];
    }

    return data || [];
  }
};
