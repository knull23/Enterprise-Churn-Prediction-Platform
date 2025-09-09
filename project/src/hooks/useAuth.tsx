import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User, LoginCredentials, RegisterCredentials, AuthContextType } from '../types';
import { apiService } from '../services/api';

export interface AuthError {
  field?: 'email' | 'password' | 'form';
  message: string;
}

interface ExtendedAuthContextType extends Omit<AuthContextType, 'error'> {
  setUser: (user: User | null) => void;
  login: (credentials: LoginCredentials) => Promise<{ success: boolean; error?: AuthError }>;
  register: (credentials: RegisterCredentials) => Promise<boolean>;
  error: AuthError | null;
  clearError: () => void;
}

const AuthContext = createContext<ExtendedAuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

export const useAuthProvider = (): ExtendedAuthContextType => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<AuthError | null>(null);

  const clearError = () => setError(null);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = apiService.getToken();
        if (token) {
          try {
            const userData = await apiService.verifyToken(token);
            setUser(userData);
          } catch {
            apiService.clearToken();
            setUser(null);
          }
        } else {
          setUser(null);
        }
      } catch {
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    initializeAuth();
  }, []);

  const parseError = (rawError: unknown): AuthError => {
    if (!rawError) return { field: 'form', message: 'Unknown error occurred' };
    if (typeof rawError === 'string') return { field: 'form', message: rawError };
    if (typeof rawError === 'object' && 'message' in rawError && typeof (rawError as any).message === 'string') {
      return { field: 'form', message: (rawError as any).message };
    }
    return { field: 'form', message: 'Unknown error occurred' };
  };

  const login = async (credentials: LoginCredentials): Promise<{ success: boolean; error?: AuthError }> => {
    try {
      clearError();
      setIsLoading(true);
      const response = await apiService.login(credentials);

      if (response.success && response.data) {
        setUser(response.data.user);
        return { success: true };
      } else {
        const apiError: AuthError = {
          field: response.error?.toLowerCase().includes('email')
            ? 'email'
            : response.error?.toLowerCase().includes('password')
            ? 'password'
            : 'form',
          message: response.error || 'Login failed',
        };
        setError(apiError);
        return { success: false, error: apiError };
      }
    } catch (err) {
      const apiError: AuthError = { field: 'form', message: err instanceof Error ? err.message : 'Login failed' };
      setError(apiError);
      return { success: false, error: apiError };
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (credentials: RegisterCredentials): Promise<boolean> => {
    try {
      clearError();
      setIsLoading(true);
      const response = await apiService.register(credentials);

      if (response.success && response.data) {
        setUser(response.data.user);
        return true;
      } else {
        const apiError: AuthError = { field: 'form', message: response.error || 'Registration failed' };
        setError(apiError);
        return false;
      }
    } catch (err) {
      setError(parseError(err));
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    clearError();
    apiService.clearToken();
    setUser(null);
  };

  return {
    user,
    login,
    register,
    logout,
    isLoading,
    setUser,
    error,
    clearError,
  };
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const auth = useAuthProvider();
  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
};

