import React, { useState, useCallback } from 'react';
import { Shop, User } from '../types';

interface GeneratorProps {
  shops: Shop[];
  graphToken: string;
  onRefresh: () => void;
  currentUser?: User;
}

interface FormData {
  selectedShops: string[];
  startDate: string;
  frequency: 'weekly' | 'bi-weekly' | 'monthly';
  clusterCount: number;
}

const Step: React.FC<{ number: number; label: string; active?: boolean; completed?: boolean }> = ({
  number,
  label,
  active,
  completed,
}) => (
  <div className="flex flex-col items-center gap-2">
    <div
      className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
        completed
          ? 'bg-green-600 text-white'
          : active
            ? 'bg-blue-600 text-white'
            : 'bg-gray-200 text-gray-600'
      }`}
    >
      {completed ? '✓' : number}
    </div>
    <span className="text-xs text-gray-600">{label}</span>
  </div>
);

export const Generator: React.FC<GeneratorProps> = ({ shops, graphToken, onRefresh, currentUser }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    selectedShops: [],
    startDate: '',
    frequency: 'weekly',
    clusterCount: 5,
  });
  const [generating, setGenerating] = useState(false);

  const handleNext = useCallback(() => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    } else {
      handleGenerate();
    }
  }, [currentStep]);

  const handlePrevious = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  }, [currentStep]);

  const handleGenerate = async () => {
    setGenerating(true);
    setTimeout(() => {
      console.log('Schedule generated:', formData);
      alert('Schedule generated successfully!');
      setGenerating(false);
    }, 1000);
  };

  const toggleShop = (shopId: string) => {
    setFormData(prev => ({
      ...prev,
      selectedShops: prev.selectedShops.includes(shopId)
        ? prev.selectedShops.filter(id => id !== shopId)
        : [...prev.selectedShops, shopId],
    }));
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Schedule Generator</h1>
        <p className="text-gray-600">Create optimized schedules using K-means clustering</p>
      </div>

      {/* Steps */}
      <div className="flex items-center justify-between max-w-2xl">
        <Step number={1} label="Select Shops" active={currentStep === 1} completed={currentStep > 1} />
        <div className={`flex-1 h-1 mx-2 ${currentStep > 1 ? 'bg-blue-600' : 'bg-gray-300'}`} />
        <Step number={2} label="Settings" active={currentStep === 2} completed={currentStep > 2} />
        <div className={`flex-1 h-1 mx-2 ${currentStep > 2 ? 'bg-blue-600' : 'bg-gray-300'}`} />
        <Step number={3} label="Review" active={currentStep === 3} />
      </div>

      {/* Content */}
      <div className="grid grid-cols-[1fr_300px] gap-6">
        {/* Main */}
        <div className="bg-white rounded-lg border shadow-sm p-6 space-y-4">
          {currentStep === 1 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-gray-900">Select Shops</h2>
              <p className="text-gray-600">Choose which shops to include in the schedule</p>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {shops.map(shop => (
                  <label key={shop.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.selectedShops.includes(shop.id)}
                      onChange={() => toggleShop(shop.id)}
                      className="w-4 h-4"
                    />
                    <div>
                      <p className="font-medium text-gray-900">{shop.name}</p>
                      <p className="text-xs text-gray-600">{shop.address}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-gray-900">Configure Settings</h2>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Start Date</label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Frequency</label>
                <select
                  value={formData.frequency}
                  onChange={e => setFormData({ ...formData, frequency: e.target.value as any })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="weekly">Weekly</option>
                  <option value="bi-weekly">Bi-weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Cluster Count (K-Means): {formData.clusterCount}
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={formData.clusterCount}
                  onChange={e => setFormData({ ...formData, clusterCount: parseInt(e.target.value) })}
                  className="w-full"
                />
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-gray-900">Review & Generate</h2>
              <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-sm">
                <div>
                  <span className="font-semibold">Shops Selected:</span> {formData.selectedShops.length}
                </div>
                <div>
                  <span className="font-semibold">Start Date:</span> {formData.startDate || 'Not selected'}
                </div>
                <div>
                  <span className="font-semibold">Frequency:</span> {formData.frequency}
                </div>
                <div>
                  <span className="font-semibold">Clusters:</span> {formData.clusterCount}
                </div>
              </div>
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                <p className="text-sm text-blue-900">
                  The system will use K-means clustering to optimize shop grouping by geographic proximity, creating{' '}
                  <strong>{formData.clusterCount}</strong> clusters.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Progress */}
          <div className="bg-white rounded-lg border shadow-sm p-4 space-y-3">
            <h3 className="font-bold text-gray-900">Progress</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span>Step {currentStep} of 3</span>
                <span>{Math.round((currentStep / 3) * 100)}%</span>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 transition-all"
                  style={{ width: `${(currentStep / 3) * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="bg-white rounded-lg border shadow-sm p-4 space-y-3">
            <h3 className="font-bold text-gray-900">Summary</h3>
            <div className="space-y-1 text-sm">
              <div>
                <span className="font-medium">Shops:</span> {formData.selectedShops.length}
              </div>
              <div>
                <span className="font-medium">Frequency:</span> {formData.frequency}
              </div>
              <div>
                <span className="font-medium">Clusters:</span> {formData.clusterCount}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-2">
            <button
              onClick={handleNext}
              disabled={generating}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
            >
              {generating ? 'Generating...' : currentStep === 3 ? 'Generate' : 'Next'}
            </button>
            {currentStep > 1 && (
              <button
                onClick={handlePrevious}
                className="w-full px-4 py-2 border rounded-lg hover:bg-gray-50 font-medium"
              >
                Previous
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Generator;
