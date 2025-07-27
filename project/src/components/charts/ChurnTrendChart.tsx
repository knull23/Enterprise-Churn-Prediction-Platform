import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { Card } from '../ui/Card';
import { ChurnPrediction } from '../../types';

interface ChurnTrendChartProps {
  data: ChurnPrediction[]; // Raw predictions with timestamp and prediction
}

interface ChurnTrendData {
  date: string;
  churnRate: number;
  predictions: number;
}

export const ChurnTrendChart: React.FC<ChurnTrendChartProps> = ({ data }) => {
  // 🧠 Group and Aggregate by Date
  const grouped: Record<string, { churns: number; total: number }> = {};

  data.forEach((pred) => {
    // ✅ Parse Date (handle null/invalid safely)
    const rawDate = pred.timestamp;
    const dateObj = new Date(rawDate);
    if (isNaN(dateObj.getTime())) return; // skip invalid dates

    const date = dateObj.toLocaleDateString(); // e.g., "7/15/2025"

    if (!grouped[date]) {
      grouped[date] = { churns: 0, total: 0 };
    }

    grouped[date].total += 1;
    if (pred.prediction === 'Churn') {
      grouped[date].churns += 1;
    }
  });

  // 🔄 Transform to array for chart
  const processedData: ChurnTrendData[] = Object.entries(grouped).map(
    ([date, { churns, total }]) => ({
      date,
      churnRate: total > 0 ? churns / total : 0,
      predictions: total
    })
  );

  // 🛠️ Custom Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload?.length > 0) {
      const { churnRate, predictions } = payload[0].payload;
      return (
        <div className="bg-white dark:bg-gray-800 text-black dark:text-white border border-gray-200 dark:border-gray-600 rounded-md p-3 text-sm shadow-lg">
          <p><strong>Date:</strong> {label}</p>
          <p><strong>Churn Rate:</strong> {(churnRate * 100).toFixed(2)}%</p>
          <p><strong>Predictions:</strong> {predictions}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
        Churn Rate Trend
      </h3>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={processedData}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12, fill: '#9CA3AF' }}
              label={{
                value: 'Date',
                position: 'insideBottom',
                offset: -5,
                fill: '#9CA3AF'
              }}
            />
            <YAxis
              tick={{ fontSize: 12, fill: '#9CA3AF' }}
              label={{
                value: 'Churn Rate (%)',
                angle: -90,
                position: 'insideLeft',
                fill: '#9CA3AF'
              }}
              domain={[0, 1]}
              tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="churnRate"
              stroke="#EF4444"
              strokeWidth={2}
              dot={{ fill: '#EF4444', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: '#EF4444', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};

