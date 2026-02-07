import React, { useState } from 'react';
import { AlertCircle, X, Send } from 'lucide-react';

interface ErrorReportProps {
  visible: boolean;
  onClose: () => void;
}

export const ErrorReport: React.FC<ErrorReportProps> = ({ visible, onClose }) => {
  const [description, setDescription] = useState('');
  const [sending, setSending] = useState(false);

  const handleSubmit = async () => {
    if (!description.trim()) return;
    setSending(true);
    setTimeout(() => {
      console.log('Error report submitted:', description);
      setDescription('');
      setSending(false);
      onClose();
      alert('Thank you for reporting the issue!');
    }, 1000);
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b p-6">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <h2 className="text-lg font-bold text-gray-900">Report an Issue</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Describe the issue
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Tell us what went wrong..."
              rows={4}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-2 p-6 border-t">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50 font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!description.trim() || sending}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 font-medium flex items-center justify-center gap-2"
          >
            <Send className="w-4 h-4" />
            {sending ? 'Sending...' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ErrorReport;
