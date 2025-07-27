import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ChurnPrediction } from '../../types';
import { Card } from '../ui/Card';

interface ChurnByContractBarChartProps {
  predictions: ChurnPrediction[];
}

export const ChurnByContractBarChart: React.FC<ChurnByContractBarChartProps> = ({ predictions }) => {
  const grouped = predictions.reduce((acc, p) => {
    const type = p.customerData.contract || 'Unknown';
    if (!acc[type]) acc[type] = { contract: type, churns: 0, total: 0 };
    acc[type].total += 1;
    if (p.prediction === 'Churn') acc[type].churns += 1;
    return acc;
  }, {} as Record<string, { contract: string; churns: number; total: number }>);

  const data = Object.values(grouped).map(item => ({
    contract: item.contract,
    churnRate: item.total > 0 ? (item.churns / item.total) * 100 : 0
  }));

  return (
    <Card>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
        Churn Rate by Contract Type
      </h3>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="contract" 
              tick={{ fontSize: 12, fill: '#9CA3AF' }} 
              label={{ value: 'Contract Type', position: 'insideBottom', offset: -5, fill: '#9CA3AF' }}
            />
            <YAxis 
              tick={{ fontSize: 12, fill: '#9CA3AF' }} 
              label={{ value: 'Churn Rate (%)', angle: -90, position: 'insideLeft', fill: '#9CA3AF' }}
              domain={[0, 100]}
            />
            <Tooltip
            formatter={(value) =>
                typeof value === 'number' ? `${value.toFixed(1)}%` : `${value}%`
            }
            />
            <Bar dataKey="churnRate" fill="#EF4444" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};
