import React, { useState, useMemo } from 'react';
import dayjs, { Dayjs } from 'dayjs';
import { Shop } from '../types';

interface CalendarProps {
  shops: Shop[];
  graphToken: string;
  onRefresh: () => void;
}

export const Calendar: React.FC<CalendarProps> = ({ shops, graphToken, onRefresh }) => {
  const [currentDate, setCurrentDate] = useState(dayjs());
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(null);

  const monthStart = currentDate.startOf('month');
  const monthEnd = currentDate.endOf('month');
  const startDate = monthStart.startOf('week');
  const endDate = monthEnd.endOf('week');

  // Get all dates in calendar grid
  const dates = useMemo(() => {
    const result: Dayjs[] = [];
    let current = startDate;
    while (current.isBefore(endDate) || current.isSame(endDate, 'day')) {
      result.push(current);
      current = current.add(1, 'day');
    }
    return result;
  }, [startDate, endDate]);

  // Get events for selected date
  const selectedDateEvents = useMemo(() => {
    if (!selectedDate) return [];
    return shops.filter(shop => {
      if (!shop.scheduledDate) return false;
      const shopDate = dayjs(shop.scheduledDate);
      return shopDate.isSame(selectedDate, 'day');
    });
  }, [selectedDate, shops]);

  const getEventColor = (status: string | undefined) => {
    switch (status) {
      case 'Scheduled': return 'bg-blue-500';
      case 'In-Progress': return 'bg-amber-500';
      case 'Completed': return 'bg-green-500';
      case 'Closed': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Calendar</h1>
          <p className="text-gray-600">View scheduled stock takes</p>
        </div>
        <button
          onClick={onRefresh}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Refresh
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-[1fr_300px] gap-6">
        {/* Main Calendar */}
        <div className="bg-white rounded-lg border shadow-sm p-6 space-y-4">
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setCurrentDate(currentDate.subtract(1, 'month'))}
              className="px-3 py-1 border rounded hover:bg-gray-100"
            >
              ← Previous
            </button>
            <h2 className="text-xl font-bold text-gray-900">
              {currentDate.format('MMMM YYYY')}
            </h2>
            <button
              onClick={() => setCurrentDate(currentDate.add(1, 'month'))}
              className="px-3 py-1 border rounded hover:bg-gray-100"
            >
              Next →
            </button>
          </div>

          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-2 text-center font-bold text-sm text-gray-600 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day}>{day}</div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-2">
            {dates.map(date => {
              const isCurrentMonth = date.isSame(currentDate, 'month');
              const isSelected = selectedDate?.isSame(date, 'day');
              const dayEvents = shops.filter(shop => {
                if (!shop.scheduledDate) return false;
                const shopDate = dayjs(shop.scheduledDate);
                return shopDate.isSame(date, 'day');
              });

              return (
                <div
                  key={date.format('YYYY-MM-DD')}
                  onClick={() => setSelectedDate(date)}
                  className={`aspect-square border rounded-lg p-1 cursor-pointer transition ${
                    isSelected
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : isCurrentMonth
                        ? 'bg-white hover:bg-gray-50'
                        : 'bg-gray-50 text-gray-400'
                  }`}
                >
                  <div className="text-xs font-bold mb-1">{date.date()}</div>
                  <div className="space-y-0.5">
                    {dayEvents.slice(0, 2).map(event => (
                      <div
                        key={event.id}
                        className={`h-1.5 rounded text-xs ${getEventColor(event.status)} ${isSelected ? 'opacity-75' : ''}`}
                      />
                    ))}
                    {dayEvents.length > 2 && (
                      <div className="text-xs text-gray-500">+{dayEvents.length - 2}</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sidebar - Selected Date Info */}
        <div className="bg-white rounded-lg border shadow-sm p-6 space-y-4 h-fit">
          <h3 className="font-bold text-gray-900">
            {selectedDate ? selectedDate.format('MMMM D, YYYY') : 'Select a date'}
          </h3>

          {selectedDate && selectedDateEvents.length > 0 ? (
            <div className="space-y-3">
              {selectedDateEvents.map(event => (
                <div key={event.id} className="border-l-4 border-blue-500 pl-3 py-2">
                  <p className="font-medium text-gray-900">{event.name}</p>
                  <p className="text-xs text-gray-600">{event.address}</p>
                  <span className={`inline-block mt-1 px-2 py-0.5 rounded text-xs ${getEventColor(event.status)}`}>
                    {event.status}
                  </span>
                </div>
              ))}
            </div>
          ) : selectedDate ? (
            <p className="text-gray-500 text-sm">No events scheduled</p>
          ) : (
            <p className="text-gray-500 text-sm">Select a date to view events</p>
          )}

          {/* Legend */}
          <div className="pt-4 border-t space-y-2 text-xs">
            <p className="font-bold text-gray-900">Legend</p>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-blue-500"></div>
                <span>Scheduled</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-amber-500"></div>
                <span>In Progress</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-green-500"></div>
                <span>Completed</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-red-500"></div>
                <span>Closed</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Calendar;
