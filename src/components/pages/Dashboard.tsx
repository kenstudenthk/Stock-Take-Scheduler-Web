import React, { useState, useCallback } from 'react';
import { Sidebar, SidebarTop, SidebarBottom, SidebarLogo, SidebarNavItems, SidebarAvatar } from '../Sidebar';
import { PageHeader, HeaderLeft, HeaderRight } from '../PageHeader';
import { X, Calendar, MoreVertical, ArrowRight } from 'lucide-react';

interface Shop {
  id: string;
  name: string;
  location: string;
  status: 'pending' | 'in-progress' | 'complete' | 'closed';
  scheduledDate?: string;
}

interface StockTake {
  id: string;
  shop: string;
  date: string;
  time: string;
  status: 'pending' | 'in-progress' | 'complete';
  assignedStaff?: string;
}

interface MetricCardProps {
  color: string;
  title?: string;
  value?: string;
  icon?: React.ReactNode;
}

const MetricCard: React.FC<MetricCardProps> = ({ color, title, value, icon }) => {
  return (
    <div className={`h-40 rounded-lg flex flex-col items-center justify-center ${color} gap-2`}>
      {icon && <div>{icon}</div>}
      {title && <div className="text-[var(--bh-black)] font-bold text-sm">{title}</div>}
      {value && <div className="text-[var(--bh-black)] text-3xl font-bold">{value}</div>}
    </div>
  );
};

