import React, { useState, useMemo } from 'react';
import { Shop, User } from '../types';

interface DashboardProps {
  shops: Shop[];
  graphToken: string;
  onRefresh: () => void;
  onUpdateShop?: (shop: Shop) => void;
  currentUser?: User;
}

interface MetricCardProps {
  label: string;
  value: number;
  color: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ label, value, color }) => (
  <div className={`flex-1 p-6 rounded-lg ${color} flex flex-col gap-2`}>
    <span className="text-sm font-medium text-gray-600">{label}</span>
    <span className="text-3xl font-bold text-gray-900">{value}</span>
  </div>
);

export const Dashboard: React.FC<DashboardProps> = ({ shops, graphToken, onRefresh, currentUser }) => {
  const [showBanner, setShowBanner] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4;

  // Calculate stats from real data
  const stats = useMemo(() => {
    const scheduled = shops.filter(s => ['Scheduled', 'In-Progress'].includes(s.status || '')).length;
    const completed = shops.filter(s => s.status === 'Completed').length;
    const closed = shops.filter(s => s.status === 'Closed').length;
    const remaining = shops.filter(s => s.status === 'Unplanned').length;

    return { scheduled, completed, closed, remaining };
  }, [shops]);

  const paginatedShops = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return shops.slice(start, start + itemsPerPage);
  }, [shops, currentPage]);

  const totalPages = Math.ceil(shops.length / itemsPerPage);

  const getStatusBadge = (status: string | undefined) => {
    const statusMap: Record<string, string> = {
      'Scheduled': 'bg-blue-100 text-blue-800',
      'In-Progress': 'bg-amber-100 text-amber-800',
      'Completed': 'bg-green-100 text-green-800',
      'Closed': 'bg-red-100 text-red-800',
      'Unplanned': 'bg-gray-100 text-gray-800',
    };
    return statusMap[status || ''] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Overview of your stock take operations</p>
      </div>

      {/* Banner */}
      {showBanner && (
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded flex justify-between items-start">
          <div>
            <p className="font-semibold text-blue-900">Schedule Optimization Available</p>
            <p className="text-sm text-blue-700">Use the generator to create K-means optimized schedules</p>
          </div>
          <button onClick={() => setShowBanner(false)} className="text-blue-400 hover:text-blue-600">
            ✕
          </button>
        </div>
      )}

      {/* Metrics */}
      <div className="grid grid-cols-4 gap-4">
        <MetricCard label="Scheduled" value={stats.scheduled} color="bg-blue-50" />
        <MetricCard label="Completed" value={stats.completed} color="bg-green-50" />
        <MetricCard label="Closed" value={stats.closed} color="bg-red-50" />
        <MetricCard label="Remaining" value={stats.remaining} color="bg-yellow-50" />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-[250px_1fr] gap-6">
        {/* Sidebar */}
        <div className="bg-white rounded-lg border shadow-sm p-4 space-y-4">
          <h3 className="font-bold text-gray-900">Actions</h3>
          <button
            onClick={onRefresh}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            Refresh Data
          </button>
          <div className="text-xs text-gray-500 space-y-1">
            <p>Total Shops: {shops.length}</p>
            <p>User: {currentUser?.Name}</p>
            <p>Role: {currentUser?.UserRole}</p>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg border shadow-sm overflow-hidden flex flex-col">
          {/* Table Header */}
          <div className="grid grid-cols-[2fr_1fr_1fr_1fr] gap-4 bg-gray-900 text-white p-4 font-bold text-sm">
            <div>Shop Name</div>
            <div>Status</div>
            <div>Scheduled Date</div>
            <div>Action</div>
          </div>

          {/* Table Body */}
          <div className="flex-1 overflow-y-auto">
            {paginatedShops.length > 0 ? (
              paginatedShops.map((shop) => (
                <div key={shop.id} className="grid grid-cols-[2fr_1fr_1fr_1fr] gap-4 p-4 border-b hover:bg-gray-50">
                  <div className="font-medium text-gray-900">{shop.name}</div>
                  <div>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadge(shop.status)}`}>
                      {shop.status || 'Unplanned'}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">{shop.scheduledDate || '—'}</div>
                  <div className="text-sm">
                    <button className="text-blue-600 hover:text-blue-800">More</button>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-gray-500">No shops found</div>
            )}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between p-4 border-t bg-gray-50">
            <span className="text-sm text-gray-600">
              Page {currentPage} of {Math.max(1, totalPages)}
            </span>
            <div className="flex gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                className="px-3 py-1 border rounded hover:bg-gray-100 disabled:opacity-50 text-sm"
              >
                Previous
              </button>
              <button
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                className="px-3 py-1 border rounded hover:bg-gray-100 disabled:opacity-50 text-sm"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
