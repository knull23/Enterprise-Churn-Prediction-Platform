import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { BarChart3, AlertCircle, CheckCircle, Wifi, WifiOff } from 'lucide-react';
import { LoginCredentials, RegisterCredentials } from '../../types';
import { apiService } from '../../services/api';

interface LoginFormProps {
  onLogin: (credentials: LoginCredentials) => Promise<boolean>;
  onRegister?: (credentials: RegisterCredentials) => Promise<boolean>;
  isLoading: boolean;
  error?: string | null;
  onClearError?: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ 
  onLogin, 
  onRegister, 
  isLoading, 
  error,
  onClearError 
}) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [localError, setLocalError] = useState('');
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'error'>('checking');
  const [apiInfo, setApiInfo] = useState<any>(null);

  const [formData, setFormData] = useState<RegisterCredentials>({
    name: '',
    email: '',
    password: ''
  });

  // Check API connection on mount
  useEffect(() => {
    const checkConnection = async () => {
      try {
        setConnectionStatus('checking');
        console.log('Checking API connection...');
        
        // Test basic connectivity
        const health = await apiService.healthCheck();
        console.log('Health check result:', health);
        
        if (health && health.status !== 'error') {
          setConnectionStatus('connected');
          setApiInfo(health);
        } else {
          setConnectionStatus('error');
          setApiInfo(health);
        }
      } catch (error) {
        console.error('Connection check failed:', error);
        setConnectionStatus('error');
        setApiInfo({ error: error instanceof Error ? error.message : 'Connection failed' });
      }
    };

    checkConnection();
  }, []);

  // Clear errors when switching between login/register
  useEffect(() => {
    setLocalError('');
    onClearError?.();
  }, [isRegistering, onClearError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');
    onClearError?.();

    // Validation
    if (!formData.email?.trim()) {
      setLocalError('Email is required');
      return;
    }

    if (!formData.password?.trim()) {
      setLocalError('Password is required');
      return;
    }

    if (isRegistering && !formData.name?.trim()) {
      setLocalError('Name is required');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setLocalError('Please enter a valid email address');
      return;
    }

    // Password validation
    if (formData.password.length < 6) {
      setLocalError('Password must be at least 6 characters long');
      return;
    }

    try {
      console.log(`Attempting ${isRegistering ? 'registration' : 'login'}...`);
      
      const success = isRegistering
        ? await onRegister?.(formData)
        : await onLogin({ email: formData.email, password: formData.password });

      if (!success) {
        // Error will be handled by the auth context and passed via props
        console.log(`${isRegistering ? 'Registration' : 'Login'} was not successful`);
      } else {
        console.log(`${isRegistering ? 'Registration' : 'Login'} successful!`);
        // Clear form on success
        setFormData({ name: '', email: '', password: '' });
      }
    } catch (err) {
      console.error(`${isRegistering ? 'Registration' : 'Login'} error:`, err);
      setLocalError('An unexpected error occurred. Please try again.');
    }
  };

  const fillDemoCredentials = () => {
    setFormData({
      name: 'Demo User',
      email: 'admin@churnpredict.com',
      password: 'admin123'
    });
    setLocalError('');
    onClearError?.();
  };

  const displayError = error || localError;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center">
            <BarChart3 className="w-8 h-8 text-white" />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900 dark:text-gray-100">
            ChurnPredict
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            {isRegistering ? 'Create a new account' : 'Sign in to your account'}
          </p>
        </div>

        {/* Connection Status */}
        <div className="text-center">
          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
            connectionStatus === 'connected' 
              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
              : connectionStatus === 'error'
              ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
              : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
          }`}>
            {connectionStatus === 'connected' ? (
              <><Wifi className="w-4 h-4" /> Connected to API</>
            ) : connectionStatus === 'error' ? (
              <><WifiOff className="w-4 h-4" /> API Connection Failed</>
            ) : (
              <><Wifi className="w-4 h-4 animate-pulse" /> Checking Connection...</>
            )}
          </div>
          
          {/* API URL Display for debugging */}
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            API: {apiService.getApiUrl()}
          </p>
        </div>

        {/* Connection Error Details */}
        {connectionStatus === 'error' && apiInfo && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                  Connection Error
                </h3>
                <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                  {apiInfo.error || 'Unable to connect to the server'}
                </p>
                <p className="text-xs text-red-600 dark:text-red-400 mt-2">
                  Please check if the backend server is running and accessible.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Login Form */}
        <Card>
          <form onSubmit={handleSubmit} className="space-y-6">
            {isRegistering && (
              <Input
                label="Full Name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                required
                placeholder="Enter your full name"
                disabled={isLoading || connectionStatus === 'error'}
              />
            )}

            <Input
              label="Email Address"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
              required
              autoComplete="email"
              placeholder="Enter your email"
              disabled={isLoading || connectionStatus === 'error'}
            />

            <Input
              label="Password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
              required
              autoComplete={isRegistering ? "new-password" : "current-password"}
              placeholder={isRegistering ? "Create a password (min 6 characters)" : "Enter your password"}
              disabled={isLoading || connectionStatus === 'error'}
            />

            {/* Error Display */}
            {displayError && (
              <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-red-700 dark:text-red-300">
                  {displayError}
                </div>
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              isLoading={isLoading}
              className="w-full"
              size="lg"
              disabled={connectionStatus === 'error'}
            >
              {isRegistering ? 'Create Account' : 'Sign In'}
            </Button>
          </form>

          {/* Switch between Login/Register */}
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {isRegistering ? 'Already have an account?' : "Don't have an account?"}{' '}
              <button
                type="button"
                className="text-blue-600 hover:underline dark:text-blue-400 font-medium"
                onClick={() => {
                  setIsRegistering(!isRegistering);
                  setFormData({ name: '', email: '', password: '' });
                }}
                disabled={isLoading}
              >
                {isRegistering ? 'Sign In' : 'Create Account'}
              </button>
            </p>
          </div>

          {/* Demo Credentials */}
          {!isRegistering && (
            <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Demo Credentials:
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={fillDemoCredentials}
                  disabled={isLoading || connectionStatus === 'error'}
                >
                  Use Demo
                </Button>
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                <div>Email: admin@churnpredict.com</div>
                <div>Password: admin123</div>
              </div>
            </div>
          )}

          {/* API Status Info */}
          {connectionStatus === 'connected' && apiInfo && (
            <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                <span className="text-sm text-green-800 dark:text-green-200">
                  Server Connected
                </span>
              </div>
              {apiInfo.environment && (
                <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                  Environment: {apiInfo.environment}
                </p>
              )}
            </div>
          )}
        </Card>

        {/* Debug Information */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg text-xs">
            <details>
              <summary className="cursor-pointer text-gray-600 dark:text-gray-400">
                Debug Info
              </summary>
              <div className="mt-2 space-y-1 text-gray-500 dark:text-gray-500">
                <div>API URL: {apiService.getApiUrl()}</div>
                <div>Connection: {connectionStatus}</div>
                <div>Token: {apiService.getToken() ? 'Present' : 'None'}</div>
                {apiInfo && (
                  <div>
                    API Response: {JSON.stringify(apiInfo, null, 2)}
                  </div>
                )}
              </div>
            </details>
          </div>
        )}
      </div>
    </div>
  );
};