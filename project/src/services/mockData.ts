import { ChurnPrediction, DashboardStats, CustomerData, ShapValue } from '../types';

// Mock data for development/demonstration
export const mockDashboardStats: DashboardStats = {
  totalPredictions: 2847,
  churnRate: 26.5,
  avgProbability: 0.34,
  highRiskCustomers: 184,
  predictionAccuracy: 0.89,
  precision: 0.85,
  recall: 0.82,
  f1Score: 0.83,
  auc: 0.91
};

export const generateMockShapValues = (customerData: CustomerData): ShapValue[] => {
  const features = [
    { feature: 'Monthly Charges', value: (customerData.monthlyCharges - 50) * 0.01, impact: customerData.monthlyCharges > 70 ? 'positive' : 'negative' },
    { feature: 'Tenure', value: (50 - customerData.tenure) * 0.008, impact: customerData.tenure < 12 ? 'positive' : 'negative' },
    { feature: 'Contract Type', value: customerData.contract === 'Month-to-month' ? 0.15 : -0.12, impact: customerData.contract === 'Month-to-month' ? 'positive' : 'negative' },
    { feature: 'Internet Service', value: customerData.internetService === 'Fiber optic' ? 0.08 : -0.05, impact: customerData.internetService === 'Fiber optic' ? 'positive' : 'negative' },
    { feature: 'Payment Method', value: customerData.paymentMethod === 'Electronic check' ? 0.12 : -0.08, impact: customerData.paymentMethod === 'Electronic check' ? 'positive' : 'negative' },
    { feature: 'Online Security', value: customerData.onlineSecurity === 'No' ? 0.06 : -0.04, impact: customerData.onlineSecurity === 'No' ? 'positive' : 'negative' },
    { feature: 'Tech Support', value: customerData.techSupport === 'No' ? 0.05 : -0.03, impact: customerData.techSupport === 'No' ? 'positive' : 'negative' },
    { feature: 'Senior Citizen', value: customerData.senior === 'Yes' ? 0.04 : -0.02, impact: customerData.senior === 'Yes' ? 'positive' : 'negative' }
  ];

  return features
    .sort((a, b) => Math.abs(b.value) - Math.abs(a.value))
    .slice(0, 6) as ShapValue[];
};

export const generateMockPrediction = (customerData: CustomerData): ChurnPrediction => {
  const shapValues = generateMockShapValues(customerData);
  const probability = Math.max(0.05, Math.min(0.95, 
    0.3 + shapValues.reduce((sum, shap) => sum + shap.value, 0)
  ));
  
  return {
    id: `pred_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date().toISOString(),
    customerData,
    prediction: probability > 0.5 ? 'Churn' : 'No Churn',
    probability: Math.round(probability * 1000) / 1000,
    shapValues
  };
};

export const mockHistoryData: ChurnPrediction[] = Array.from({ length: 50 }, (_, i) => {
  const date = new Date();
  date.setDate(date.getDate() - Math.floor(Math.random() * 30));
  
  const customerData: CustomerData = {
    tenure: Math.floor(Math.random() * 72) + 1,
    monthlyCharges: Math.round((Math.random() * 80 + 20) * 100) / 100,
    totalCharges: Math.round((Math.random() * 5000 + 500) * 100) / 100,
    contract: ['Month-to-month', 'One year', 'Two year'][Math.floor(Math.random() * 3)] as any,
    paymentMethod: ['Electronic check', 'Mailed check', 'Bank transfer', 'Credit card'][Math.floor(Math.random() * 4)] as any,
    internetService: ['DSL', 'Fiber optic', 'No'][Math.floor(Math.random() * 3)] as any,
    onlineSecurity: ['Yes', 'No', 'No internet service'][Math.floor(Math.random() * 3)] as any,
    techSupport: ['Yes', 'No', 'No internet service'][Math.floor(Math.random() * 3)] as any,
    streamingTV: ['Yes', 'No', 'No internet service'][Math.floor(Math.random() * 3)] as any,
    paperlessBilling: ['Yes', 'No'][Math.floor(Math.random() * 2)] as any,
    senior: ['Yes', 'No'][Math.floor(Math.random() * 2)] as any,
    partner: ['Yes', 'No'][Math.floor(Math.random() * 2)] as any,
    dependents: ['Yes', 'No'][Math.floor(Math.random() * 2)] as any,
  };

  const prediction = generateMockPrediction(customerData);
  prediction.timestamp = date.toISOString();
  prediction.id = `pred_${i}_${Math.random().toString(36).substr(2, 9)}`;
  
  return prediction;
});