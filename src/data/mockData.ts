import { District, HealthDecisionSpace } from '../types';

// Harare districts with approximate coordinates
export const harareDistricts: District[] = [
  { id: 'mbare', name: 'MBARE', coordinates: [-17.8640, 31.0472], type: 'district' },
  { id: 'highfield', name: 'HIGHFIELD', coordinates: [-17.8745, 31.0123], type: 'district' },
  { id: 'warren-park', name: 'WARREN PARK', coordinates: [-17.8234, 30.9982], type: 'district' },
  { id: 'glen-view', name: 'GLEN VIEW', coordinates: [-17.8912, 30.9645], type: 'district' },
  { id: 'budiriro', name: 'BUDIRIRO', coordinates: [-17.9045, 30.9523], type: 'district' },
  { id: 'glen-norah', name: 'GLEN NORAH', coordinates: [-17.8823, 30.9812], type: 'district' },
  { id: 'kambuzuma', name: 'KAMBUZUMA', coordinates: [-17.8556, 30.9789], type: 'district' },
  { id: 'mufakose', name: 'MUFAKOSE', coordinates: [-17.8467, 30.9634], type: 'district' },
  { id: 'dzivarasekwa', name: 'DZIVARASEKWA', coordinates: [-17.8145, 30.9567], type: 'district' },
  { id: 'kuwadzana', name: 'KUWADZANA', coordinates: [-17.8234, 30.9345], type: 'district' },
  { id: 'hatcliffe', name: 'HATCLIFFE', coordinates: [-17.7645, 30.9923], type: 'district' },
  { id: 'chitungwiza', name: 'CHITUNGWIZA', coordinates: [-18.0128, 31.0789], type: 'district' },
  { id: 'epworth', name: 'EPWORTH', coordinates: [-17.8890, 31.1456], type: 'district' },
  { id: 'mabvuku', name: 'MABVUKU', coordinates: [-17.8445, 31.1234], type: 'district' },
  { id: 'tafara', name: 'TAFARA', coordinates: [-17.8234, 31.1056], type: 'district' },
];

