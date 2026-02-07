import React, { useState, useCallback } from 'react';
import { Sidebar, SidebarTop, SidebarBottom, SidebarLogo, SidebarNavItems, SidebarAvatar } from '../Sidebar';
import { PageHeader, HeaderLeft } from '../PageHeader';
import { ChevronRight, Info } from 'lucide-react';

interface StepProps {
  number: number;
  label: string;
  active?: boolean;
  completed?: boolean;
}

const Step: React.FC<StepProps> = ({ number, label, active, completed }) => {
  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className={`w-12 h-12 rounded-full flex items-center justify-center font-bold ${
          completed
            ? 'bg-[var(--bh-success)] text-white'
            : active
              ? 'bg-[var(--bh-black)] text-[var(--bh-white)]'
              : 'bg-[var(--bh-white)] text-[var(--bh-black)] border-2 border-[var(--bh-black)]'
        }`}
      >
        {completed ? '✓' : number}
      </div>
      <span className="text-sm text-[var(--bh-black)]">{label}</span>
    </div>
  );
};

interface GeneratorPageProps {
  onNavigate?: (page: string) => void;
}

export const GeneratorPage: React.FC<GeneratorPageProps> = ({ onNavigate }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    startDate: '',
    clusterCount: '5',
    frequency: 'weekly',
    shops: [],
  });
  const [generating, setGenerating] = useState(false);

  const handleNext = useCallback(() => {
    if (currentStep < 3) {
      setCurrentStep((p) => p + 1);
    } else {
      handleGenerate();
    }
  }, [currentStep]);

  const handlePrevious = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep((p) => p - 1);
    }
  }, [currentStep]);

  const handleGenerate = useCallback(async () => {
    setGenerating(true);
    setTimeout(() => {
      console.log('Schedule generated with data:', formData);
      setGenerating(false);
      // Navigate to dashboard or show success message
    }, 2000);
  }, [formData]);

  return (
    <div className="flex w-full h-screen bg-[var(--bh-bg)]">
      {/* Sidebar */}
      <Sidebar>
        <SidebarTop>
          <SidebarLogo>
            <div className="w-full h-full rounded-full bg-[var(--bh-red)] flex items-center justify-center text-white font-bold">
              ST
            </div>
          </SidebarLogo>
          <SidebarNavItems>
            <button
              onClick={() => onNavigate?.('dashboard')}
              className="w-full flex items-center justify-center p-2 rounded hover:bg-[var(--bh-gray-600)]"
            >
              📊
            </button>
            <button
              onClick={() => onNavigate?.('calendar')}
              className="w-full flex items-center justify-center p-2 rounded hover:bg-[var(--bh-gray-600)]"
            >
              📅
            </button>
            <button
              onClick={() => onNavigate?.('generator')}
              className="w-full flex items-center justify-center p-2 rounded bg-[var(--bh-gray-600)]"
            >
              ⚙️
            </button>
            <button
              onClick={() => onNavigate?.('shops')}
              className="w-full flex items-center justify-center p-2 rounded hover:bg-[var(--bh-gray-600)]"
            >
              🏪
            </button>
            <button
              onClick={() => onNavigate?.('map')}
              className="w-full flex items-center justify-center p-2 rounded hover:bg-[var(--bh-gray-600)]"
            >
              🗺️
            </button>
          </SidebarNavItems>
        </SidebarTop>
        <SidebarBottom>
          <SidebarAvatar>
            <div className="w-full h-full rounded-[20px] bg-[var(--bh-blue)] flex items-center justify-center text-white font-bold text-sm">
              JD
            </div>
          </SidebarAvatar>
        </SidebarBottom>
      </Sidebar>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Page Header */}
        <div className="px-12 pt-8 border-b border-[var(--border)]">
          <PageHeader>
            <HeaderLeft>
              <h1 className="text-2xl font-bold text-[var(--bh-black)]">Schedule Generator</h1>
              <p className="text-sm text-[var(--bh-gray-700)]">Create optimized stock take schedules</p>
            </HeaderLeft>
          </PageHeader>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-12 flex flex-col gap-8">
          {/* Wizard Steps */}
          <div className="flex items-center justify-between gap-5">
            <Step number={1} label="Select Shops" active={currentStep === 1} completed={currentStep > 1} />
            <div className={`h-1 flex-1 ${currentStep > 1 ? 'bg-[var(--bh-black)]' : 'bg-[var(--bh-gray-600)]'}`} />
            <Step number={2} label="Settings" active={currentStep === 2} completed={currentStep > 2} />
            <div className={`h-1 flex-1 ${currentStep > 2 ? 'bg-[var(--bh-black)]' : 'bg-[var(--bh-gray-600)]'}`} />
            <Step number={3} label="Review" active={currentStep === 3} />
          </div>

          {/* Form Container */}
          <div className="flex-1 grid grid-cols-[1fr_400px] gap-8">
            {/* Form Left */}
            <div className="space-y-6 flex flex-col bg-white p-8 rounded-lg border-2 border-[var(--bh-black)]">
              {currentStep === 1 && (
                <div className="space-y-4">
                  <h2 className="text-xl font-bold text-[var(--bh-black)]">Select Shops</h2>
                  <p className="text-sm text-[var(--bh-gray-700)]">Choose which shops to include in the schedule</p>
                  <div className="space-y-2">
                    {['Central Plaza', 'Victoria Park', 'Times Square', 'Harbour Road', 'Mong Kok Plaza'].map((shop) => (
                      <label key={shop} className="flex items-center gap-3 cursor-pointer p-2 hover:bg-[var(--bh-bg)] rounded">
                        <input type="checkbox" className="w-4 h-4" />
                        <span className="text-sm text-[var(--bh-black)]">{shop}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-6">
                  <h2 className="text-xl font-bold text-[var(--bh-black)]">Configure Settings</h2>

                  <div>
                    <label className="block text-sm font-medium text-[var(--bh-black)] mb-2">Start Date</label>
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      className="w-full px-3 py-2 border-2 border-[var(--bh-black)] rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[var(--bh-black)] mb-2">Frequency</label>
                    <select
                      value={formData.frequency}
                      onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                      className="w-full px-3 py-2 border-2 border-[var(--bh-black)] rounded-lg"
                    >
                      <option>weekly</option>
                      <option>bi-weekly</option>
                      <option>monthly</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[var(--bh-black)] mb-2">Cluster Count (K-Means)</label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={formData.clusterCount}
                      onChange={(e) => setFormData({ ...formData, clusterCount: e.target.value })}
                      className="w-full px-3 py-2 border-2 border-[var(--bh-black)] rounded-lg"
                    />
                  </div>
                </div>
              )}

              {currentStep === 3 && (
                <div className="space-y-4">
                  <h2 className="text-xl font-bold text-[var(--bh-black)]">Review & Generate</h2>
                  <div className="bg-[var(--bh-bg)] p-4 rounded-lg space-y-2 text-sm">
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
                  <div className="bg-blue-50 border border-[var(--bh-blue)] rounded-lg p-4 flex gap-3">
                    <Info className="w-5 h-5 text-[var(--bh-blue)] flex-shrink-0 mt-1" />
                    <p className="text-sm text-[var(--bh-blue)]">
                      The system will use K-means clustering to optimize shop grouping by geographic proximity.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Form Right */}
            <div className="space-y-4 flex flex-col">
              <div className="bg-white p-6 rounded-lg border-2 border-[var(--bh-black)] space-y-4">
                <h3 className="font-bold text-[var(--bh-black)]">Progress</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span>Step {currentStep} of 3</span>
                    <span>{Math.round((currentStep / 3) * 100)}%</span>
                  </div>
                  <div className="w-full h-2 bg-[var(--bh-gray-600)] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[var(--primary)] transition-all"
                      style={{ width: `${(currentStep / 3) * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg border-2 border-[var(--bh-black)] space-y-4 flex-1">
                <h3 className="font-bold text-[var(--bh-black)]">Summary</h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">Shops:</span> 5
                  </div>
                  <div>
                    <span className="font-medium">Duration:</span> 12 weeks
                  </div>
                  <div>
                    <span className="font-medium">Total Schedules:</span> ~12
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <button
                  onClick={handleNext}
                  disabled={generating}
                  className="w-full px-4 py-3 bg-[var(--primary)] text-white rounded-lg font-bold hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {generating ? 'Generating...' : currentStep === 3 ? 'Generate Schedule' : 'Next'}
                  <ChevronRight className="w-4 h-4" />
                </button>
                {currentStep > 1 && (
                  <button
                    onClick={handlePrevious}
                    className="w-full px-4 py-2 border-2 border-[var(--bh-black)] text-[var(--bh-black)] rounded-lg font-bold hover:bg-[var(--secondary)]"
                  >
                    Previous
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GeneratorPage;
