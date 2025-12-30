import { createClient } from '@/lib/supabase/client';

export interface MapCollection {
  id: number;
  name: string;
  description: string;
  created_at?: string;
  user_id?: string;
  points_count?: number;
}

export interface MapPoint {
  id: number;
  collection_id: number;
  name: string;
  description: string;
  category: string;
  latitude: number;
  longitude: number;
  address?: string;
  created_at?: string;
}

export const mapCollectionService = {
  // Collections CRUD
  async getCollections(): Promise<MapCollection[]> {
    const supabase = createClient();
    
    try {
      const { data, error } = await supabase
        .from('map_collections')
        .select('*, map_points(count)')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching collections:', error);
        return [];
      }

      return (data || []).map(col => ({
        ...col,
        points_count: col.map_points?.[0]?.count || 0
      }));
    } catch (error) {
      console.error('Error in getCollections:', error);
      return [];
    }
  },

  async createCollection(collection: Omit<MapCollection, 'id' | 'created_at'>): Promise<MapCollection | null> {
    const supabase = createClient();
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('map_collections')
        .insert([{ ...collection, user_id: user?.id }])
        .select()
        .single();

      if (error) {
        console.error('Error creating collection:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in createCollection:', error);
      return null;
    }
  },

  async updateCollection(id: number, collection: Partial<Omit<MapCollection, 'id' | 'created_at'>>): Promise<MapCollection | null> {
    const supabase = createClient();
    
    try {
      const { data, error } = await supabase
        .from('map_collections')
        .update(collection)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating collection:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in updateCollection:', error);
      return null;
    }
  },

  async deleteCollection(id: number): Promise<boolean> {
    const supabase = createClient();
    
    try {
      const { error } = await supabase
        .from('map_collections')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting collection:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in deleteCollection:', error);
      return false;
    }
  },

  // Points CRUD (filtered by collection)
  async getPoints(collectionId: number): Promise<MapPoint[]> {
    const supabase = createClient();
    
    try {
      const { data, error } = await supabase
        .from('map_points')
        .select('*')
        .eq('collection_id', collectionId)
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
  }
};
