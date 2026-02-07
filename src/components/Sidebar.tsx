import React from 'react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  children?: React.ReactNode;
  className?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ children, className }) => {
  return (
    <div
      className={cn(
        'w-[88px] h-full bg-[var(--bh-black)] flex flex-col justify-between py-8 px-0',
        className
      )}
    >
      {children}
    </div>
  );
};

interface SidebarSectionProps {
  children?: React.ReactNode;
  className?: string;
}

export const SidebarTop: React.FC<SidebarSectionProps> = ({ children, className }) => {
  return (
    <div className={cn('flex flex-col gap-8 items-center w-full', className)}>
      {children}
    </div>
  );
};

export const SidebarBottom: React.FC<SidebarSectionProps> = ({ children, className }) => {
  return (
    <div className={cn('flex flex-col items-center w-full', className)}>
      {children}
    </div>
  );
};

interface SidebarLogoProps {
  children?: React.ReactNode;
}

export const SidebarLogo: React.FC<SidebarLogoProps> = ({ children }) => {
  return (
    <div className="w-12 h-12 rounded-full bg-[var(--bh-red)] flex items-center justify-center">
      {children}
    </div>
  );
};

interface SidebarNavItemsProps {
  children?: React.ReactNode;
}

export const SidebarNavItems: React.FC<SidebarNavItemsProps> = ({ children }) => {
  return (
    <div className="flex flex-col gap-2 w-full items-center">
      {children}
    </div>
  );
};

interface SidebarAvatarProps {
  children?: React.ReactNode;
}

export const SidebarAvatar: React.FC<SidebarAvatarProps> = ({ children }) => {
  return (
    <div className="w-10 h-10 rounded-[20px] bg-[var(--bh-blue)] flex items-center justify-center">
      {children}
    </div>
  );
};
