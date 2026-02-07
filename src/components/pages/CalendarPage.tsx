import React, { useState, useCallback } from 'react';
import { Sidebar, SidebarTop, SidebarBottom, SidebarLogo, SidebarNavItems, SidebarAvatar } from '../Sidebar';
import { PageHeader, HeaderLeft, HeaderRight } from '../PageHeader';
import { ChevronLeft, ChevronRight, Download } from 'lucide-react';

interface CalendarEvent {
  date: string;
  status: 'pending' | 'in-progress' | 'complete';
  shop?: string;
}

interface LegendItemProps {
  color: string;
  label: string;
  count?: number;
}

const LegendItem: React.FC<LegendItemProps> = ({ color, label, count }) => {
  return (
    <div className="flex items-center gap-2">
      <div className={`w-4 h-4 rounded ${color}`} />
      <span className="text-sm text-[var(--bh-black)]">{label}</span>
      {count !== undefined && <span className="text-xs text-[var(--bh-gray-700)] ml-2">({count})</span>}
    </div>
  );
};

interface CalendarPageProps {
  onNavigate?: (page: string) => void;
}

export const CalendarPage: React.FC<CalendarPageProps> = ({ onNavigate }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date(2024, 2)); // March 2024
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Mock events data
  const events: CalendarEvent[] = [
    { date: '2024-03-01', status: 'complete' },
    { date: '2024-03-02', status: 'complete' },
    { date: '2024-03-05', status: 'in-progress', shop: 'Central Plaza' },
    { date: '2024-03-06', status: 'pending', shop: 'Victoria Park' },
    { date: '2024-03-15', status: 'in-progress', shop: 'Times Square' },
    { date: '2024-03-16', status: 'pending', shop: 'Harbour Road' },
  ];

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const handlePrevMonth = useCallback(() => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  }, [currentMonth]);

  const handleNextMonth = useCallback(() => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  }, [currentMonth]);

  const handleExport = useCallback(() => {
    console.log('Exporting calendar data...');
    // Export functionality would go here
  }, []);

  const getEventForDate = (day: number) => {
    const dateStr = `2024-03-${String(day).padStart(2, '0')}`;
    return events.find((e) => e.date === dateStr);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-[var(--bh-red)]';
      case 'in-progress':
        return 'bg-[var(--bh-blue)]';
      case 'complete':
        return 'bg-[var(--bh-yellow)]';
      default:
        return 'bg-gray-200';
    }
  };

  const daysInMonth = getDaysInMonth(currentMonth);
  const firstDay = getFirstDayOfMonth(currentMonth);
  const calendarDays = [];

  for (let i = 0; i < firstDay; i++) {
    calendarDays.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push(i);
  }

  const monthName = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

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
              className="w-full flex items-center justify-center p-2 rounded bg-[var(--bh-gray-600)]"
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
              <h1 className="text-2xl font-bold text-[var(--bh-black)]">Calendar</h1>
              <p className="text-sm text-[var(--bh-gray-700)]">Schedule overview for {monthName}</p>
            </HeaderLeft>
            <HeaderRight>
              <button
                onClick={handleExport}
                className="px-4 py-2 border-2 border-[var(--bh-black)] text-[var(--bh-black)] rounded-lg font-medium hover:bg-[var(--secondary)] flex items-center gap-2"
              >
                <Download className="w-4 h-4" /> Export
              </button>
            </HeaderRight>
          </PageHeader>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-12 flex flex-col gap-8">
          {/* Legend */}
          <div className="flex items-center gap-8 bg-white p-4 rounded-lg border border-[var(--border)]">
            <LegendItem color="bg-[var(--bh-red)]" label="Pending" count={8} />
            <LegendItem color="bg-[var(--bh-blue)]" label="In Progress" count={3} />
            <LegendItem color="bg-[var(--bh-yellow)]" label="Completed" count={12} />
          </div>

          {/* Calendar Grid */}
          <div className="flex-1 border-2 border-[var(--bh-black)] rounded-lg overflow-hidden flex flex-col bg-white">
            {/* Month Navigation */}
            <div className="flex items-center justify-between px-6 py-4 border-b-2 border-[var(--bh-black)]">
              <button onClick={handlePrevMonth} className="p-2 hover:bg-[var(--secondary)] rounded">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <h2 className="text-xl font-bold text-[var(--bh-black)]">{monthName}</h2>
              <button onClick={handleNextMonth} className="p-2 hover:bg-[var(--secondary)] rounded">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Day Headers */}
            <div className="flex bg-[var(--bh-black)] text-white h-14 font-bold border-b-2 border-[var(--bh-black)]">
              {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day) => (
                <div key={day} className="flex-1 flex items-center justify-center border-r border-white last:border-r-0">
                  {day.slice(0, 3)}
                </div>
              ))}
            </div>

            {/* Calendar Body */}
            <div className="flex-1 grid grid-cols-7 gap-px bg-[var(--bh-black)] p-px">
              {calendarDays.map((day, idx) => (
                <div
                  key={idx}
                  className="bg-white p-2 min-h-24 cursor-pointer hover:bg-[var(--bh-bg)] border border-[var(--bh-black)]"
                  onClick={() => day && setSelectedDate(`2024-03-${String(day).padStart(2, '0')}`)}
                >
                  {day && (
                    <div className="space-y-1">
                      <div className="text-xs font-bold text-[var(--bh-black)]">{day}</div>
                      {getEventForDate(day) && (
                        <div className={`text-xs p-1 rounded text-white ${getStatusColor(getEventForDate(day)!.status)}`}>
                          {getEventForDate(day)!.shop || 'Event'}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Selected Date Details */}
          {selectedDate && (
            <div className="p-6 bg-white border-2 border-[var(--bh-black)] rounded-lg">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-[var(--bh-black)]">Events for {selectedDate}</h3>
                <button
                  onClick={() => setSelectedDate(null)}
                  className="text-sm text-[var(--primary)] hover:underline"
                >
                  Clear
                </button>
              </div>
              <div className="mt-3 text-sm text-[var(--bh-gray-700)]">
                {events.find((e) => e.date === selectedDate)
                  ? `${events.find((e) => e.date === selectedDate)!.shop || 'Stock take'} - ${events
                      .find((e) => e.date === selectedDate)!
                      .status.charAt(0)
                      .toUpperCase() + events.find((e) => e.date === selectedDate)!.status.slice(1)}`
                  : 'No events scheduled'}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CalendarPage;
