import { create } from 'zustand';
import { District, HealthDecisionSpace, FilterState } from '../types';

interface DashboardStore {
  districts: District[];
  healthSpaces: HealthDecisionSpace[];
  filterState: FilterState;
  uploadedData: any[];
  setDistricts: (districts: District[]) => void;
  setHealthSpaces: (spaces: HealthDecisionSpace[]) => void;
  setFilterState: (filter: Partial<FilterState>) => void;
  addUploadedData: (data: any) => void;
  toggleDistrictSelection: (districtId: string) => void;
}

export const useDashboardStore = create<DashboardStore>((set) => ({
  districts: [],
  healthSpaces: [],
  filterState: {
    selectedDistricts: [],
    selectedYear: 2024,
    selectedType: null,
  },
  uploadedData: [],
  
  setDistricts: (districts) => set({ districts }),
  
  setHealthSpaces: (spaces) => set({ healthSpaces: spaces }),
  
  setFilterState: (filter) =>
    set((state) => ({
      filterState: { ...state.filterState, ...filter },
    })),
  
  addUploadedData: (data) =>
    set((state) => ({
      uploadedData: [...state.uploadedData, data],
    })),
  
  toggleDistrictSelection: (districtId) =>
    set((state) => {
      const isSelected = state.filterState.selectedDistricts.includes(districtId);
      return {
        filterState: {
          ...state.filterState,
          selectedDistricts: isSelected
            ? state.filterState.selectedDistricts.filter((id) => id !== districtId)
            : [...state.filterState.selectedDistricts, districtId],
        },
      };
    }),
}));

