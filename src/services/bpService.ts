import axios, { type AxiosResponse } from 'axios';
import authService from './authService';
import type { BpReading } from '../types/bp';

const API_URL = 'https://skinny-kara-lynn-abhinavsharma-a4ea3b65.koyeb.app/api/bp';
//const API_URL = 'http://localhost:2990/api/bp';

// Helper function to inject the saved JWT token
const getAuthHeaders = () => {
  const token = authService.getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export default {
  getAllReadings(): Promise<AxiosResponse<BpReading[]>> {
    return axios.get<BpReading[]>(API_URL, {
      headers: getAuthHeaders()
    });
  },

  getReadingsByRange(startDate: string, endDate: string): Promise<AxiosResponse<BpReading[]>> {
    return axios.get<BpReading[]>(`${API_URL}/range`, {
      headers: getAuthHeaders(),
      params: { start: startDate, end: endDate }
    });
  },

  logReading(readingData: BpReading): Promise<AxiosResponse<BpReading>> {
    return axios.post<BpReading>(API_URL, readingData, {
      headers: getAuthHeaders()
    });
  }
};