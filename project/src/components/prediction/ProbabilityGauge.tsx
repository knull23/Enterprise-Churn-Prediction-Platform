import React from 'react';

interface ProbabilityGaugeProps {
  probability: number;
}

export const ProbabilityGauge: React.FC<ProbabilityGaugeProps> = ({
  probability
}) => {
  const percentage = probability * 100;
  const strokeDasharray = 2 * Math.PI * 45; // circumference
  const strokeDashoffset = strokeDasharray - (strokeDasharray * probability);
  
  const getColor = (prob: number) => {
    if (prob > 0.7) return '#EF4444'; // red
    if (prob > 0.4) return '#F59E0B'; // amber
    return '#10B981'; // green
  };

  return (
    <div className="flex items-center justify-center">
      <div className="relative w-48 h-48">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          {/* Background circle */}
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            className="text-gray-200 dark:text-gray-700"
          />
          
          {/* Progress circle */}
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke={getColor(probability)}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        
        {/* Center text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              {percentage.toFixed(1)}%
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Churn Risk
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};