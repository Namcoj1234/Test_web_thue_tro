
export interface MonthlyBill {
  id?: number;
  room_id: number;
  month_key: string; // CHANGED from 'month' to 'month_key' to match DB
  occupants: number;
  electricity_old: number;
  electricity_new: number;
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

// Helper to map room ID to display name if not in DB
export const ROOM_NAMES: Record<number, string> = {
  1: 'Phòng 1',
  2: 'Phòng 2',
  3: 'Phòng 3',
  4: 'Phòng 4',
};