// Mock health decision-making spaces across years
export const healthDecisionSpaces: HealthDecisionSpace[] = [
  // 2020 data
  { id: 'hds-1', districtId: 'mbare', name: 'Mbare Health Center', type: 'health_center', coordinates: [-17.8640, 31.0472], youthParticipants: 12, totalParticipants: 45, year: 2020 },
  { id: 'hds-2', districtId: 'highfield', name: 'Highfield Poly Clinic', type: 'clinic', coordinates: [-17.8745, 31.0123], youthParticipants: 18, totalParticipants: 52, year: 2020 },
  { id: 'hds-3', districtId: 'warren-park', name: 'Warren Park District Office', type: 'district_office', coordinates: [-17.8234, 30.9982], youthParticipants: 8, totalParticipants: 38, year: 2020 },
  { id: 'hds-4', districtId: 'budiriro', name: 'Budiriro Community Forum', type: 'community_forum', coordinates: [-17.9045, 30.9523], youthParticipants: 15, totalParticipants: 48, year: 2020 },
  { id: 'hds-5', districtId: 'kambuzuma', name: 'Kambuzuma Health Center', type: 'health_center', coordinates: [-17.8556, 30.9789], youthParticipants: 10, totalParticipants: 42, year: 2020 },
  
  // 2021 data
  { id: 'hds-6', districtId: 'mbare', name: 'Mbare Health Center', type: 'health_center', coordinates: [-17.8640, 31.0472], youthParticipants: 16, totalParticipants: 48, year: 2021 },
  { id: 'hds-7', districtId: 'highfield', name: 'Highfield Poly Clinic', type: 'clinic', coordinates: [-17.8745, 31.0123], youthParticipants: 22, totalParticipants: 55, year: 2021 },
  { id: 'hds-8', districtId: 'warren-park', name: 'Warren Park District Office', type: 'district_office', coordinates: [-17.8234, 30.9982], youthParticipants: 11, totalParticipants: 40, year: 2021 },
  { id: 'hds-9', districtId: 'glen-view', name: 'Glen View Clinic', type: 'clinic', coordinates: [-17.8912, 30.9645], youthParticipants: 14, totalParticipants: 46, year: 2021 },
  { id: 'hds-10', districtId: 'budiriro', name: 'Budiriro Community Forum', type: 'community_forum', coordinates: [-17.9045, 30.9523], youthParticipants: 19, totalParticipants: 51, year: 2021 },
  
  // 2022 data
  { id: 'hds-11', districtId: 'mbare', name: 'Mbare Health Center', type: 'health_center', coordinates: [-17.8640, 31.0472], youthParticipants: 20, totalParticipants: 50, year: 2022 },
  { id: 'hds-12', districtId: 'highfield', name: 'Highfield Poly Clinic', type: 'clinic', coordinates: [-17.8745, 31.0123], youthParticipants: 25, totalParticipants: 58, year: 2022 },
  { id: 'hds-13', districtId: 'warren-park', name: 'Warren Park District Office', type: 'district_office', coordinates: [-17.8234, 30.9982], youthParticipants: 14, totalParticipants: 43, year: 2022 },
  { id: 'hds-14', districtId: 'glen-view', name: 'Glen View Clinic', type: 'clinic', coordinates: [-17.8912, 30.9645], youthParticipants: 17, totalParticipants: 49, year: 2022 },
  { id: 'hds-15', districtId: 'budiriro', name: 'Budiriro Community Forum', type: 'community_forum', coordinates: [-17.9045, 30.9523], youthParticipants: 23, totalParticipants: 54, year: 2022 },
  { id: 'hds-16', districtId: 'kuwadzana', name: 'Kuwadzana Health Center', type: 'health_center', coordinates: [-17.8234, 30.9345], youthParticipants: 13, totalParticipants: 44, year: 2022 },
  { id: 'hds-17', districtId: 'chitungwiza', name: 'Chitungwiza Central Hospital', type: 'health_center', coordinates: [-18.0128, 31.0789], youthParticipants: 28, totalParticipants: 62, year: 2022 },
  
  // 2023 data
  { id: 'hds-18', districtId: 'mbare', name: 'Mbare Health Center', type: 'health_center', coordinates: [-17.8640, 31.0472], youthParticipants: 24, totalParticipants: 53, year: 2023 },
  { id: 'hds-19', districtId: 'highfield', name: 'Highfield Poly Clinic', type: 'clinic', coordinates: [-17.8745, 31.0123], youthParticipants: 30, totalParticipants: 61, year: 2023 },
  { id: 'hds-20', districtId: 'warren-park', name: 'Warren Park District Office', type: 'district_office', coordinates: [-17.8234, 30.9982], youthParticipants: 18, totalParticipants: 46, year: 2023 },
  { id: 'hds-21', districtId: 'glen-view', name: 'Glen View Clinic', type: 'clinic', coordinates: [-17.8912, 30.9645], youthParticipants: 21, totalParticipants: 52, year: 2023 },
  { id: 'hds-22', districtId: 'budiriro', name: 'Budiriro Community Forum', type: 'community_forum', coordinates: [-17.9045, 30.9523], youthParticipants: 27, totalParticipants: 57, year: 2023 },
  { id: 'hds-23', districtId: 'kuwadzana', name: 'Kuwadzana Health Center', type: 'health_center', coordinates: [-17.8234, 30.9345], youthParticipants: 16, totalParticipants: 47, year: 2023 },
  { id: 'hds-24', districtId: 'chitungwiza', name: 'Chitungwiza Central Hospital', type: 'health_center', coordinates: [-18.0128, 31.0789], youthParticipants: 32, totalParticipants: 65, year: 2023 },
  { id: 'hds-25', districtId: 'epworth', name: 'Epworth Clinic', type: 'clinic', coordinates: [-17.8890, 31.1456], youthParticipants: 15, totalParticipants: 45, year: 2023 },
  
  // 2024 data
  { id: 'hds-26', districtId: 'mbare', name: 'Mbare Health Center', type: 'health_center', coordinates: [-17.8640, 31.0472], youthParticipants: 28, totalParticipants: 56, year: 2024 },
  { id: 'hds-27', districtId: 'highfield', name: 'Highfield Poly Clinic', type: 'clinic', coordinates: [-17.8745, 31.0123], youthParticipants: 35, totalParticipants: 64, year: 2024 },
  { id: 'hds-28', districtId: 'warren-park', name: 'Warren Park District Office', type: 'district_office', coordinates: [-17.8234, 30.9982], youthParticipants: 22, totalParticipants: 49, year: 2024 },
  { id: 'hds-29', districtId: 'glen-view', name: 'Glen View Clinic', type: 'clinic', coordinates: [-17.8912, 30.9645], youthParticipants: 25, totalParticipants: 55, year: 2024 },
  { id: 'hds-30', districtId: 'budiriro', name: 'Budiriro Community Forum', type: 'community_forum', coordinates: [-17.9045, 30.9523], youthParticipants: 31, totalParticipants: 60, year: 2024 },
  { id: 'hds-31', districtId: 'kuwadzana', name: 'Kuwadzana Health Center', type: 'health_center', coordinates: [-17.8234, 30.9345], youthParticipants: 19, totalParticipants: 50, year: 2024 },
  { id: 'hds-32', districtId: 'chitungwiza', name: 'Chitungwiza Central Hospital', type: 'health_center', coordinates: [-18.0128, 31.0789], youthParticipants: 38, totalParticipants: 68, year: 2024 },
  { id: 'hds-33', districtId: 'epworth', name: 'Epworth Clinic', type: 'clinic', coordinates: [-17.8890, 31.1456], youthParticipants: 18, totalParticipants: 48, year: 2024 },
  { id: 'hds-34', districtId: 'mabvuku', name: 'Mabvuku Health Center', type: 'health_center', coordinates: [-17.8445, 31.1234], youthParticipants: 20, totalParticipants: 51, year: 2024 },
  { id: 'hds-35', districtId: 'tafara', name: 'Tafara Community Center', type: 'community_forum', coordinates: [-17.8234, 31.1056], youthParticipants: 17, totalParticipants: 46, year: 2024 },
];

