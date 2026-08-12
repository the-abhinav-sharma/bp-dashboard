import axios, { type AxiosResponse } from 'axios';
import type { BpReading } from '../types/bp'; // Note: No .ts extension

const API_URL = 'https://skinny-kara-lynn-abhinavsharma-a4ea3b65.koyeb.app/api/bp';
//const API_URL = 'http://192.168.1.4:2990/api/bp';

export default {
  getAllReadings(): Promise<AxiosResponse<BpReading[]>> {
    return axios.get<BpReading[]>(API_URL);
  },

  getReadingsByRange(startDate: string, endDate: string): Promise<AxiosResponse<BpReading[]>> {
    return axios.get<BpReading[]>(`${API_URL}/range`, {
      params: { start: startDate, end: endDate }
    });
  },

  logReading(readingData: BpReading): Promise<AxiosResponse<BpReading>> {
    return axios.post<BpReading>(API_URL, readingData);
  }
};