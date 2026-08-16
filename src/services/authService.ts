import axios from 'axios';

const API_BASE = 'https://skinny-kara-lynn-abhinavsharma-a4ea3b65.koyeb.app/api/auth';
//const API_BASE = 'http://localhost:2990/api/auth';

export interface LoginPayload {
  appCode?: string;
  username: string;
  password?: string;
}

export interface RegisterPayload {
  appCode?: string;
  username: string;
  email: string;
  password?: string;
}

export interface AuthResponse {
  token: string;
  username: string;
}

const authService = {
  async login(payload: LoginPayload): Promise<AuthResponse> {
    const response = await axios.post<AuthResponse>(`${API_BASE}/login`, {
      appCode: payload.appCode || 'CARDIO_CARE',
      username: payload.username,
      password: payload.password
    });
    if (response.data.token) {
      localStorage.setItem('cc_token', response.data.token);
      localStorage.setItem('cc_user', response.data.username);
    }
    return response.data;
  },

  async register(payload: RegisterPayload): Promise<AuthResponse> {
    const response = await axios.post<AuthResponse>(`${API_BASE}/register`, {
      appCode: payload.appCode || 'CARDIO_CARE',
      username: payload.username,
      email: payload.email,
      password: payload.password
    });
    if (response.data.token) {
      localStorage.setItem('cc_token', response.data.token);
      localStorage.setItem('cc_user', response.data.username);
    }
    return response.data;
  },

  logout(): void {
    localStorage.removeItem('cc_token');
    localStorage.removeItem('cc_user');
  },

  getToken(): string | null {
    return localStorage.getItem('cc_token');
  },

  getUsername(): string | null {
    return localStorage.getItem('cc_user');
  },

  isAuthenticated(): boolean {
    return !!this.getToken();
  }
};

export default authService;