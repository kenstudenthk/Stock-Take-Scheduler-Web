import React from 'react';
import { Sidebar, SidebarTop, SidebarBottom, SidebarLogo, SidebarNavItems, SidebarAvatar } from '../Sidebar';
import { ZoomIn, ZoomOut } from 'lucide-react';

interface MarkerProps {
  number: number;
  color: string;
  x: number;
  y: number;
  isSelected?: boolean;
}

const Marker: React.FC<MarkerProps> = ({ number, color, x, y, isSelected }) => {
  return (
    <div
      className={`absolute w-9 h-9 rounded-full flex items-center justify-center font-bold text-white text-sm border-2 border-[var(--bh-black)] ${color} ${
        isSelected ? 'w-10 h-10 border-4' : ''
      }`}
      style={{ left: `${x}px`, top: `${y}px` }}
    >
      {number}
    </div>
  );
};

export const MapViewPage: React.FC = () => {
  return (
    <div className="flex w-full h-screen bg-[var(--bh-bg)]">
      {/* Sidebar */}
      <Sidebar>
        <SidebarTop>
          <SidebarLogo>
            <div className="w-full h-full rounded-full bg-[var(--bh-red)]" />
          </SidebarLogo>
          <SidebarNavItems>
            {/* Nav items */}
          </SidebarNavItems>
        </SidebarTop>
        <SidebarBottom>
          <SidebarAvatar>
            <div className="w-full h-full rounded-[20px] bg-[var(--bh-blue)]" />
          </SidebarAvatar>
        </SidebarBottom>
      </Sidebar>

      {/* Main Content */}
      <div className="flex-1 flex h-full overflow-hidden">
        {/* Map Area */}
        <div className="flex-1 bg-[#E8E4DC] relative">
          {/* Map Controls */}
          <div className="absolute top-4 left-4 flex flex-col gap-2">
            <button className="w-10 h-10 bg-white border border-[var(--bh-black)] rounded flex items-center justify-center hover:bg-[var(--bh-bg)]">
              <ZoomIn className="w-5 h-5" />
            </button>
            <button className="w-10 h-10 bg-white border border-[var(--bh-black)] rounded flex items-center justify-center hover:bg-[var(--bh-bg)]">
              <ZoomOut className="w-5 h-5" />
            </button>
          </div>

          {/* Markers */}
          <Marker number={1} color="bg-[var(--bh-red)]" x={200} y={300} />
          <Marker number={2} color="bg-[var(--bh-red)]" x={350} y={200} />
          <Marker number={3} color="bg-[var(--bh-blue)]" x={500} y={350} />
          <Marker number={4} color="bg-[var(--bh-blue)]" x={280} y={500} />
          <Marker number={5} color="bg-[var(--bh-yellow)]" x={600} y={250} />
          <Marker number={6} color="bg-[var(--bh-yellow)]" x={420} y={450} />
          <Marker number={7} color="bg-[var(--bh-success)]" x={750} y={400} />
          <Marker number={8} color="bg-[var(--bh-red)]" x={450} y={280} isSelected />

          {/* User Location */}
          <div className="absolute w-5 h-5 rounded-full bg-blue-500 border-4 border-white" style={{ left: '190px', top: '340px' }} />

          {/* Legend */}
          <div className="absolute bottom-4 left-4 bg-white p-4 rounded border-2 border-[var(--bh-black)] space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-[var(--bh-red)]" />
              <span className="text-sm">Pending</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-[var(--bh-blue)]" />
              <span className="text-sm">In Progress</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-[var(--bh-yellow)]" />
              <span className="text-sm">Pending</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-[var(--bh-success)]" />
              <span className="text-sm">Complete</span>
            </div>
          </div>
        </div>

        {/* Side Panel */}
        <div className="w-[360px] bg-white border-l-2 border-[var(--bh-black)] flex flex-col overflow-hidden">
          {/* Panel Header */}
          <div className="p-6 border-b-2 border-[var(--bh-black)] space-y-4">
            <h2 className="font-bold text-lg text-[var(--bh-black)]">Shop List</h2>
            <div className="flex gap-2">
              <div className="px-3 py-1 bg-[var(--bh-black)] text-white text-sm rounded">All</div>
              <div className="px-3 py-1 border border-[var(--bh-black)] text-[var(--bh-black)] text-sm rounded">Filter</div>
            </div>
          </div>

          {/* Filter Chips */}
          <div className="px-6 py-3 border-b-2 border-[var(--bh-black)] flex gap-2 overflow-x-auto">
            <div className="px-2 py-1 bg-[var(--bh-gray-600)] text-white text-xs rounded whitespace-nowrap">Chip 1</div>
            <div className="px-2 py-1 bg-[var(--bh-gray-600)] text-white text-xs rounded whitespace-nowrap">Chip 2</div>
          </div>

          {/* Shop List */}
          <div className="flex-1 overflow-y-auto divide-y divide-[var(--bh-black)]">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="p-4 hover:bg-[var(--bh-bg)] cursor-pointer border-b border-[var(--bh-black)]">
                <div className="font-semibold text-[var(--bh-black)]">Shop {i}</div>
                <div className="text-xs text-[var(--bh-gray-700)]">Location {i}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapViewPage;
