import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { ShapValue } from '../../types';

interface ShapChartProps {
  shapValues: ShapValue[];
}

export const ShapChart: React.FC<ShapChartProps> = ({ shapValues }) => {
  if (!shapValues || shapValues.length === 0) {
    return <p className="text-center text-gray-500">No SHAP values available.</p>;
  }

  const data = shapValues
    .map((shap) => ({
      feature: shap.feature,
      value: Math.abs(shap.value),
      originalValue: shap.value,
      impact: shap.impact
    }))
    .sort((a, b) => b.value - a.value);

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="horizontal"
          margin={{ top: 20, right: 30, left: 100, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
          <XAxis type="number" />
          <YAxis
            type="category"
            dataKey="feature"
            tick={{ fontSize: 12 }}
            width={120}
          />
          <Bar dataKey="value" radius={[0, 4, 4, 0]}>
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.impact === 'positive' ? '#EF4444' : '#10B981'}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <div className="flex justify-center mt-4 space-x-6">
        <div className="flex items-center">
          <div className="w-3 h-3 bg-red-500 rounded mr-2"></div>
          <span className="text-sm text-gray-600 dark:text-gray-400">Increases Churn Risk</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-green-500 rounded mr-2"></div>
          <span className="text-sm text-gray-600 dark:text-gray-400">Decreases Churn Risk</span>
        </div>
      </div>
    </div>
  );
};
