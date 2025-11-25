import axios, { AxiosInstance } from 'axios';
import { LoginCredentials, AuthResponse, DirectoryResponse, CallsResponse, DevicesResponse } from './types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add token to requests if available
    this.client.interceptors.request.use((config) => {
      const token = this.getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
  }

  private getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    }
    return null;
  }

  setToken(token: string, rememberMe: boolean = false): void {
    if (typeof window !== 'undefined') {
      const storage = rememberMe ? localStorage : sessionStorage;
      storage.setItem('auth_token', token);
    }
  }

  removeToken(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      sessionStorage.removeItem('auth_token');
    }
  }

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await this.client.post<AuthResponse>('/api/auth/login', credentials);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Login failed',
      };
    }
  }

  async getDirectory(): Promise<DirectoryResponse> {
    try {
      const response = await this.client.get<DirectoryResponse>('/api/directory');
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        this.removeToken();
      }
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch directory',
      };
    }
  }

  async healthCheck(): Promise<{ status: string; message: string }> {
    try {
      const response = await this.client.get('/api/health');
      return response.data;
    } catch (error) {
      return {
        status: 'error',
        message: 'Backend service unavailable',
      };
    }
  }

  async getActiveCalls(): Promise<CallsResponse> {
    try {
      const response = await this.client.get<CallsResponse>('/api/calls');
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        this.removeToken();
      }
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch active calls',
      };
    }
  }

  async getDevices(): Promise<DevicesResponse> {
    try {
      const response = await this.client.get<DevicesResponse>('/api/devices');
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        this.removeToken();
      }
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch devices',
      };
    }
  }
}

export const apiClient = new ApiClient();
