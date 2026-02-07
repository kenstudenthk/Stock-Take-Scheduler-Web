import React, { useState, useMemo, useCallback } from 'react';
import { Sidebar, SidebarTop, SidebarBottom, SidebarLogo, SidebarNavItems, SidebarAvatar } from '../Sidebar';
import { PageHeader, HeaderLeft, HeaderRight } from '../PageHeader';
import { Search, X, Edit2, Trash2 } from 'lucide-react';

interface Shop {
  id: string;
  name: string;
  location: string;
  status: 'active' | 'pending' | 'closed' | 'rescheduled';
  schedule?: string;
  manager?: string;
  phone?: string;
}

interface FilterChipProps {
  label: string;
  onRemove?: () => void;
  isActive?: boolean;
}

const FilterChip: React.FC<FilterChipProps> = ({ label, onRemove, isActive }) => {
  return (
    <div
      className={`px-4 h-10 border-2 rounded-md flex items-center gap-2 cursor-pointer transition ${
        isActive ? 'border-[var(--bh-black)] bg-[var(--bh-black)] text-white' : 'border-[var(--bh-black)] text-[var(--bh-black)]'
      }`}
    >
      <span className="text-sm font-medium">{label}</span>
      {onRemove && isActive && <X className="w-3 h-3 cursor-pointer" onClick={onRemove} />}
    </div>
  );
};

interface ShopListPageProps {
  onNavigate?: (page: string) => void;
}

