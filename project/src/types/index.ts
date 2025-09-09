export interface User {
  id: string;
  email: string;
  role: 'admin' | 'user';
  name: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  name: string;
  email: string;
  password: string;
}

// useAuth.tsx
export interface AuthError {
  field?: 'email' | 'password' | 'form';
  message: string;
}


export interface AuthContextType {
  user: User | null;
  login: (credentials: LoginCredentials) => Promise<{ success: boolean; error?: AuthError }>;
  register: (credentials: RegisterCredentials) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
  error: AuthError | null;
  clearError: () => void;
}


export interface CustomerData {
  contract: 'Month-to-month' | 'One year' | 'Two year';
  monthlyCharges: number;
  numReferrals: number;
  dependents: 'Yes' | 'No';
  totalCharges: number;
  tenure: number;
  paymentMethod:
    | 'Electronic Check'
    | 'Mailed Check'
    | 'Bank Transfer'
    | 'Credit Card';
  onlineBackup: 'Yes' | 'No';
  onlineSecurity: 'Yes' | 'No';
  techSupport: 'Yes' | 'No';
}

export interface ChurnPrediction {
  id: string;
  timestamp: string;
  customerData: CustomerData;
  prediction: 'Churn' | 'No Churn';
  probability: number;
  shapValues: ShapValue[];
  userId?: string;
}

export interface ShapValue {
  feature: string;
  value: number;
  impact: 'positive' | 'negative';
}

export interface DashboardStats {
  totalPredictions: number;
  churnRate: number;
  avgProbability: number;
  highRiskCustomers: number;
  predictionAccuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  auc: number;
}

export interface HistoryFilters {
  startDate?: string;
  endDate?: string;
  prediction?: 'Churn' | 'No Churn' | 'All';
  minProbability?: number;
  maxProbability?: number;
  sortBy: 'timestamp' | 'probability' | 'prediction';
  sortOrder: 'asc' | 'desc';
  page: number;
  limit: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}
