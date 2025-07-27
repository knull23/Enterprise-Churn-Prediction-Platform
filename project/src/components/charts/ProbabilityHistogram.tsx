// components/charts/ProbabilityHistogram.tsx

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ChurnPrediction } from '../../types';
import { Card } from '../ui/Card';

interface ProbabilityHistogramProps {
  predictions: ChurnPrediction[];
}

export const ProbabilityHistogram: React.FC<ProbabilityHistogramProps> = ({ predictions }) => {
  const bins = Array.from({ length: 10 }, (_, i) => ({
    bin: `${i * 10}-${i * 10 + 10}`,
    count: 0
  }));

  predictions.forEach(p => {
    const index = Math.min(Math.floor(p.probability * 10), 9);
    bins[index].count += 1;
  });

  return (
    <Card>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
        Churn Probability Distribution
      </h3>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={bins}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="bin" 
              tick={{ fontSize: 12, fill: '#9CA3AF' }} 
              label={{ value: 'Probability (%)', position: 'insideBottom', offset: -5, fill: '#9CA3AF' }}
            />
            <YAxis 
              tick={{ fontSize: 12, fill: '#9CA3AF' }} 
              label={{ value: 'Count', angle: -90, position: 'insideLeft', fill: '#9CA3AF' }}
            />
            <Tooltip />
            <Bar dataKey="count" fill="#3B82F6" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};
