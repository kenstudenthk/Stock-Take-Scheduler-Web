import React from 'react';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  children?: React.ReactNode;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ children, className }) => {
  return (
    <div
      className={cn(
        'flex items-center justify-between w-full',
        className
      )}
    >
      {children}
    </div>
  );
};

interface HeaderLeftProps {
  children?: React.ReactNode;
}

export const HeaderLeft: React.FC<HeaderLeftProps> = ({ children }) => {
  return (
    <div className="flex flex-col gap-3">
      {children}
    </div>
  );
};

interface HeaderRightProps {
  children?: React.ReactNode;
}

export const HeaderRight: React.FC<HeaderRightProps> = ({ children }) => {
  return (
    <div className="flex items-center gap-3">
      {children}
    </div>
  );
};
