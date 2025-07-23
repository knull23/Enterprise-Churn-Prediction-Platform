export interface User {
  id: string;
  email: string;
  role: 'admin' | 'user';
  name: string;
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

export interface CustomerData {
  tenure: number;
  monthlyCharges: number;
  totalCharges: number;
  contract: 'Month-to-month' | 'One year' | 'Two year';
  paymentMethod: 'Electronic check' | 'Mailed check' | 'Bank transfer' | 'Credit card';
  internetService: 'DSL' | 'Fiber optic' | 'No';
  onlineSecurity: 'Yes' | 'No' | 'No internet service';
  techSupport: 'Yes' | 'No' | 'No internet service';
  streamingTV: 'Yes' | 'No' | 'No internet service';
  paperlessBilling: 'Yes' | 'No';
  senior: 'Yes' | 'No';
  partner: 'Yes' | 'No';
  dependents: 'Yes' | 'No';
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

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthContextType {
  user: User | null;
  login: (credentials: LoginCredentials) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}