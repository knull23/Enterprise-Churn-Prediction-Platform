import React from 'react';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { Card } from '../ui/Card';
import { ChurnPrediction } from '../../types';

interface TenureScatterPlotProps {
  predictions: ChurnPrediction[];
}

export const TenureScatterPlot: React.FC<TenureScatterPlotProps> = ({ predictions }) => {
  const data = predictions.map(pred => ({
    tenure: pred.customerData.tenure,
    monthlyCharges: pred.customerData.monthlyCharges,
    probability: pred.probability,
    prediction: pred.prediction
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const entry = payload[0].payload;
      return (
        <div className="bg-white dark:bg-gray-800 text-black dark:text-white border border-gray-200 dark:border-gray-600 rounded-md p-3 text-sm shadow-lg">
          <p><strong>Tenure:</strong> {entry.tenure} months</p>
          <p><strong>Monthly Charges:</strong> ${entry.monthlyCharges.toFixed(2)}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
        Tenure vs Monthly Charges
      </h3>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis
              type="number"
              dataKey="tenure"
              name="Tenure"
              tick={{ fontSize: 12, fill: '#9CA3AF' }}
              label={{ value: 'Tenure (months)', position: 'insideBottom', offset: -5 }}
            />
            <YAxis
              type="number"
              dataKey="monthlyCharges"
              name="Monthly Charges"
              tick={{ fontSize: 12, fill: '#9CA3AF' }}
              label={{ value: 'Monthly Charges ($)', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Scatter data={data} dataKey="monthlyCharges">
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.prediction === 'Churn' ? '#EF4444' : '#10B981'}
                />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      <div className="flex justify-center mt-4 space-x-6">
        <div className="flex items-center">
          <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
          <span className="text-sm text-gray-600 dark:text-gray-400">Churn</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
          <span className="text-sm text-gray-600 dark:text-gray-400">No Churn</span>
        </div>
      </div>
    </Card>
  );
};
