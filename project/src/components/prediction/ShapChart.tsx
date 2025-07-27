import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { ShapValue } from '../../types';

interface ShapChartProps {
  shapValues: ShapValue[];
}

export const ShapChart: React.FC<ShapChartProps> = ({ shapValues }) => {
  if (!shapValues || shapValues.length === 0) {
    return <p className="text-center text-gray-500 dark:text-gray-400">No SHAP values available.</p>;
  }

  // Sort by absolute SHAP value
  const data = shapValues
    .map((shap) => ({
      feature: shap.feature,
      value: Math.abs(shap.value),
      originalValue: shap.value,
      impact: shap.impact
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10); // show top 10 features only for clarity

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          layout="vertical"
          data={data}
          margin={{ top: 20, right: 30, left: 100, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
          <XAxis
            type="number"
            tick={{ fontSize: 12, fill: '#9CA3AF' }}
            domain={[0, Math.max(...data.map(d => d.value)) * 1.1]}
          />
          <YAxis
            type="category"
            dataKey="feature"
            tick={{ fontSize: 12, fill: '#9CA3AF' }}
            width={120}
          />
          <Tooltip
            formatter={(value: any, name: string, props: any) =>
              [`${value}`, name === 'value' ? 'Impact' : name]
            }
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
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Increases Churn Risk
          </span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-green-500 rounded mr-2"></div>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Decreases Churn Risk
          </span>
        </div>
      </div>
    </div>
  );
};
