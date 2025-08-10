import {
  ChurnPrediction,
  CustomerData,
  DashboardStats,
  HistoryFilters,
  LoginCredentials,
  RegisterCredentials,
  User,
  ApiResponse,
} from '../types';

class ApiService {
  private baseUrl: string;
  private token: string | null = null;

  constructor() {
    // Fix: Better URL configuration for both development and production
    this.baseUrl = this.getBaseUrl();
    this.token = localStorage.getItem('authToken');
    
    console.log('API Service initialized with baseUrl:', this.baseUrl);
  }

  private getBaseUrl(): string {
    // Production: Use environment variable or fallback to Render URL
    if (import.meta.env.PROD) {
      return import.meta.env.VITE_API_URL?.replace(/\/$/, '') || 
             'https://enterprise-churn-prediction-platform.onrender.com/api';
    }
    
    // Development: Use environment variable or fallback to localhost
    return import.meta.env.VITE_API_URL?.replace(/\/$/, '') || 
           'http://localhost:5000/api';
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    
    // Enhanced headers with proper CORS support
    const defaultHeaders: HeadersInit = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      // Fix: Add origin header for CORS
      'Origin': window.location.origin,
      ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
    };

    const config: RequestInit = {
      method: options.method || 'GET',
      headers: {
        ...defaultHeaders,
        ...(options.headers || {}),
      },
      body: options.body,
      // Fix: Proper credentials and mode for CORS
      credentials: 'include',
      mode: 'cors',
      // Fix: Add cache control
      cache: 'no-cache',
    };

    try {
      console.log(`Making ${config.method} request to:`, url);
      
      const response = await fetch(url, config);
      
      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      // Fix: Better error handling for different status codes
      if (!response.ok) {
        if (response.status === 401) {
          // Unauthorized - clear token and throw specific error
          this.clearToken();
          throw new Error('Unauthorized access. Please login again.');
        } else if (response.status === 404) {
          throw new Error('API endpoint not found');
        } else if (response.status >= 500) {
          throw new Error(`Server error: ${response.status}`);
        }
      }

      const contentType = response.headers.get('content-type');
      let data: any = {};
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else if (response.status === 200) {
        // For successful non-JSON responses
        data = { success: true, message: 'Request completed successfully' };
      }

      if (!response.ok) {
        throw new Error(data?.error || data?.message || `Request failed: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error(`API request failed for ${url}:`, error);
      
      // Fix: Handle specific error types
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        throw new Error('Network error. Please check your connection and try again.');
      }
      
      if (error instanceof Error && error.message.includes('CORS')) {
        throw new Error('Cross-origin request blocked. Please try again or contact support.');
      }
      
      throw error;
    }
  }

  async login(
    credentials: LoginCredentials
  ): Promise<ApiResponse<{ token: string; user: User }>> {
    try {
      const response = await this.request<{ token: string; user: User }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });

      // Fix: Store token if login successful
      if (response.success && response.data?.token) {
        this.setToken(response.data.token);
      }

      return response;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  }

  async register(
    credentials: RegisterCredentials
  ): Promise<ApiResponse<{ token: string; user: User }>> {
    try {
      const response = await this.request<{ token: string; user: User }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });

      // Fix: Store token if registration successful
      if (response.success && response.data?.token) {
        this.setToken(response.data.token);
      }

      return response;
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  }

  async verifyToken(token?: string): Promise<User> {
    const tokenToVerify = token || this.token;
    
    if (!tokenToVerify) {
      throw new Error('No token available for verification');
    }

    try {
      const response = await this.request<User>('/auth/verify', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${tokenToVerify}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error('Token verification failed');
    } catch (error) {
      console.error('Token verification failed:', error);
      this.clearToken();
      throw error;
    }
  }

  async predict(
    customerData: CustomerData
  ): Promise<ApiResponse<ChurnPrediction>> {
    return this.request<ChurnPrediction>('/predict', {
      method: 'POST',
      body: JSON.stringify(customerData),
    });
  }

  async getDashboardStats(): Promise<ApiResponse<DashboardStats>> {
    return this.request<DashboardStats>('/dashboard/stats');
  }

  async getHistory(
    filters: HistoryFilters
  ): Promise<ApiResponse<{ predictions: ChurnPrediction[]; total: number }>> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });

    return this.request<{ predictions: ChurnPrediction[]; total: number }>(
      `/history?${params.toString()}`
    );
  }

  async clearHistory(): Promise<ApiResponse<void>> {
    return this.request<void>('/history', { method: 'DELETE' });
  }

  async healthCheck(): Promise<any> {
    try {
      console.log('Performing health check...');
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        mode: 'cors',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });
      
      const data = await response.json();
      console.log('Health check response:', data);
      return data;
    } catch (error: any) {
      console.error('Health check failed:', error);
      return { 
        status: 'error', 
        error: error.message,
        baseUrl: this.baseUrl 
      };
    }
  }

  // Token management methods
  setToken(token: string): void {
    this.token = token;
    localStorage.setItem('authToken', token);
  }

  clearToken(): void {
    this.token = null;
    localStorage.removeItem('authToken');
  }

  getToken(): string | null {
    return this.token || localStorage.getItem('authToken');
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  // Get current API URL for debugging
  getApiUrl(): string {
    return this.baseUrl;
  }
}

export const apiService = new ApiService();



