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
      // Fix: Remove explicit Origin header - let browser handle it
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
    };

    try {
      console.log(`Making ${config.method} request to:`, url);
      console.log('Request headers:', config.headers);
      console.log('Request body:', options.body);
      
      const response = await fetch(url, config);
      
      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      const contentType = response.headers.get('content-type');
      let data: any = {};
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
        console.log('Response data:', data);
      } else {
        console.log('Non-JSON response received');
      }

      // Fix: Better error handling for different status codes
      if (!response.ok) {
        const errorMessage = data?.error || data?.message || `Request failed: ${response.status}`;
        
        if (response.status === 401) {
          // Unauthorized - clear token and throw specific error
          this.clearToken();
          throw new Error('Unauthorized access. Please login again.');
        } else if (response.status === 404) {
          throw new Error('API endpoint not found');
        } else if (response.status >= 500) {
          throw new Error(`Server error: ${response.status} - ${errorMessage}`);
        } else {
          throw new Error(errorMessage);
        }
      }

      // Handle successful responses
      if (response.status === 200 || response.status === 201) {
        // If we got JSON data, return it
        if (data && typeof data === 'object') {
          return data;
        }
        // Otherwise return a success response
        return { success: true, message: 'Request completed successfully' } as ApiResponse<T>;
      }

      return data;
    } catch (error) {
      console.error(`API request failed for ${url}:`, error);
      
      // Fix: Handle specific error types
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        throw new Error('Network error. Unable to connect to server. Please check your connection and try again.');
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
      console.log('Attempting login with:', { email: credentials.email });
      
      const response = await this.request<{ token: string; user: User }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });

      console.log('Login response:', response);

      // Fix: Store token if login successful
      if (response.success && response.data?.token) {
        this.setToken(response.data.token);
        console.log('Token stored successfully');
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
      console.log('Attempting registration with:', { 
        name: credentials.name, 
        email: credentials.email 
      });
      
      const response = await this.request<{ token: string; user: User }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });

      console.log('Registration response:', response);

      // Fix: Store token if registration successful
      if (response.success && response.data?.token) {
        this.setToken(response.data.token);
        console.log('Token stored successfully after registration');
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
      console.log('Verifying token...');
      
      const response = await this.request<User>('/auth/verify', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${tokenToVerify}`,
        },
      });

      console.log('Token verification response:', response);

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
    console.log('Making prediction request with data:', customerData);
    
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
  ): Promise<ApiResponse<{ predictions: ChurnPrediction[]; total: number; page: number; totalPages: number }>> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });

    return this.request<{ predictions: ChurnPrediction[]; total: number; page: number; totalPages: number }>(
      `/history?${params.toString()}`
    );
  }

  async clearHistory(): Promise<ApiResponse<{ deletedCount: number }>> {
    return this.request<{ deletedCount: number }>('/history', { method: 'DELETE' });
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
      
      if (!response.ok) {
        throw new Error(`Health check failed: ${response.status}`);
      }
      
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

  // CORS test endpoint
  async testCors(): Promise<any> {
    try {
      console.log('Testing CORS...');
      const response = await fetch(`${this.baseUrl}/test-cors`, {
        method: 'POST',
        mode: 'cors',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ test: 'data' }),
      });
      
      const data = await response.json();
      console.log('CORS test response:', data);
      return data;
    } catch (error: any) {
      console.error('CORS test failed:', error);
      return { 
        status: 'error', 
        error: error.message,
        baseUrl: this.baseUrl 
      };
    }
  }

  // Token management methods
  setToken(token: string): void {
    console.log('Setting auth token');
    this.token = token;
    localStorage.setItem('authToken', token);
  }

  clearToken(): void {
    console.log('Clearing auth token');
    this.token = null;
    localStorage.removeItem('authToken');
  }

  getToken(): string | null {
    return this.token || localStorage.getItem('authToken');
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    console.log('Checking authentication status:', !!token);
    return !!token;
  }

  // Get current API URL for debugging
  getApiUrl(): string {
    return this.baseUrl;
  }
}

export const apiService = new ApiService();


