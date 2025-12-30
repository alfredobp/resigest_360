import { createClient } from '@/lib/supabase/client';

export interface Project {
  id: number;
  name: string;
  description: string;
  show: boolean;
  photo?: string;
  created_at?: string;
  user_id?: string;
  collections_count?: number;
}

export interface MapCollection {
  id: number;
  project_id: number;
  name: string;
  description: string;
  photo?: string;
  created_at?: string;
  user_id?: string;
  spatial_data_count?: number;
  spatial_data?: SpatialData[];
  color?: string;
}

export interface SpatialData {
  id: number;
  collection_id: number;
  name: string;
  description: string;
  category: string;
  geometry_type: 'point' | 'polygon' | 'line' | 'circle';
  geometry: {
    type: string;
    coordinates: number[] | number[][] | number[][][];
  };
  latitude?: number;
  longitude?: number;
  address?: string;
  photo?: string;
  image?: string;
  created_at?: string;
}

// Alias for backwards compatibility
export type MapPoint = SpatialData;

export const projectService = {
  // Projects CRUD
  async getProjects(): Promise<Project[]> {
    const supabase = createClient();
    
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*, map_collections(count)')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching projects:', error);
        return [];
      }

      return (data || []).map(proj => ({
        ...proj,
        collections_count: proj.map_collections?.[0]?.count || 0
      }));
    } catch (error) {
      console.error('Error in getProjects:', error);
      return [];
    }
  },

  async createProject(project: Omit<Project, 'id' | 'created_at'>): Promise<Project | null> {
    const supabase = createClient();
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('projects')
        .insert([{ ...project, user_id: user?.id }])
        .select()
        .single();

      if (error) {
        console.error('Error creating project:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in createProject:', error);
      return null;
    }
  },

  async updateProject(id: number, project: Partial<Omit<Project, 'id' | 'created_at'>>): Promise<Project | null> {
    const supabase = createClient();
    
    try {
      // Remove computed fields and relations before update
      const { collections_count, user_id, map_collections, ...updateData } = project as any;
      
      const { data, error } = await supabase
        .from('projects')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating project:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in updateProject:', error);
      return null;
    }
  },

  async deleteProject(id: number): Promise<boolean> {
    const supabase = createClient();
    
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting project:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in deleteProject:', error);
      return false;
    }
  },

  // Collections CRUD (filtered by project)
  async getCollections(projectId: number): Promise<MapCollection[]> {
    const supabase = createClient();
    
    try {
      // Try with spatial_data first
      let { data, error } = await supabase
        .from('map_collections')
        .select('*, spatial_data(count)')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      // If spatial_data doesn't exist, try map_points
      if (error && error.message?.includes('spatial_data')) {
        const result = await supabase
          .from('map_collections')
          .select('*, map_points(count)')
          .eq('project_id', projectId)
          .order('created_at', { ascending: false });
        
        data = result.data;
        error = result.error;
        
        // Convert to new format
        if (data) {
          return (data || []).map((col: any) => ({
            ...col,
            spatial_data_count: col.map_points?.[0]?.count || 0
          }));
        }
      }

      if (error) {
        console.error('Error fetching collections:', error);
        return [];
      }

      return (data || []).map(col => ({
        ...col,
        spatial_data_count: col.spatial_data?.[0]?.count || 0
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
      // Remove computed fields before update
      const { spatial_data_count, points_count, user_id, ...updateData } = collection as any;
      
      const { data, error } = await supabase
        .from('map_collections')
        .update(updateData)
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

  // Spatial Data CRUD (filtered by collection)
  async getSpatialData(collectionId: number): Promise<SpatialData[]> {
    const supabase = createClient();
    
    try {
      // Try spatial_data first (new table)
      let { data, error } = await supabase
        .from('spatial_data')
        .select('*')
        .eq('collection_id', collectionId)
        .order('created_at', { ascending: false });

      // If table doesn't exist, try map_points (old table)
      if (error && error.message?.includes('does not exist')) {
        console.warn('Table spatial_data does not exist, trying map_points...');
        const result = await supabase
          .from('map_points')
          .select('*')
          .eq('collection_id', collectionId)
          .order('created_at', { ascending: false });
        
        data = result.data;
        error = result.error;
        
        // Convert old format to new format
        if (data) {
          data = data.map((point: any) => ({
            ...point,
            geometry_type: point.geometry_type || 'point',
            geometry: point.geometry || {
              type: 'Point',
              coordinates: [point.longitude, point.latitude]
            }
          }));
        }
      }

      if (error) {
        console.error('Error fetching spatial data:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getSpatialData:', error);
      return [];
    }
  },

  async addSpatialData(spatialData: Omit<SpatialData, 'id' | 'created_at'>): Promise<SpatialData | null> {
    const supabase = createClient();
    
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      // Add user_id to spatial data
      const dataWithUserId = {
        ...spatialData,
        user_id: user?.id
      };
      
      console.log('Adding spatial data:', dataWithUserId);
      
      // Try spatial_data first (new table)
      let { data, error } = await supabase
        .from('spatial_data')
        .insert([dataWithUserId])
        .select()
        .single();

      // If table doesn't exist, try map_points (old table)
      if (error && error.message?.includes('does not exist')) {
        console.warn('Table spatial_data does not exist, trying map_points...');
        const result = await supabase
          .from('map_points')
          .insert([dataWithUserId])
          .select()
          .single();
        
        data = result.data;
        error = result.error;
      }

      if (error) {
        console.error('Error adding spatial data:', error);
        return null;
      }

      console.log('Spatial data added successfully:', data);
      return data;
    } catch (error) {
      console.error('Error in addSpatialData:', error);
      return null;
    }
  },

  async updateSpatialData(id: number, spatialData: Partial<Omit<SpatialData, 'id' | 'created_at'>>): Promise<SpatialData | null> {
    const supabase = createClient();
    
    try {
      // Try spatial_data first (new table)
      let { data, error } = await supabase
        .from('spatial_data')
        .update(spatialData)
        .eq('id', id)
        .select()
        .single();

      // If table doesn't exist, try map_points (old table)
      if (error && error.message?.includes('does not exist')) {
        const result = await supabase
          .from('map_points')
          .update(spatialData)
          .eq('id', id)
          .select()
          .single();
        
        data = result.data;
        error = result.error;
      }

      if (error) {
        console.error('Error updating spatial data:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in updateSpatialData:', error);
      return null;
    }
  },

  async deleteSpatialData(id: number): Promise<boolean> {
    const supabase = createClient();
    
    try {
      // Try spatial_data first (new table)
      let { error } = await supabase
        .from('spatial_data')
        .delete()
        .eq('id', id);

      // If table doesn't exist, try map_points (old table)
      if (error && error.message?.includes('does not exist')) {
        const result = await supabase
          .from('map_points')
          .delete()
          .eq('id', id);
        
        error = result.error;
      }

      if (error) {
        console.error('Error deleting spatial data:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in deleteSpatialData:', error);
      return false;
    }
  },

  // Backwards compatibility aliases
  getPoints(collectionId: number) {
    return this.getSpatialData(collectionId);
  },
  
  async addPoint(point: any) {
    // If geometry_type is already set, use it (for polygons, etc.)
    if (point.geometry_type && point.geometry) {
      return this.addSpatialData(point);
    }
    
    // Otherwise, convert old point format to spatial data (backwards compatibility)
    const spatialData: Omit<SpatialData, 'id' | 'created_at'> = {
      ...point,
      geometry_type: 'point',
      geometry: {
        type: 'Point',
        coordinates: [point.longitude, point.latitude]
      }
    };
    return this.addSpatialData(spatialData);
  },
  
  async updatePoint(id: number, point: any) {
    if (point.latitude !== undefined && point.longitude !== undefined) {
      point.geometry = {
        type: 'Point',
        coordinates: [point.longitude, point.latitude]
      };
      point.geometry_type = 'point';
    }
    return this.updateSpatialData(id, point);
  },
  
  deletePoint(id: number) {
    return this.deleteSpatialData(id);
  },

  // Get full tree structure
  async getProjectTree(projectId: number): Promise<{
    project: Project | null;
    collections: { collection: MapCollection; points: MapPoint[] }[];
  }> {
    const supabase = createClient();
    
    try {
      // Get project
      const { data: project } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();

      // Get collections
      const { data: collections } = await supabase
        .from('map_collections')
        .select('*')
        .eq('project_id', projectId);

      // Get points for each collection
      const collectionsWithPoints = await Promise.all(
        (collections || []).map(async (collection) => {
          const { data: points } = await supabase
            .from('map_points')
            .select('*')
            .eq('collection_id', collection.id);

          return {
            collection,
            points: points || []
          };
        })
      );

      return {
        project,
        collections: collectionsWithPoints
      };
    } catch (error) {
      console.error('Error in getProjectTree:', error);
      return {
        project: null,
        collections: []
      };
    }
  }
};
