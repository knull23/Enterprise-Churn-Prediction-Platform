// src/components/notifications/NotificationSettings.tsx
import React, { useEffect, useState } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Bell, Mail, MessageSquare } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

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

export const NotificationSettings: React.FC = () => {
  const { user } = useAuth();
  const userId = user?.id || "demo-user"; // fallback for now

  const [settings, setSettings] = useState({
    emailEnabled: true,
    smsEnabled: false,
    threshold: '0.7',
    frequency: 'immediate',
    emailAddress: '',
    phoneNumber: ''
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // 🔹 Load settings from backend
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/notifications/${userId}`);
        const json = await res.json();
        if (json.success && json.data) {
          setSettings(json.data);
        } else {
          console.warn("No saved settings found, using defaults.");
        }
      } catch (err) {
        console.error("Failed to fetch notification settings:", err);
        setMessage("⚠️ Could not load settings.");
      }
    };
    if (userId) fetchSettings();
  }, [userId]);

  // 🔹 Save settings
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/notifications/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings)
      });
      const json = await res.json();
      if (json.success) {
        setMessage("✅ Settings saved!");
      } else {
        setMessage(json.error || "❌ Failed to save settings.");
      }
    } catch (err) {
      console.error("Error saving settings:", err);
      setMessage("❌ Error saving settings.");
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Validation
  const isEmailValid =
    settings.emailAddress === '' ||
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(settings.emailAddress);
  const isPhoneValid =
    settings.phoneNumber === '' ||
    /^\+?[0-9\s\-()]{7,}$/.test(settings.phoneNumber);

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
            onChange={(e) =>
              setSettings((prev) => ({ ...prev, threshold: e.target.value }))
            }
            options={thresholdOptions}
          />
          <Select
            label="Notification Frequency"
            value={settings.frequency}
            onChange={(e) =>
              setSettings((prev) => ({ ...prev, frequency: e.target.value }))
            }
            options={frequencyOptions}
          />
        </div>

        {/* Email Section */}
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="emailEnabled"
              checked={settings.emailEnabled}
              onChange={(e) =>
                setSettings((prev) => ({
                  ...prev,
                  emailEnabled: e.target.checked
                }))
              }
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label
              htmlFor="emailEnabled"
              className="flex items-center text-sm font-medium"
            >
              <Mail className="w-4 h-4 mr-2" />
              Email Notifications
            </label>
          </div>

          {settings.emailEnabled && (
            <Input
              label="Email Address"
              type="email"
              value={settings.emailAddress}
              onChange={(e) =>
                setSettings((prev) => ({
                  ...prev,
                  emailAddress: e.target.value
                }))
              }
              placeholder="alerts@yourcompany.com"
              error={!isEmailValid ? "Invalid email format" : ""}
            />
          )}
        </div>

        {/* SMS Section */}
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="smsEnabled"
              checked={settings.smsEnabled}
              onChange={(e) =>
                setSettings((prev) => ({
                  ...prev,
                  smsEnabled: e.target.checked
                }))
              }
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label
              htmlFor="smsEnabled"
              className="flex items-center text-sm font-medium"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              SMS Notifications
            </label>
          </div>

          {settings.smsEnabled && (
            <Input
              label="Phone Number"
              type="tel"
              value={settings.phoneNumber}
              onChange={(e) =>
                setSettings((prev) => ({
                  ...prev,
                  phoneNumber: e.target.value
                }))
              }
              placeholder="+1 (555) 123-4567"
              error={!isPhoneValid ? "Invalid phone number" : ""}
            />
          )}
        </div>

        <div className="flex justify-end items-center space-x-4">
          {message && (
            <p
              className={`text-sm ${
                message.startsWith("✅")
                  ? "text-green-600"
                  : message.startsWith("❌")
                  ? "text-red-600"
                  : "text-yellow-600"
              }`}
            >
              {message}
            </p>
          )}
          <Button
            type="submit"
            disabled={loading || !isEmailValid || !isPhoneValid}
          >
            {loading ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </form>
    </Card>
  );
};
