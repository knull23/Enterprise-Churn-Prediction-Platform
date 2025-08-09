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
  // ✅ Use environment variable in production, fallback to relative path for same-domain hosting
  private baseUrl =
    import.meta.env.VITE_API_URL?.replace(/\/$/, '') || '/api';

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    const token = localStorage.getItem('authToken');

    const defaultHeaders: HeadersInit = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    const config: RequestInit = {
      method: options.method || 'GET',
      headers: {
        ...defaultHeaders,
        ...(options.headers || {}),
      },
      body: options.body,
      credentials: 'include',
    };

    try {
      const response = await fetch(url, config);
      const contentType = response.headers.get('content-type');

      let data: any = {};
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      }

      if (!response.ok) {
        throw new Error(data?.error || data?.message || 'API request failed');
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // 🔐 Login (admin/user)
  async login(credentials: LoginCredentials): Promise<ApiResponse<{ token: string; user: User }>> {
    return this.request<{ token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  // ✨ Register new user
  async register(credentials: RegisterCredentials): Promise<ApiResponse<{ token: string; user: User }>> {
    return this.request<{ token: string; user: User }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  // 🔍 Verify JWT token and return user info
  async verifyToken(token: string): Promise<User> {
    const response = await this.request<User>('/auth/verify', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.success && response.data) {
      return response.data;
    }
    throw new Error('Token verification failed');
  }

  // 🔮 Predict churn
  async predict(customerData: CustomerData): Promise<ApiResponse<ChurnPrediction>> {
    return this.request<ChurnPrediction>('/predict', {
      method: 'POST',
      body: JSON.stringify(customerData),
    });
  }

  // 📊 Get dashboard summary
  async getDashboardStats(): Promise<ApiResponse<DashboardStats>> {
    return this.request<DashboardStats>('/dashboard/stats');
  }

  // 🕓 Get filtered prediction history
  async getHistory(filters: HistoryFilters): Promise<ApiResponse<{ predictions: ChurnPrediction[]; total: number }>> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });

    return this.request<{ predictions: ChurnPrediction[]; total: number }>(`/history?${params.toString()}`);
  }

  // 🧹 Clear all history
  async clearHistory(): Promise<ApiResponse<void>> {
    return this.request<void>('/history', { method: 'DELETE' });
  }

  // ❤️ API server health check
  async healthCheck(): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/health`);
      return await response.json();
    } catch (error: any) {
      console.error('Health check failed:', error);
      return { status: 'error', error: error.message };
    }
  }
}

export const apiService = new ApiService();