export const ShopListPage: React.FC<ShopListPageProps> = ({ onNavigate }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [editingShop, setEditingShop] = useState<string | null>(null);
  const itemsPerPage = 5;

  const allShops: Shop[] = [
    {
      id: '1',
      name: 'Central Plaza',
      location: 'Wan Chai',
      status: 'active',
      schedule: 'Mar 15, 2024',
      manager: 'John Doe',
    },
    {
      id: '2',
      name: 'Victoria Park',
      location: 'Causeway Bay',
      status: 'pending',
      schedule: 'Mar 16, 2024',
      manager: 'Jane Smith',
    },
    {
      id: '3',
      name: 'Times Square',
      location: 'Causeway Bay',
      status: 'active',
      schedule: 'Mar 17, 2024',
      manager: 'Mike Johnson',
    },
    {
      id: '4',
      name: 'Harbour Road',
      location: 'Wan Chai',
      status: 'rescheduled',
      schedule: 'Pending',
      manager: 'Sarah Lee',
    },
    {
      id: '5',
      name: 'Mong Kok Plaza',
      location: 'Mong Kok',
      status: 'closed',
      schedule: 'N/A',
      manager: 'Tom Wilson',
    },
    {
      id: '6',
      name: 'Festival Walk',
      location: 'Kowloon Tong',
      status: 'active',
      schedule: 'Mar 20, 2024',
      manager: 'Emily Chen',
    },
  ];

  const availableFilters = ['Active', 'Pending', 'Closed', 'Rescheduled'];

  const filteredShops = useMemo(() => {
    return allShops.filter((shop) => {
      const matchesSearch =
        shop.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        shop.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        shop.manager?.toLowerCase().includes(searchTerm.toLowerCase());

      if (activeFilters.length === 0) return matchesSearch;

      const matchesFilter = activeFilters.some(
        (filter) => shop.status.toLowerCase() === filter.toLowerCase()
      );

      return matchesSearch && matchesFilter;
    });
  }, [searchTerm, activeFilters]);

  const paginatedShops = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredShops.slice(start, start + itemsPerPage);
  }, [filteredShops, currentPage]);

  const totalPages = Math.ceil(filteredShops.length / itemsPerPage);

  const handleFilterToggle = useCallback((filter: string) => {
    setActiveFilters((prev) =>
      prev.includes(filter) ? prev.filter((f) => f !== filter) : [...prev, filter]
    );
    setCurrentPage(1);
  }, []);

  const handleClearFilters = useCallback(() => {
    setActiveFilters([]);
    setSearchTerm('');
    setCurrentPage(1);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-[var(--bh-success)]';
      case 'pending':
        return 'text-[var(--bh-yellow)]';
      case 'closed':
        return 'text-[var(--bh-red)]';
      case 'rescheduled':
        return 'text-[var(--bh-blue)]';
      default:
        return 'text-[var(--bh-gray-700)]';
    }
  };

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
              className="w-full flex items-center justify-center p-2 rounded hover:bg-[var(--bh-gray-600)]"
            >
              ⚙️
            </button>
            <button
              onClick={() => onNavigate?.('shops')}
              className="w-full flex items-center justify-center p-2 rounded bg-[var(--bh-gray-600)]"
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
              <h1 className="text-2xl font-bold text-[var(--bh-black)]">Shop List</h1>
              <p className="text-sm text-[var(--bh-gray-700)]">Manage and schedule your shops</p>
            </HeaderLeft>
            <HeaderRight>
              <button className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg font-medium hover:opacity-90">
                + Add Shop
              </button>
            </HeaderRight>
          </PageHeader>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-12 flex flex-col gap-8">
          {/* Search and Filter Row */}
          <div className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-4 top-3 w-5 h-5 text-[var(--bh-gray-700)]" />
              <input
                type="text"
                placeholder="Search shops, locations, or managers..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-12 pr-4 py-2 border-2 border-[var(--bh-black)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              />
            </div>

            {/* Filter Chips */}
            <div className="flex items-center gap-3 overflow-x-auto pb-2">
              {availableFilters.map((filter) => (
                <FilterChip
                  key={filter}
                  label={filter}
                  isActive={activeFilters.includes(filter)}
                  onRemove={() => handleFilterToggle(filter)}
                />
              ))}
              {(activeFilters.length > 0 || searchTerm) && (
                <div className="border-l border-[var(--border)] pl-3">
                  <button
                    onClick={handleClearFilters}
                    className="text-sm text-[var(--primary)] hover:underline font-medium"
                  >
                    Clear all
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Shop Table */}
          <div className="flex-1 border-2 border-[var(--bh-black)] rounded-lg overflow-hidden flex flex-col bg-white">
            {/* Table Header */}
            <div className="flex bg-[var(--bh-black)] text-white h-14 font-bold px-6 border-b-2 border-[var(--bh-black)]">
              {['Shop Name', 'Location', 'Manager', 'Status', 'Schedule', 'Action'].map((col) => (
                <div key={col} className={col === 'Schedule' ? 'w-32 flex items-center' : 'flex-1 flex items-center'}>
                  {col}
                </div>
              ))}
            </div>

            {/* Table Rows */}
            {paginatedShops.length > 0 ? (
              paginatedShops.map((shop) => (
                <div
                  key={shop.id}
                  className="flex items-center h-16 px-6 bg-white hover:bg-[var(--bh-bg)] border-b border-[var(--bh-border)] last:border-b-0"
                >
                  <div className="flex-1 font-semibold text-[var(--bh-black)]">{shop.name}</div>
                  <div className="flex-1 text-sm text-[var(--bh-gray-700)]">{shop.location}</div>
                  <div className="flex-1 text-sm text-[var(--bh-black)]">{shop.manager}</div>
                  <div className={`flex-1 text-sm font-medium ${getStatusColor(shop.status)}`}>
                    {shop.status.charAt(0).toUpperCase() + shop.status.slice(1)}
                  </div>
                  <div className="w-32 text-sm text-[var(--bh-gray-700)]">{shop.schedule}</div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditingShop(editingShop === shop.id ? null : shop.id)}
                      className="p-2 hover:bg-[var(--secondary)] rounded"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button className="p-2 hover:bg-[var(--secondary)] rounded" title="Delete">
                      <Trash2 className="w-4 h-4 text-[var(--bh-red)]" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex-1 flex items-center justify-center text-[var(--bh-gray-700)]">
                No shops found matching your criteria
              </div>
            )}

            {/* Table Footer */}
            <div className="flex items-center justify-between px-6 py-4 bg-white border-t-2 border-[var(--bh-black)]">
              <span className="text-sm text-[var(--bh-gray-700)]">
                Showing {paginatedShops.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}-
                {Math.min(currentPage * itemsPerPage, filteredShops.length)} of {filteredShops.length}
              </span>
              <div className="flex gap-2">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1 border-2 border-[var(--bh-black)] rounded hover:bg-[var(--secondary)] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="px-3 py-1 text-sm text-[var(--bh-gray-700)]">
                  Page {currentPage} of {Math.max(1, totalPages)}
                </span>
                <button
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="px-3 py-1 border-2 border-[var(--bh-black)] rounded hover:bg-[var(--secondary)] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShopListPage;
