export type FilterPeriod = 'daily' | 'weekly' | 'monthly' | 'yearly';
export type TimeOfDay = 'MORNING' | 'AFTERNOON' | 'EVENING';

export interface BpReading {
  id?: number;
  systolic: number | null;
  diastolic: number | null;
  pulse: number | null;
  timeOfDay: TimeOfDay;
  readingDate: string;
  notes?: string;
}

// 1. Define the status structure for an individual reading value
export interface SingleCategory {
  label: 'Normal' | 'Slightly High' | 'High' | 'Critically High' | 'Pending';
  color: string;
  bg: string;
  pointColor: string;
}

// 2. Extend BpStatus to include the individual systolic & diastolic properties
export interface BpStatus extends SingleCategory {
  systolicStatus: SingleCategory;
  diastolicStatus: SingleCategory;
}