interface DashboardProps {
  onNavigate?: (page: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const [showBanner, setShowBanner] = useState(true);
  const [selectedShop, setSelectedShop] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Mock data
  const stats = {
    pending: { title: 'Pending', value: '12', color: 'bg-[var(--bh-red)]' },
    inProgress: { title: 'In Progress', value: '8', color: 'bg-[var(--bh-blue)]' },
    complete: { title: 'Complete', value: '34', color: 'bg-[var(--bh-yellow)]' },
    total: { title: 'Total Shops', value: '54', color: 'bg-[var(--bh-black)]' },
  };

  const recentShops: Shop[] = [
    {
      id: '1',
      name: 'Central Plaza',
      location: 'Wan Chai',
      status: 'in-progress',
      scheduledDate: 'Mar 15, 2024',
    },
    {
      id: '2',
      name: 'Victoria Park',
      location: 'Causeway Bay',
      status: 'pending',
      scheduledDate: 'Mar 16, 2024',
    },
    {
      id: '3',
      name: 'Times Square',
      location: 'Causeway Bay',
      status: 'pending',
      scheduledDate: 'Mar 17, 2024',
    },
  ];

  const upcomingStockTakes: StockTake[] = [
    {
      id: '1',
      shop: 'Central Plaza',
      date: 'Mar 15, 2024',
      time: '09:00 - 12:00',
      status: 'in-progress',
      assignedStaff: 'John Doe',
    },
    {
      id: '2',
      shop: 'Victoria Park',
      date: 'Mar 16, 2024',
      time: '10:00 - 13:00',
      status: 'pending',
      assignedStaff: 'Jane Smith',
    },
    {
      id: '3',
      shop: 'Times Square',
      date: 'Mar 17, 2024',
      time: '14:00 - 17:00',
      status: 'pending',
      assignedStaff: 'Mike Johnson',
    },
    {
      id: '4',
      shop: 'Harbour Road',
      date: 'Mar 18, 2024',
      time: '09:00 - 12:00',
      status: 'pending',
      assignedStaff: 'Sarah Lee',
    },
  ];

  const handleShopAction = useCallback((shopId: string, action: 'reschedule' | 'pool' | 'close' | 'resume') => {
    setLoading(true);
    setTimeout(() => {
      console.log(`Action: ${action} for shop: ${shopId}`);
      setLoading(false);
    }, 500);
  }, []);

  const handleRefresh = useCallback(() => {
    setLoading(true);
    setTimeout(() => {
      console.log('Dashboard data refreshed');
      setLoading(false);
    }, 1000);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'text-[var(--bh-red)]';
      case 'in-progress':
        return 'text-[var(--bh-blue)]';
      case 'complete':
        return 'text-[var(--bh-success)]';
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
              title="Dashboard"
            >
              📊
            </button>
            <button
              onClick={() => onNavigate?.('calendar')}
              className="w-full flex items-center justify-center p-2 rounded hover:bg-[var(--bh-gray-600)]"
              title="Calendar"
            >
              📅
            </button>
            <button
              onClick={() => onNavigate?.('generator')}
              className="w-full flex items-center justify-center p-2 rounded hover:bg-[var(--bh-gray-600)]"
              title="Generator"
            >
              ⚙️
            </button>
            <button
              onClick={() => onNavigate?.('shops')}
              className="w-full flex items-center justify-center p-2 rounded hover:bg-[var(--bh-gray-600)]"
              title="Shops"
            >
              🏪
            </button>
            <button
              onClick={() => onNavigate?.('map')}
              className="w-full flex items-center justify-center p-2 rounded hover:bg-[var(--bh-gray-600)]"
              title="Map"
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
              <h1 className="text-2xl font-bold text-[var(--bh-black)]">Dashboard</h1>
              <p className="text-sm text-[var(--bh-gray-700)]">Welcome back! Here's your schedule overview.</p>
            </HeaderLeft>
            <HeaderRight>
              <button
                onClick={handleRefresh}
                disabled={loading}
                className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg font-medium hover:opacity-90 disabled:opacity-50"
              >
                {loading ? 'Refreshing...' : 'Refresh'}
              </button>
              <button
                onClick={() => onNavigate?.('settings')}
                className="w-10 h-10 flex items-center justify-center rounded-lg border border-[var(--border)] hover:bg-[var(--secondary)]"
              >
                ⚙️
              </button>
            </HeaderRight>
          </PageHeader>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-12">
          <div className="space-y-12">
            {/* Metrics Row */}
            <div className="grid grid-cols-4 gap-6">
              <MetricCard color={stats.pending.color} title={stats.pending.title} value={stats.pending.value} />
              <MetricCard
                color={stats.inProgress.color}
                title={stats.inProgress.title}
                value={stats.inProgress.value}
              />
              <MetricCard
                color={stats.complete.color}
                title={stats.complete.title}
                value={stats.complete.value}
              />
              <MetricCard color={stats.total.color} title={stats.total.title} value={stats.total.value} />
            </div>

            {/* Mid Section */}
            <div className="grid grid-cols-[1fr_400px] gap-6">
              {/* Chart Container */}
              <div className="border-2 border-[var(--bh-black)] p-8 rounded-lg bg-white space-y-6">
                <h3 className="text-lg font-bold text-[var(--bh-black)]">Schedule Overview</h3>
                <div className="h-40 flex items-center justify-center text-[var(--bh-gray-700)]">
                  📊 Chart visualization would go here
                </div>
              </div>

              {/* Recent Shops */}
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-[var(--bh-black)]">Recent Shops</h3>
                {recentShops.map((shop) => (
                  <div
                    key={shop.id}
                    className="p-3 bg-white border border-[var(--border)] rounded-lg cursor-pointer hover:shadow-md transition"
                    onClick={() => setSelectedShop(shop.id)}
                  >
                    <div className="font-semibold text-sm text-[var(--bh-black)]">{shop.name}</div>
                    <div className="text-xs text-[var(--bh-gray-700)]">{shop.location}</div>
                    <div className={`text-xs font-medium mt-1 ${getStatusColor(shop.status)}`}>
                      {shop.status.charAt(0).toUpperCase() + shop.status.slice(1)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Banner */}
            {showBanner && (
              <div className="flex items-center justify-between gap-6 bg-[var(--bh-yellow)] p-6 rounded-lg">
                <div className="flex items-center gap-4">
                  <span className="text-2xl">📢</span>
                  <div>
                    <div className="font-bold text-[var(--bh-black)]">Schedule Update</div>
                    <div className="text-sm text-[var(--bh-black)] opacity-80">
                      3 shops need rescheduling this week
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setShowBanner(false)}
                  className="p-2 hover:bg-black/10 rounded"
                  aria-label="Close banner"
                >
                  <X className="w-5 h-5 text-[var(--bh-black)]" />
                </button>
              </div>
            )}

            {/* Table Section */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-4xl font-bold tracking-wide text-[var(--bh-black)]">UPCOMING STOCK TAKES</h2>
                <button
                  onClick={() => onNavigate?.('generator')}
                  className="px-4 py-2 bg-[var(--bh-black)] text-white rounded-lg flex items-center gap-2 hover:opacity-90"
                >
                  Generate <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              <div className="border-2 border-[var(--bh-black)] rounded-lg bg-white overflow-hidden">
                {/* Table Header */}
                <div className="flex bg-[var(--bh-black)] text-white h-14 font-bold px-6 border-b-2 border-[var(--bh-black)]">
                  <div className="flex-1 flex items-center">Shop</div>
                  <div className="flex-1 flex items-center">Date</div>
                  <div className="flex-1 flex items-center">Time Slot</div>
                  <div className="flex-1 flex items-center">Staff</div>
                  <div className="w-20 flex items-center">Status</div>
                  <div className="w-16 flex items-center justify-end pr-4">Action</div>
                </div>

                {/* Table Rows */}
                {upcomingStockTakes.map((st) => (
                  <div
                    key={st.id}
                    className="flex items-center h-16 px-6 bg-white hover:bg-[var(--bh-bg)] border-b border-[var(--bh-border)] last:border-b-0"
                  >
                    <div className="flex-1 font-semibold text-[var(--bh-black)]">{st.shop}</div>
                    <div className="flex-1 text-sm text-[var(--bh-gray-700)]">{st.date}</div>
                    <div className="flex-1 text-sm text-[var(--bh-gray-700)]">{st.time}</div>
                    <div className="flex-1 text-sm text-[var(--bh-black)]">{st.assignedStaff}</div>
                    <div className={`w-20 text-xs font-medium ${getStatusColor(st.status)}`}>
                      {st.status.charAt(0).toUpperCase() + st.status.slice(1)}
                    </div>
                    <div className="w-16 flex items-center justify-end">
                      <div className="relative group">
                        <button className="p-2 hover:bg-[var(--secondary)] rounded">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                        <div className="absolute right-0 top-full mt-1 bg-white border border-[var(--border)] rounded shadow-lg hidden group-hover:block z-10">
                          <button
                            onClick={() => handleShopAction(st.shop, 'reschedule')}
                            className="w-full text-left px-4 py-2 text-sm hover:bg-[var(--secondary)]"
                          >
                            Reschedule
                          </button>
                          <button
                            onClick={() => handleShopAction(st.shop, 'pool')}
                            className="w-full text-left px-4 py-2 text-sm hover:bg-[var(--secondary)]"
                          >
                            Move to Pool
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-[var(--bh-gray-700)]">Showing 1-4 of 54</span>
                <div className="flex gap-2">
                  <button className="px-4 py-2 border-2 border-[var(--bh-black)] rounded text-[var(--bh-black)] hover:bg-[var(--secondary)]">
                    Previous
                  </button>
                  <button className="px-4 py-2 border-2 border-[var(--bh-black)] rounded text-[var(--bh-black)] hover:bg-[var(--secondary)]">
                    Next
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
