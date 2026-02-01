
export interface MonthlyBill {
  id?: number;
  room_id: number;
  month_key: string;
  occupants: number;
  electricity_old: number;
  electricity_new: number;
  electricity_rate?: number; // VND per kWh (default 5000)
  water_rate?: number; // VND per person (default 80000)
  room_rent?: number; // VND per room (default 1000000)
  calculated_total?: number; // Calculated total bill amount (saved to DB)
  calculated_per_person?: number; // Calculated per-person amount (saved to DB)
  is_paid?: boolean; // Payment status
  notes?: string | null; // Landlord notes
  room_name?: string;
}

export interface BillCalculation {
  electricityUsage: number;
  electricityCost: number;
  waterCost: number;
  roomRent: number;
  totalBill: number;
  perPerson: number;
}

// Helper to map room ID to display name
export const ROOM_NAMES: Record<number, string> = {
  1: 'Phòng 1',
  2: 'Phòng 2',
  3: 'Phòng 3',
  4: 'Phòng 4',
};

// Default rates
export const DEFAULT_ELECTRICITY_RATE = 5000;
export const DEFAULT_WATER_RATE = 80000;
export const DEFAULT_ROOM_RENT = 1000000;
