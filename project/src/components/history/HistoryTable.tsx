import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { ChurnPrediction, HistoryFilters } from '../../types';
import { Search, Filter, Download, Eye, Trash2 } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { PredictionResult } from '../prediction/PredictionResult';

interface HistoryTableProps {
  predictions: ChurnPrediction[];
  total: number;
  filters: HistoryFilters;
  onFiltersChange: (filters: HistoryFilters) => void;
  isLoading: boolean;
  onClear: () => void; // ✅ ADDED
}

const predictionOptions = [
  { value: 'All', label: 'All Predictions' },
  { value: 'Churn', label: 'Churn' },
  { value: 'No Churn', label: 'No Churn' }
];

const sortOptions = [
  { value: 'timestamp', label: 'Date' },
  { value: 'probability', label: 'Probability' },
  { value: 'prediction', label: 'Prediction' }
];

const orderOptions = [
  { value: 'desc', label: 'Descending' },
  { value: 'asc', label: 'Ascending' }
];

export const HistoryTable: React.FC<HistoryTableProps> = ({
  predictions,
  total,
  filters,
  onFiltersChange,
  isLoading,
  onClear // ✅ ADDED
}) => {
  const [selectedPrediction, setSelectedPrediction] = useState<ChurnPrediction | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const handleFilterChange = (key: keyof HistoryFilters, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value,
      page: 1
    });
  };

  const handleExport = () => {
    const csvContent = [
      ['Timestamp', 'Prediction', 'Probability', 'Tenure', 'Monthly Charges', 'Contract'],
      ...predictions.map(p => [
        new Date(p.timestamp).toLocaleDateString(),
        p.prediction,
        p.probability.toFixed(3),
        p.customerData.tenure,
        p.customerData.monthlyCharges,
        p.customerData.contract
      ])
    ];
    
    const csv = csvContent.map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'prediction-history.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <Card>
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4 lg:mb-0">
            Prediction History ({total} records)
          </h2>

          <div className="flex items-center space-x-3">
            <Button variant="secondary" onClick={handleExport}>
              <Download size={16} className="mr-2" />
              Export CSV
            </Button>
            <Button variant="danger" onClick={onClear}>
              <Trash2 size={16} className="mr-2" />
              Clear History
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select
            value={filters.prediction || 'All'}
            onChange={(e) => handleFilterChange('prediction', e.target.value === 'All' ? undefined : e.target.value)}
            options={predictionOptions}
          />
          
          <Select
            value={filters.sortBy}
            onChange={(e) => handleFilterChange('sortBy', e.target.value)}
            options={sortOptions}
          />
          
          <Select
            value={filters.sortOrder}
            onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
            options={orderOptions}
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Date</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Prediction</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Probability</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Tenure</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Monthly Charges</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="text-center py-8">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                      <span className="ml-2 text-gray-600 dark:text-gray-400">Loading...</span>
                    </div>
                  </td>
                </tr>
              ) : predictions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-gray-500 dark:text-gray-400">
                    No predictions found
                  </td>
                </tr>
              ) : (
                predictions
                  .filter(p => 
                    searchTerm === '' || 
                    p.prediction.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    p.customerData.contract.toLowerCase().includes(searchTerm.toLowerCase())
                  )
                  .map((prediction) => (
                    <tr 
                      key={prediction.id}
                      className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <td className="py-3 px-4 text-sm text-gray-900 dark:text-gray-100">
                        {new Date(prediction.timestamp).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          prediction.prediction === 'Churn'
                            ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                            : 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                        }`}>
                          {prediction.prediction}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-900 dark:text-gray-100">
                        {(prediction.probability * 100).toFixed(1)}%
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-900 dark:text-gray-100">
                        {prediction.customerData.tenure} months
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-900 dark:text-gray-100">
                        ${prediction.customerData.monthlyCharges}
                      </td>
                      <td className="py-3 px-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedPrediction(prediction)}
                        >
                          <Eye size={16} />
                        </Button>
                      </td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>

        {total > filters.limit && (
          <div className="flex items-center justify-between mt-6">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Showing {((filters.page - 1) * filters.limit) + 1} to {Math.min(filters.page * filters.limit, total)} of {total} results
            </p>
            <div className="flex space-x-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleFilterChange('page', Math.max(1, filters.page - 1))}
                disabled={filters.page <= 1}
              >
                Previous
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleFilterChange('page', filters.page + 1)}
                disabled={filters.page * filters.limit >= total}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      <Modal
        isOpen={!!selectedPrediction}
        onClose={() => setSelectedPrediction(null)}
        title="Prediction Details"
        size="lg"
      >
        {selectedPrediction && (
          <PredictionResult prediction={selectedPrediction} />
        )}
      </Modal>
    </>
  );
};
