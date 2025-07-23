import React from 'react';
import { BarChart3, History, Settings, Shield, Home, LogOut } from 'lucide-react';
import { cn } from '../../utils/cn';
import { useAuth } from '../../hooks/useAuth';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  isCollapsed: boolean;
}

const navigation = [
  { id: 'dashboard', name: 'Dashboard', icon: Home },
  { id: 'predict', name: 'Predict', icon: BarChart3 },
  { id: 'history', name: 'History', icon: History },
  { id: 'settings', name: 'Settings', icon: Settings },
];

const adminNavigation = [
  { id: 'admin', name: 'Admin Panel', icon: Shield },
];

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  isCollapsed
}) => {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    onTabChange('dashboard');
  };

  return (
    <div className={cn(
      'bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 flex flex-col',
      isCollapsed ? 'w-16' : 'w-64'
    )}>
      <div className="flex-1 py-6">
        <div className={cn(
          'px-3 mb-8',
          isCollapsed && 'px-2'
        )}>
          <div className="flex items-center">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            {!isCollapsed && (
              <span className="ml-3 text-lg font-semibold text-gray-900 dark:text-gray-100">
                ChurnPredict
              </span>
            )}
          </div>
        </div>

        <nav className="space-y-1 px-3">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={cn(
                  'w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200',
                  isActive
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'
                    : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50 dark:text-gray-300 dark:hover:text-gray-100 dark:hover:bg-gray-700',
                  isCollapsed && 'justify-center px-2'
                )}
              >
                <Icon className={cn('w-5 h-5', !isCollapsed && 'mr-3')} />
                {!isCollapsed && item.name}
              </button>
            );
          })}

          {user?.role === 'admin' && (
            <>
              <div className={cn(
                'border-t border-gray-200 dark:border-gray-700 my-4',
                isCollapsed && 'mx-2'
              )} />
              {adminNavigation.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                
                return (
                  <button
                    key={item.id}
                    onClick={() => onTabChange(item.id)}
                    className={cn(
                      'w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200',
                      isActive
                        ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'
                        : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50 dark:text-gray-300 dark:hover:text-gray-100 dark:hover:bg-gray-700',
                      isCollapsed && 'justify-center px-2'
                    )}
                  >
                    <Icon className={cn('w-5 h-5', !isCollapsed && 'mr-3')} />
                    {!isCollapsed && item.name}
                  </button>
                );
              })}
            </>
          )}
        </nav>
      </div>

      {user && (
        <div className="border-t border-gray-200 dark:border-gray-700 p-3">
          <div className={cn(
            'flex items-center mb-3',
            isCollapsed && 'justify-center'
          )}>
            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-blue-600 dark:text-blue-300">
                {user.name.charAt(0).toUpperCase()}
              </span>
            </div>
            {!isCollapsed && (
              <div className="ml-3 flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                  {user.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {user.email}
                </p>
              </div>
            )}
          </div>
          <button
            onClick={handleLogout}
            className={cn(
              'w-full flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 dark:text-gray-300 dark:hover:text-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all duration-200',
              isCollapsed && 'justify-center px-2'
            )}
          >
            <LogOut className={cn('w-4 h-4', !isCollapsed && 'mr-3')} />
            {!isCollapsed && 'Logout'}
          </button>
        </div>
      )}
    </div>
  );
};