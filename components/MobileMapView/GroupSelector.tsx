import React from 'react';

interface GroupSelectorProps {
  selectedGroup: number | null;
  onSelectGroup: (groupId: number) => void;
  groupCounts?: Record<number, number>;
}

const GROUPS = [
  { id: 1, label: 'A', color: '#3B82F6' },
  { id: 2, label: 'B', color: '#A855F7' },
  { id: 3, label: 'C', color: '#F59E0B' },
];

/**
 * Group selector for Field Engineers to choose their assigned group (A, B, or C).
 * Displays as toggle buttons at the top of the mobile map view.
 */
export const GroupSelector: React.FC<GroupSelectorProps> = ({
  selectedGroup,
  onSelectGroup,
  groupCounts = {},
}) => {
  return (
    <div className="mobile-group-selector">
      {GROUPS.map((group) => (
        <button
          key={group.id}
          className={`mobile-group-btn ${selectedGroup === group.id ? 'active' : ''}`}
          style={{
            '--group-color': group.color,
            '--group-color-light': `${group.color}20`,
          } as React.CSSProperties}
          onClick={() => onSelectGroup(group.id)}
          aria-pressed={selectedGroup === group.id}
          aria-label={`Select Group ${group.label}${groupCounts[group.id] ? ` (${groupCounts[group.id]} shops)` : ''}`}
        >
          <span className="mobile-group-letter">Group {group.label}</span>
          {groupCounts[group.id] !== undefined && (
            <span className="mobile-group-count">{groupCounts[group.id]}</span>
          )}
        </button>
      ))}
    </div>
  );
};
