import React, { useState, useMemo } from 'react';
import { Search, Package, AlertTriangle } from 'lucide-react';
import { Shop } from '../types';

interface InventoryProps {
  invToken: string;
  shops: Shop[];
}

interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  location: string;
  status: 'in-stock' | 'low' | 'out';
}

export const Inventory: React.FC<InventoryProps> = ({ invToken, shops }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedShop, setSelectedShop] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const mockInventory: InventoryItem[] = [
    { id: '1', name: 'Stock Checker A', quantity: 45, location: 'Central Plaza', status: 'in-stock' },
    { id: '2', name: 'Stock Checker B', quantity: 12, location: 'Victoria Park', status: 'low' },
    { id: '3', name: 'Scanner Device', quantity: 0, location: 'Times Square', status: 'out' },
    { id: '4', name: 'Printer Paper', quantity: 200, location: 'Central Plaza', status: 'in-stock' },
  ];

  const filteredItems = useMemo(() => {
    return mockInventory.filter(item => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.location.toLowerCase().includes(searchTerm.toLowerCase());
      if (selectedShop) return matchesSearch && item.location === selectedShop;
      return matchesSearch;
    });
  }, [searchTerm, selectedShop]);

  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredItems.slice(start, start + itemsPerPage);
  }, [filteredItems, currentPage]);

  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in-stock':
        return 'bg-green-100 text-green-800';
      case 'low':
        return 'bg-yellow-100 text-yellow-800';
      case 'out':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Inventory</h1>
        <p className="text-gray-600">Manage equipment and supplies across shops</p>
      </div>

      {/* Search & Filters */}
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search items or locations..."
            value={searchTerm}
            onChange={e => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>

        {shops.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => {
                setSelectedShop(null);
                setCurrentPage(1);
              }}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                selectedShop === null
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
              }`}
            >
              All Shops
            </button>
            {shops.slice(0, 5).map(shop => (
              <button
                key={shop.id}
                onClick={() => {
                  setSelectedShop(shop.name);
                  setCurrentPage(1);
                }}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  selectedShop === shop.name
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                }`}
              >
                {shop.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Alert */}
      {filteredItems.some(item => item.status === 'low' || item.status === 'out') && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex gap-3">
          <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-yellow-900">Low Stock Alert</p>
            <p className="text-sm text-yellow-800">
              {filteredItems.filter(i => i.status === 'low' || i.status === 'out').length} items need attention
            </p>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
        <div className="grid grid-cols-[2fr_1fr_1fr_200px] gap-4 bg-gray-900 text-white p-4 font-bold text-sm">
          <div>Item Name</div>
          <div>Location</div>
          <div>Quantity</div>
          <div>Status</div>
        </div>

        <div className="divide-y">
          {paginatedItems.length > 0 ? (
            paginatedItems.map(item => (
              <div key={item.id} className="grid grid-cols-[2fr_1fr_1fr_200px] gap-4 p-4 hover:bg-gray-50">
                <div className="font-medium text-gray-900">{item.name}</div>
                <div className="text-sm text-gray-600">{item.location}</div>
                <div className="text-sm text-gray-900 font-medium">{item.quantity}</div>
                <span className={`px-2 py-1 rounded text-xs font-medium w-fit ${getStatusColor(item.status)}`}>
                  {item.status === 'in-stock' ? 'In Stock' : item.status === 'low' ? 'Low Stock' : 'Out of Stock'}
                </span>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-gray-500">No items found</div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t bg-gray-50">
            <span className="text-sm text-gray-600">Page {currentPage} of {totalPages}</span>
            <div className="flex gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                className="px-3 py-1 border rounded hover:bg-white disabled:opacity-50 text-sm"
              >
                Previous
              </button>
              <button
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                className="px-3 py-1 border rounded hover:bg-white disabled:opacity-50 text-sm"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Inventory;
