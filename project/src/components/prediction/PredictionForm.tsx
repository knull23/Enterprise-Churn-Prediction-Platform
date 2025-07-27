import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { CustomerData } from '../../types';

interface PredictionFormProps {
  onSubmit: (data: CustomerData) => void;
  isLoading: boolean;
}

const yesNoOptions = [
  { value: 'Yes', label: 'Yes' },
  { value: 'No', label: 'No' }
];

export const PredictionForm: React.FC<PredictionFormProps> = ({
  onSubmit,
  isLoading
}) => {
  const [formData, setFormData] = useState<CustomerData>({
    tenure: 12,
    monthlyCharges: 65.0,
    numReferrals: 2,
    totalCharges: 1500.0,
    contract: 'Month-to-month',
    paymentMethod: 'Electronic Check',
    onlineBackup: 'No',
    onlineSecurity: 'No',
    techSupport: 'No',
    dependents: 'No'
  });

  const handleInputChange = (
    field: keyof CustomerData,
    value: string | number
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Card>
      <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6">
        Customer Information
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Input
            label="Tenure (Months)"
            type="number"
            value={formData.tenure}
            onChange={(e) =>
              handleInputChange('tenure', parseInt(e.target.value))
            }
            min="0"
            max="100"
            required
          />

          <Input
            label="Monthly Charges ($)"
            type="number"
            step="0.01"
            value={formData.monthlyCharges}
            onChange={(e) =>
              handleInputChange('monthlyCharges', parseFloat(e.target.value))
            }
            min="0"
            required
          />

          <Input
            label="Number of Referrals"
            type="number"
            value={formData.numReferrals}
            onChange={(e) =>
              handleInputChange('numReferrals', parseInt(e.target.value))
            }
            min="0"
            required
          />

          <Input
            label="Total Charges ($)"
            type="number"
            step="0.01"
            value={formData.totalCharges}
            onChange={(e) =>
              handleInputChange('totalCharges', parseFloat(e.target.value))
            }
            min="0"
            required
          />

          <Select
            label="Contract Type"
            value={formData.contract}
            onChange={(e) =>
              handleInputChange('contract', e.target.value as CustomerData['contract'])
            }
            options={[
              { value: 'Month-to-month', label: 'Month-to-month' },
              { value: 'One year', label: 'One year' },
              { value: 'Two year', label: 'Two year' }
            ]}
          />

          <Select
            label="Payment Method"
            value={formData.paymentMethod}
            onChange={(e) =>
              handleInputChange('paymentMethod', e.target.value as CustomerData['paymentMethod'])
            }
            options={[
              { value: 'Electronic Check', label: 'Electronic Check' },
              { value: 'Mailed Check', label: 'Mailed Check' },
              { value: 'Bank Transfer', label: 'Bank Transfer' },
              { value: 'Credit Card', label: 'Credit Card' }
            ]}
          />

          <Select
            label="Online Backup"
            value={formData.onlineBackup}
            onChange={(e) =>
              handleInputChange('onlineBackup', e.target.value as CustomerData['onlineBackup'])
            }
            options={yesNoOptions}
          />

          <Select
            label="Online Security"
            value={formData.onlineSecurity}
            onChange={(e) =>
              handleInputChange('onlineSecurity', e.target.value as CustomerData['onlineSecurity'])
            }
            options={yesNoOptions}
          />

          <Select
            label="Tech Support"
            value={formData.techSupport}
            onChange={(e) =>
              handleInputChange('techSupport', e.target.value as CustomerData['techSupport'])
            }
            options={yesNoOptions}
          />

          <Select
            label="Dependents"
            value={formData.dependents}
            onChange={(e) =>
              handleInputChange('dependents', e.target.value as CustomerData['dependents'])
            }
            options={yesNoOptions}
          />
        </div>

        <div className="flex justify-end">
          <Button type="submit" isLoading={isLoading} size="lg" className="px-8">
            Predict Churn
          </Button>
        </div>
      </form>
    </Card>
  );
};
