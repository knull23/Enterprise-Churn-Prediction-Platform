import React from 'react';
import { TrendingUp, Target, Zap, Award } from 'lucide-react';
import { StatsCard } from './StatsCard';
import { DashboardStats } from '../../types';

interface MetricsHeaderProps {
  stats: DashboardStats;
}

export const MetricsHeader: React.FC<MetricsHeaderProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <StatsCard
        title="Model Accuracy"
        value={stats.predictionAccuracy}
        icon={Target}
        color="green"
        format="percentage"
      />
      <StatsCard
        title="Precision"
        value={stats.precision}
        icon={TrendingUp}
        color="blue"
        format="percentage"
      />
      <StatsCard
        title="Recall"
        value={stats.recall}
        icon={Zap}
        color="purple"
        format="percentage"
      />
      <StatsCard
        title="F1 Score"
        value={stats.f1Score}
        icon={Award}
        color="yellow"
        format="percentage"
      />
    </div>
  );
};