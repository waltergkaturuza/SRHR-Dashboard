export interface District {
  id: string;
  name: string;
  coordinates: [number, number];
  type: 'district' | 'clinic' | 'hospital' | 'community_center';
}

export interface HealthDecisionSpace {
  id: string;
  districtId: string;
  name: string;
  type: 'health_center' | 'district_office' | 'clinic' | 'community_forum';
  coordinates: [number, number];
  youthParticipants: number;
  totalParticipants: number;
  year: number;
  description?: string;
}

export interface GeospatialData {
  type: 'Feature' | 'FeatureCollection';
  geometry: {
    type: 'Point' | 'Polygon' | 'LineString' | 'MultiPoint' | 'MultiPolygon' | 'MultiLineString';
    coordinates: number[] | number[][] | number[][][];
  };
  properties: {
    [key: string]: any;
  };
}

export interface ChartData {
  year: number;
  youthParticipants: number;
  totalSpaces: number;
  averagePerSpace: number;
}

export interface FilterState {
  selectedDistricts: string[];
  selectedYear: number;
  selectedType: string | null;
}

