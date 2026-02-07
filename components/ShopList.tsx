import React, { useState, useMemo } from 'react';
import { Shop, User } from '../types';

interface ShopListProps {
  shops: Shop[];
  graphToken: string;
  onRefresh: () => void;
  currentUser?: User;
}

export const ShopList: React.FC<ShopListProps> = ({ shops, onRefresh, currentUser }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const availableFilters = ['Scheduled', 'In-Progress', 'Completed', 'Closed', 'Unplanned'];

  const filteredShops = useMemo(() => {
    return shops.filter(shop => {
      const matchesSearch =
        shop.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        shop.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        shop.contactName?.toLowerCase().includes(searchTerm.toLowerCase());

      if (activeFilters.length === 0) return matchesSearch;

      return matchesSearch && activeFilters.includes(shop.status || 'Unplanned');
    });
  }, [shops, searchTerm, activeFilters]);

  const paginatedShops = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredShops.slice(start, start + itemsPerPage);
  }, [filteredShops, currentPage]);

  const totalPages = Math.ceil(filteredShops.length / itemsPerPage);

  const getStatusColor = (status: string | undefined) => {
    const colors: Record<string, string> = {
      'Scheduled': 'bg-blue-100 text-blue-800',
      'In-Progress': 'bg-amber-100 text-amber-800',
      'Completed': 'bg-green-100 text-green-800',
      'Closed': 'bg-red-100 text-red-800',
      'Unplanned': 'bg-gray-100 text-gray-800',
    };
    return colors[status || 'Unplanned'] || 'bg-gray-100 text-gray-800';
  };

  const handleFilterToggle = (filter: string) => {
    setActiveFilters(prev =>
      prev.includes(filter)
        ? prev.filter(f => f !== filter)
        : [...prev, filter]
    );
    setCurrentPage(1);
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Shop List</h1>
        <p className="text-gray-600">Manage and schedule your shops</p>
      </div>

      {/* Search & Filters */}
      <div className="space-y-4">
        <input
          type="text"
          placeholder="Search shops, locations, or managers..."
          value={searchTerm}
          onChange={e => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }}
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
        />

        <div className="flex flex-wrap gap-2">
          {availableFilters.map(filter => (
            <button
              key={filter}
              onClick={() => handleFilterToggle(filter)}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                activeFilters.includes(filter)
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
              }`}
            >
              {filter}
            </button>
          ))}
          {(activeFilters.length > 0 || searchTerm) && (
            <button
              onClick={() => {
                setActiveFilters([]);
                setSearchTerm('');
                setCurrentPage(1);
              }}
              className="px-4 py-2 text-blue-600 hover:text-blue-800 font-medium"
            >
              Clear all
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border shadow-sm overflow-hidden flex flex-col">
        {/* Header */}
        <div className="grid grid-cols-[2fr_1fr_1.5fr_1.5fr_1fr] gap-4 bg-gray-900 text-white p-4 font-bold text-sm">
          <div>Shop Name</div>
          <div>Location</div>
          <div>Manager</div>
          <div>Status</div>
          <div>Schedule</div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {paginatedShops.length > 0 ? (
            paginatedShops.map(shop => (
              <div key={shop.id} className="grid grid-cols-[2fr_1fr_1.5fr_1.5fr_1fr] gap-4 p-4 border-b hover:bg-gray-50">
                <div className="font-medium text-gray-900">{shop.name}</div>
                <div className="text-sm text-gray-600">{shop.address}</div>
                <div className="text-sm text-gray-600">{shop.contactName || '—'}</div>
                <div>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(shop.status)}`}>
                    {shop.status || 'Unplanned'}
                  </span>
                </div>
                <div className="text-sm text-gray-600">{shop.scheduledDate || '—'}</div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-gray-500">No shops found</div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t bg-gray-50">
          <span className="text-sm text-gray-600">
            Showing {paginatedShops.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}-
            {Math.min(currentPage * itemsPerPage, filteredShops.length)} of {filteredShops.length}
          </span>
          <div className="flex gap-2">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              className="px-3 py-1 border rounded hover:bg-white disabled:opacity-50 text-sm"
            >
              Previous
            </button>
            <span className="px-3 py-1 text-sm text-gray-600">
              Page {currentPage} of {Math.max(1, totalPages)}
            </span>
            <button
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              className="px-3 py-1 border rounded hover:bg-white disabled:opacity-50 text-sm"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Refresh Button */}
      <button
        onClick={onRefresh}
        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
      >
        Refresh Data
      </button>
    </div>
  );
};

export default ShopList;
