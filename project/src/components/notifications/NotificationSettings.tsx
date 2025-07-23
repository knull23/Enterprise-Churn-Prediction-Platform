import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Bell, Mail, MessageSquare } from 'lucide-react';

interface NotificationSettingsProps {
  onSave: (settings: any) => void;
}

const thresholdOptions = [
  { value: '0.5', label: '50% - Medium Risk' },
  { value: '0.7', label: '70% - High Risk' },
  { value: '0.8', label: '80% - Very High Risk' },
  { value: '0.9', label: '90% - Critical Risk' }
];

const frequencyOptions = [
  { value: 'immediate', label: 'Immediate' },
  { value: 'hourly', label: 'Hourly Summary' },
  { value: 'daily', label: 'Daily Summary' },
  { value: 'weekly', label: 'Weekly Summary' }
];

export const NotificationSettings: React.FC<NotificationSettingsProps> = ({ onSave }) => {
  const [settings, setSettings] = useState({
    emailEnabled: true,
    smsEnabled: false,
    threshold: '0.7',
    frequency: 'immediate',
    emailAddress: '',
    phoneNumber: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(settings);
  };

  return (
    <Card>
      <div className="flex items-center mb-6">
        <Bell className="w-6 h-6 text-blue-600 mr-3" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Notification Settings
        </h3>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Select
            label="Alert Threshold"
            value={settings.threshold}
            onChange={(e) => setSettings(prev => ({ ...prev, threshold: e.target.value }))}
            options={thresholdOptions}
          />
          
          <Select
            label="Notification Frequency"
            value={settings.frequency}
            onChange={(e) => setSettings(prev => ({ ...prev, frequency: e.target.value }))}
            options={frequencyOptions}
          />
        </div>

        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="emailEnabled"
              checked={settings.emailEnabled}
              onChange={(e) => setSettings(prev => ({ ...prev, emailEnabled: e.target.checked }))}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="emailEnabled" className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300">
              <Mail className="w-4 h-4 mr-2" />
              Email Notifications
            </label>
          </div>
          
          {settings.emailEnabled && (
            <Input
              label="Email Address"
              type="email"
              value={settings.emailAddress}
              onChange={(e) => setSettings(prev => ({ ...prev, emailAddress: e.target.value }))}
              placeholder="alerts@yourcompany.com"
            />
          )}
        </div>

        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="smsEnabled"
              checked={settings.smsEnabled}
              onChange={(e) => setSettings(prev => ({ ...prev, smsEnabled: e.target.checked }))}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="smsEnabled" className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300">
              <MessageSquare className="w-4 h-4 mr-2" />
              SMS Notifications
            </label>
          </div>
          
          {settings.smsEnabled && (
            <Input
              label="Phone Number"
              type="tel"
              value={settings.phoneNumber}
              onChange={(e) => setSettings(prev => ({ ...prev, phoneNumber: e.target.value }))}
              placeholder="+1 (555) 123-4567"
            />
          )}
        </div>

        <div className="flex justify-end">
          <Button type="submit">
            Save Settings
          </Button>
        </div>
      </form>
    </Card>
  );
};