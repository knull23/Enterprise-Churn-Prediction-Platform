import { useState, useEffect } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { LoginForm } from './components/auth/LoginForm';
import { StatsCard } from './components/dashboard/StatsCard';
import { MetricsHeader } from './components/dashboard/MetricsHeader';
import { PredictionForm } from './components/prediction/PredictionForm';
import { PredictionResult } from './components/prediction/PredictionResult';
import { HistoryTable } from './components/history/HistoryTable';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { useDarkMode } from './hooks/useDarkMode';
import { NotificationSettings } from './components/notifications/NotificationSettings';

import {
  Users, TrendingUp, AlertTriangle, Activity,
  Shield, Trash2
} from 'lucide-react';

import {
  ChurnPrediction, CustomerData,
  DashboardStats, HistoryFilters
} from './types';

import { apiService } from './services/api';
import { Card } from './components/ui/Card';
import { Button } from './components/ui/Button';
import { Modal } from './components/ui/Modal';

import { ChurnTrendChart } from './components/charts/ChurnTrendChart';
import { TenureScatterPlot } from './components/charts/TenureScatterPlot';
import { ProbabilityHistogram } from './components/charts/ProbabilityHistogram';
import { ChurnByContractBarChart } from './components/charts/ChurnByContractBarChart';

