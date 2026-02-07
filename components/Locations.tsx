import React, { useState, useMemo } from 'react';
import { MapPin, Filter, List } from 'lucide-react';
import { Shop } from '../types';

interface LocationsProps {
  shops: Shop[];
}

export const Locations: React.FC<LocationsProps> = ({ shops }) => {
  const [selectedMarker, setSelectedMarker] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [filters, setFilters] = useState({
    status: '',
    region: '',
  });

  const filteredShops = useMemo(() => {
    return shops.filter(shop => {
      if (filters.status && shop.status !== filters.status) return false;
      if (filters.region && shop.region !== filters.region) return false;
      return true;
    });
  }, [shops, filters]);

  const regions = Array.from(new Set(shops.map(s => s.region).filter(Boolean)));
  const statuses = Array.from(new Set(shops.map(s => s.status).filter(Boolean)));

  const getStatusColor = (status: string | undefined) => {
    switch (status) {
      case 'Scheduled':
        return 'bg-blue-500';
      case 'In-Progress':
        return 'bg-amber-500';
      case 'Completed':
        return 'bg-green-500';
      case 'Closed':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="p-8 space-y-6 h-full overflow-hidden flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Map View</h1>
          <p className="text-gray-600">View all shops on map</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('map')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              viewMode === 'map'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
            }`}
          >
            <MapPin className="w-4 h-4 inline mr-2" />
            Map
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              viewMode === 'list'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
            }`}
          >
            <List className="w-4 h-4 inline mr-2" />
            List
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <select
          value={filters.status}
          onChange={e => setFilters({ ...filters, status: e.target.value })}
          className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
        >
          <option value="">All Statuses</option>
          {statuses.map(status => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>

        <select
          value={filters.region}
          onChange={e => setFilters({ ...filters, region: e.target.value })}
          className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
        >
          <option value="">All Regions</option>
          {regions.map(region => (
            <option key={region} value={region}>
              {region}
            </option>
          ))}
        </select>

        {(filters.status || filters.region) && (
          <button
            onClick={() => setFilters({ status: '', region: '' })}
            className="px-4 py-2 text-blue-600 hover:text-blue-800 font-medium"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Map/List Content */}
      <div className="flex-1 grid grid-cols-[1fr_350px] gap-6 overflow-hidden">
        {/* Main Area */}
        <div className="bg-white rounded-lg border shadow-sm overflow-hidden flex flex-col">
          {viewMode === 'map' ? (
            <div className="flex-1 bg-gray-100 flex items-center justify-center">
              <div className="text-center text-gray-500">
                <MapPin className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Map view requires AMap integration</p>
                <p className="text-sm mt-1">{filteredShops.length} shops loaded</p>
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto">
              {filteredShops.length > 0 ? (
                <div className="divide-y">
                  {filteredShops.map(shop => (
                    <div
                      key={shop.id}
                      onClick={() => setSelectedMarker(shop.id)}
                      className={`p-4 cursor-pointer hover:bg-gray-50 transition border-l-4 ${
                        selectedMarker === shop.id
                          ? 'border-blue-600 bg-blue-50'
                          : `border-transparent ${getStatusColor(shop.status)}`
                      }`}
                    >
                      <p className="font-bold text-gray-900">{shop.name}</p>
                      <p className="text-sm text-gray-600">{shop.address}</p>
                      <span className={`inline-block mt-2 px-2 py-1 rounded text-xs font-medium text-white ${getStatusColor(shop.status)}`}>
                        {shop.status || 'Unknown'}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  No shops match the selected filters
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="bg-white rounded-lg border shadow-sm p-4 overflow-y-auto">
          <h3 className="font-bold text-gray-900 mb-4">
            {selectedMarker ? 'Shop Details' : 'Select a Shop'}
          </h3>

          {selectedMarker && (
            <div className="space-y-4">
              {filteredShops
                .filter(s => s.id === selectedMarker)
                .map(shop => (
                  <div key={shop.id} className="space-y-3 text-sm">
                    <div>
                      <p className="font-medium text-gray-900">{shop.name}</p>
                      <p className="text-gray-600">{shop.address}</p>
                    </div>
                    <div className="border-t pt-3 space-y-2">
                      <div>
                        <p className="text-gray-600">Region</p>
                        <p className="font-medium text-gray-900">{shop.region || '—'}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">District</p>
                        <p className="font-medium text-gray-900">{shop.district || '—'}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Status</p>
                        <span className={`inline-block px-2 py-1 rounded text-xs font-medium text-white ${getStatusColor(shop.status)}`}>
                          {shop.status || 'Unplanned'}
                        </span>
                      </div>
                      {shop.scheduledDate && (
                        <div>
                          <p className="text-gray-600">Scheduled Date</p>
                          <p className="font-medium text-gray-900">{shop.scheduledDate}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          )}

          <div className="mt-6 pt-4 border-t">
            <p className="text-xs text-gray-500">
              Total shops: {filteredShops.length}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Locations;
