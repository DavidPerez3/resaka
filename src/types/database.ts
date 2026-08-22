export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string | null;
          full_name: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          username?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          username?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      venues: {
        Row: {
          id: string;
          creator_id: string | null;
          name: string;
          latitude: number;
          longitude: number;
          address: string | null;
          category: string;
          source: string;
          external_id: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          creator_id?: string | null;
          name: string;
          latitude: number;
          longitude: number;
          address?: string | null;
          category: string;
          source: string;
          external_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          creator_id?: string | null;
          name?: string;
          latitude?: number;
          longitude?: number;
          address?: string | null;
          category?: string;
          source?: string;
          external_id?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      outings: {
        Row: {
          id: string;
          owner_id: string;
          title: string | null;
          description: string | null;
          started_at: string;
          ended_at: string | null;
          status: string;
          city: string | null;
          current_venue_id: string | null;
          distance_meters: number;
          visibility: string;
          drink_visibility: string;
          map_visibility: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          owner_id: string;
          title?: string | null;
          description?: string | null;
          started_at: string;
          ended_at?: string | null;
          status: string;
          city?: string | null;
          current_venue_id?: string | null;
          distance_meters?: number;
          visibility?: string;
          drink_visibility?: string;
          map_visibility?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string;
          title?: string | null;
          description?: string | null;
          started_at?: string;
          ended_at?: string | null;
          status?: string;
          city?: string | null;
          current_venue_id?: string | null;
          distance_meters?: number;
          visibility?: string;
          drink_visibility?: string;
          map_visibility?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'outings_current_venue_id_fkey';
            columns: ['current_venue_id'];
            isOneToOne: false;
            referencedRelation: 'venues';
            referencedColumns: ['id'];
          },
        ];
      };
      outing_stops: {
        Row: {
          id: string;
          outing_id: string;
          venue_id: string;
          arrived_at: string;
          departed_at: string | null;
          order_index: number;
        };
        Insert: {
          id: string;
          outing_id: string;
          venue_id: string;
          arrived_at: string;
          departed_at?: string | null;
          order_index: number;
        };
        Update: {
          id?: string;
          outing_id?: string;
          venue_id?: string;
          arrived_at?: string;
          departed_at?: string | null;
          order_index?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'outing_stops_outing_id_fkey';
            columns: ['outing_id'];
            isOneToOne: false;
            referencedRelation: 'outings';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'outing_stops_venue_id_fkey';
            columns: ['venue_id'];
            isOneToOne: false;
            referencedRelation: 'venues';
            referencedColumns: ['id'];
          },
        ];
      };
      drinks: {
        Row: {
          id: string;
          user_id: string;
          outing_id: string;
          venue_id: string | null;
          type: string;
          beer_size: string | null;
          subtype: string | null;
          notes: string | null;
          consumed_at: string;
          latitude: number | null;
          longitude: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          user_id: string;
          outing_id: string;
          venue_id?: string | null;
          type: string;
          beer_size?: string | null;
          subtype?: string | null;
          notes?: string | null;
          consumed_at: string;
          latitude?: number | null;
          longitude?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          outing_id?: string;
          venue_id?: string | null;
          type?: string;
          beer_size?: string | null;
          subtype?: string | null;
          notes?: string | null;
          consumed_at?: string;
          latitude?: number | null;
          longitude?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'drinks_outing_id_fkey';
            columns: ['outing_id'];
            isOneToOne: false;
            referencedRelation: 'outings';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'drinks_venue_id_fkey';
            columns: ['venue_id'];
            isOneToOne: false;
            referencedRelation: 'venues';
            referencedColumns: ['id'];
          },
        ];
      };
      route_points: {
        Row: {
          id: number;
          outing_id: string;
          user_id: string;
          point_index: number;
          latitude: number;
          longitude: number;
          accuracy: number | null;
          altitude: number | null;
          speed: number | null;
          recorded_at: string;
        };
        Insert: {
          id?: number;
          outing_id: string;
          user_id: string;
          point_index: number;
          latitude: number;
          longitude: number;
          accuracy?: number | null;
          altitude?: number | null;
          speed?: number | null;
          recorded_at: string;
        };
        Update: {
          id?: number;
          outing_id?: string;
          user_id?: string;
          point_index?: number;
          latitude?: number;
          longitude?: number;
          accuracy?: number | null;
          altitude?: number | null;
          speed?: number | null;
          recorded_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'route_points_outing_id_fkey';
            columns: ['outing_id'];
            isOneToOne: false;
            referencedRelation: 'outings';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
