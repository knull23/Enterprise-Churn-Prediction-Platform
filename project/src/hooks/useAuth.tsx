import {
  useState,
  useEffect,
  createContext,
  useContext,
  ReactNode,
} from 'react';
import {
  User,
  LoginCredentials,
  RegisterCredentials,
  AuthContextType,
} from '../types';
import { apiService } from '../services/api';

interface ExtendedAuthContextType extends AuthContextType {
  setUser: (user: User | null) => void;
  register: (credentials: RegisterCredentials) => Promise<boolean>;
  error: string | null;
  clearError: () => void;
}

const AuthContext = createContext<ExtendedAuthContextType | undefined>(
  undefined
);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const useAuthProvider = (): ExtendedAuthContextType => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const clearError = () => setError(null);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        console.log('Initializing auth...');
        const token = apiService.getToken();
        
        if (token) {
          console.log('Token found, verifying...');
          try {
            const userData = await apiService.verifyToken(token);
            console.log('Token verified, user data:', userData);
            setUser(userData);
          } catch (verifyError) {
            console.log('Token verification failed:', verifyError);
            // Clear invalid token
            apiService.clearToken();
            setUser(null);
          }
        } else {
          console.log('No token found');
          setUser(null);
        }
      } catch (error) {
        console.error('Auth initialization failed:', error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (credentials: LoginCredentials): Promise<boolean> => {
    try {
      console.log('Attempting login...');
      clearError();
      setIsLoading(true);

      const response = await apiService.login(credentials);
      console.log('Login response:', response);

      if (response.success && response.data) {
        console.log('Login successful, setting user data');
        setUser(response.data.user);
        return true;
      } else {
        console.log('Login failed - no success or data');
        setError(response.error || 'Login failed');
        return false;
      }
    } catch (error) {
      console.error('Login error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (
    credentials: RegisterCredentials
  ): Promise<boolean> => {
    try {
      console.log('Attempting registration...');
      clearError();
      setIsLoading(true);

      const response = await apiService.register(credentials);
      console.log('Registration response:', response);

      if (response.success && response.data) {
        console.log('Registration successful, setting user data');
        setUser(response.data.user);
        return true;
      } else {
        console.log('Registration failed - no success or data');
        setError(response.error || 'Registration failed');
        return false;
      }
    } catch (error) {
      console.error('Registration error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Registration failed';
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    console.log('Logging out...');
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
  return (
    <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>
  );
};