function AppContent() {
  const { user, login, isLoading: authLoading, register, error, clearError } = useAuth();
  const [isDark] = useDarkMode();

  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [currentPrediction, setCurrentPrediction] = useState<ChurnPrediction | null>(null);
  const [predictionHistory, setPredictionHistory] = useState<ChurnPrediction[]>([]);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    totalPredictions: 0,
    churnRate: 0,
    avgProbability: 0,
    highRiskCustomers: 0,
    predictionAccuracy: 0.89,
    precision: 0.85,
    recall: 0.82,
    f1Score: 0.83,
    auc: 0.91
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [historyFilters, setHistoryFilters] = useState<HistoryFilters>({
    sortBy: 'timestamp',
    sortOrder: 'desc',
    page: 1,
    limit: 10
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
  }, [isDark]);

  useEffect(() => {
    if (user) {
      loadDashboardStats();
      loadHistory();
    } else {
      // reset to dashboard when user logs out
      setActiveTab('dashboard');
    }
  }, [user]);

  const loadDashboardStats = async () => {
    try {
      const response = await apiService.getDashboardStats();
      if (response.success && response.data) {
        setDashboardStats(response.data);
      }
    } catch (error) {
      console.error('Failed to load dashboard stats:', error);
      toast.error('Failed to load dashboard statistics');
    }
  };

  const loadHistory = async () => {
    try {
      const response = await apiService.getHistory(historyFilters);
      if (response.success && response.data) {
        setPredictionHistory(response.data.predictions);
      }
    } catch (error) {
      console.error('Failed to load history:', error);
      toast.error('Failed to load prediction history');
    }
  };

  const handlePrediction = async (customerData: CustomerData) => {
    setIsLoading(true);
    try {
      const response = await apiService.predict(customerData);
      if (response.success && response.data) {
        setCurrentPrediction(response.data);
        toast.success('Prediction completed!');
        await loadDashboardStats();
        await loadHistory();
        setActiveTab('predict');
      } else {
        throw new Error(response.error || 'Prediction failed');
      }
    } catch (error) {
      console.error('Prediction error:', error);
      toast.error('Prediction failed. Try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = async () => {
    setIsLoading(true);
    try {
      const response = await apiService.clearHistory();
      if (response.success) {
        setPredictionHistory([]);
        await loadDashboardStats();
        setShowClearConfirm(false);
        toast.success('History cleared!');
      }
    } catch (error) {
      console.error('Clear history error:', error);
      toast.error('Failed to clear history');
    } finally {
      setIsLoading(false);
    }
  };

  const handleHistoryFiltersChange = async (newFilters: HistoryFilters) => {
    setHistoryFilters(newFilters);
    try {
      const response = await apiService.getHistory(newFilters);
      if (response.success && response.data) {
        setPredictionHistory(response.data.predictions);
      }
    } catch (error) {
      console.error('Filter history error:', error);
      toast.error('Failed to load filtered history');
    }
  };

  // Loading screen
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center space-x-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="text-gray-600 dark:text-gray-400 text-lg">Loading ChurnPredict...</span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Initializing your session
          </p>
        </div>
      </div>
    );
  }

  // Show LoginForm when user is not authenticated
  if (!user) {
    console.log("Auth Error from useAuth:", error);
    
    return (
      <LoginForm 
        onLogin={login} 
        onRegister={register} 
        isLoading={authLoading || isLoading}
        error={error}
        onClearError={clearError}
      />
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="space-y-8">
            <MetricsHeader stats={dashboardStats} />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatsCard title="Total Predictions" value={dashboardStats.totalPredictions} icon={Users} color="blue" />
              <StatsCard title="Churn Rate" value={dashboardStats.churnRate} icon={TrendingUp} color="red" format="percentage" />
              <StatsCard title="Avg Probability" value={dashboardStats.avgProbability * 100} icon={Activity} color="purple" format="percentage" />
              <StatsCard title="High Risk Customers" value={dashboardStats.highRiskCustomers} icon={AlertTriangle} color="yellow" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Recent Predictions</h3>
                <div className="space-y-3">
                  {predictionHistory.slice(0, 5).map((prediction) => (
                    <div key={prediction.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {prediction.prediction}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(prediction.timestamp).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {(prediction.probability * 100).toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  ))}
                  {predictionHistory.length === 0 && (
                    <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                      No predictions yet. Make your first prediction!
                    </p>
                  )}
                </div>
              </Card>

              <Card>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <Button onClick={() => setActiveTab('predict')} className="w-full justify-start" variant="secondary">
                    <TrendingUp className="w-4 h-4 mr-2" />
                    New Prediction
                  </Button>
                  <Button onClick={() => setActiveTab('history')} className="w-full justify-start" variant="secondary">
                    <Activity className="w-4 h-4 mr-2" />
                    View History
                  </Button>
                  <Button onClick={() => setActiveTab('settings')} className="w-full justify-start" variant="secondary">
                    <Shield className="w-4 h-4 mr-2" />
                    Settings
                  </Button>

                  {user && user.role === 'admin' && (
                    <Button onClick={() => setActiveTab('admin')} className="w-full justify-start" variant="secondary">
                      <Shield className="w-4 h-4 mr-2" />
                      Admin Panel
                    </Button>
                  )}
                </div>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ChurnTrendChart data={predictionHistory} />
              <TenureScatterPlot predictions={predictionHistory} />
              <ProbabilityHistogram predictions={predictionHistory} />
              <ChurnByContractBarChart predictions={predictionHistory} />
            </div>
          </div>
        );

      case 'predict':
        return (
          <div className="space-y-8">
            <PredictionForm onSubmit={handlePrediction} isLoading={isLoading} />
            {currentPrediction && <PredictionResult prediction={currentPrediction} />}
          </div>
        );

      case 'history':
        return (
          <HistoryTable
            predictions={predictionHistory}
            total={predictionHistory.length}
            filters={historyFilters}
            onFiltersChange={handleHistoryFiltersChange}
            onClear={() => setShowClearConfirm(true)}
            isLoading={isLoading}
          />
        );

      case 'settings':
        return (
          <div className="max-w-3xl mx-auto space-y-6">
            <NotificationSettings />
          </div>
        );

      case 'admin':
        return (
          <div className="space-y-6">
            <Card>
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6">Admin Panel</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <StatsCard title="System Health" value="OK" icon={Activity} color="green" />
                <StatsCard title="API Calls Today" value={dashboardStats.totalPredictions} icon={TrendingUp} color="blue" />
                <StatsCard title="Error Rate" value={0.2} icon={AlertTriangle} color="yellow" format="percentage" />
              </div>
              <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Database Management</h3>
                <div className="flex space-x-4">
                  <Button
                    variant="danger"
                    onClick={() => setShowClearConfirm(true)}
                    disabled={predictionHistory.length === 0}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Clear All History
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <>
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
        <Sidebar activeTab={activeTab} onTabChange={setActiveTab} isCollapsed={sidebarCollapsed} />
        <div className="flex-1 flex flex-col min-w-0">
          <Header onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)} />
          <main className="flex-1 overflow-auto p-6">{renderContent()}</main>
        </div>
        
        {/* Clear History Confirmation Modal */}
        <Modal isOpen={showClearConfirm} onClose={() => setShowClearConfirm(false)} title="Confirm Clear History">
          <div className="space-y-4">
            <p className="text-gray-600 dark:text-gray-400">
              Are you sure you want to clear all prediction history? This action cannot be undone.
            </p>
            <div className="flex space-x-3 justify-end">
              <Button variant="secondary" onClick={() => setShowClearConfirm(false)}>
                Cancel
              </Button>
              <Button variant="danger" onClick={handleClearHistory} isLoading={isLoading}>
                Clear History
              </Button>
            </div>
          </div>
        </Modal>
      </div>

      {/* Toast Notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: isDark ? '#374151' : '#ffffff',
            color: isDark ? '#f9fafb' : '#111827',
            border: isDark ? '1px solid #4b5563' : '1px solid #e5e7eb',
          },
        }}
      />
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
