import React from 'react';
import { Card } from '../ui/Card';
import { ChurnPrediction } from '../../types';
import { AlertTriangle, CheckCircle } from 'lucide-react';
import { ProbabilityGauge } from './ProbabilityGauge';
import { ShapChart } from './ShapChart';

interface PredictionResultProps {
  prediction: ChurnPrediction;
}

export const PredictionResult: React.FC<PredictionResultProps> = ({
  prediction
}) => {
  const isChurn = prediction.prediction === 'Churn';
  const riskLevel = prediction.probability > 0.7 ? 'High' : 
                   prediction.probability > 0.4 ? 'Medium' : 'Low';

  return (
    <div className="space-y-6">
      <Card>
        <div className="text-center mb-6">
          <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${
            isChurn 
              ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
              : 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
          }`}>
            {isChurn ? <AlertTriangle className="w-4 h-4 mr-2" /> : <CheckCircle className="w-4 h-4 mr-2" />}
            {prediction.prediction}
          </div>
          
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mt-4">
            Churn Probability: {(prediction.probability * 100).toFixed(1)}%
          </h3>
          
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            Risk Level: <span className={`font-medium ${
              riskLevel === 'High' ? 'text-red-600 dark:text-red-400' :
              riskLevel === 'Medium' ? 'text-yellow-600 dark:text-yellow-400' :
              'text-green-600 dark:text-green-400'
            }`}>
              {riskLevel}
            </span>
          </p>
        </div>
        
        <ProbabilityGauge probability={prediction.probability} />
      </Card>
      
      <Card>
        <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Feature Importance (SHAP Values)
        </h4>
        <ShapChart shapValues={prediction.shapValues} />
      </Card>
    </div>
  );
};