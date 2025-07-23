import React from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
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

  return (
    <Card>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
        Tenure vs Monthly Charges
      </h3>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis 
              type="number" 
              dataKey="tenure" 
              name="Tenure (months)"
              tick={{ fontSize: 12 }}
              className="text-gray-600 dark:text-gray-400"
            />
            <YAxis 
              type="number" 
              dataKey="monthlyCharges" 
              name="Monthly Charges ($)"
              tick={{ fontSize: 12 }}
              className="text-gray-600 dark:text-gray-400"
            />
            <Tooltip 
              cursor={{ strokeDasharray: '3 3' }}
              contentStyle={{
                backgroundColor: 'var(--tooltip-bg)',
                border: '1px solid var(--tooltip-border)',
                borderRadius: '8px',
                color: 'var(--tooltip-text)'
              }}
              formatter={(value, name) => [
                name === 'tenure' ? `${value} months` : `$${value}`,
                name === 'tenure' ? 'Tenure' : 'Monthly Charges'
              ]}
            />
            <Scatter dataKey="monthlyCharges">
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