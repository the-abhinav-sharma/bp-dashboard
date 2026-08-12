export type TimeOfDay = 'MORNING' | 'EVENING';
export type FilterPeriod = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface BpReading {
  id?: number;
  systolic: number | null;
  diastolic: number | null;
  pulse: number | null;
  timeOfDay: TimeOfDay; // 1. Use the exported alias instead of re-declaring the inline literal type
  readingDate: string;
  notes?: string;
}

export interface BpStatus {
  // 2. Add 'Elevated' / 'Low' or keep flexible with string if you plan to add stages like AHA Guidelines later
  label: 'Normal' | 'Elevated' | 'High' | 'Very High' | 'Pending' | string;
  color: string;
  bg: string;
  pointColor: string;
}