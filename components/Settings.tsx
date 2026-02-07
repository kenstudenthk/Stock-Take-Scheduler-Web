import React, { useState } from 'react';
import { Save, Eye, EyeOff, Lock } from 'lucide-react';

interface SettingsProps {
  token: string;
  onUpdateToken: (token: string) => void;
  invToken: string;
  onUpdateInvToken: (token: string) => void;
}

export const Settings: React.FC<SettingsProps> = ({
  token,
  onUpdateToken,
  invToken,
  onUpdateInvToken,
}) => {
  const [showGraphToken, setShowGraphToken] = useState(false);
  const [showInvToken, setShowInvToken] = useState(false);
  const [graphToken, setGraphToken] = useState(token);
  const [invTokenValue, setInvTokenValue] = useState(invToken);
  const [saving, setSaving] = useState(false);

  const handleSaveGraphToken = () => {
    setSaving(true);
    setTimeout(() => {
      onUpdateToken(graphToken);
      setSaving(false);
    }, 500);
  };

  const handleSaveInvToken = () => {
    setSaving(true);
    setTimeout(() => {
      onUpdateInvToken(invTokenValue);
      setSaving(false);
    }, 500);
  };

  return (
    <div className="p-8 space-y-8 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600">Manage your authentication tokens</p>
      </div>

      <div className="bg-white rounded-lg border shadow-sm p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Lock className="w-5 h-5 text-blue-600" />
          <h2 className="text-xl font-bold text-gray-900">SharePoint Graph Token</h2>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">Token</label>
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <input
                type={showGraphToken ? 'text' : 'password'}
                value={graphToken}
                onChange={e => setGraphToken(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
              <button
                onClick={() => setShowGraphToken(!showGraphToken)}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                {showGraphToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <button
              onClick={handleSaveGraphToken}
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              Save
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border shadow-sm p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Lock className="w-5 h-5 text-green-600" />
          <h2 className="text-xl font-bold text-gray-900">Inventory Token</h2>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">Token</label>
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <input
                type={showInvToken ? 'text' : 'password'}
                value={invTokenValue}
                onChange={e => setInvTokenValue(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
              />
              <button
                onClick={() => setShowInvToken(!showInvToken)}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                {showInvToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <button
              onClick={handleSaveInvToken}
              disabled={saving}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
