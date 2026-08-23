import axios, { type AxiosResponse } from 'axios';
import authService from './authService';
import router from '@/router';
import type { BpReading } from '../types/bp';

const API_URL = 'https://skinny-kara-lynn-abhinavsharma-a4ea3b65.koyeb.app/api/bp';
//const API_URL = 'http://localhost:2990/api/bp';

// Helper function to inject the saved JWT token
const getAuthHeaders = () => {
  const token = authService.getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Response Interceptor: Catch expired/invalid JWT tokens globally
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      authService.logout();
      if (router.currentRoute.value.path !== '/login') {
        router.push('/login');
      }
    }
    return Promise.reject(error);
  }
);

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