import React from 'react';
import { NavItem } from './navigationItems';
import sparklePic from '../../img/sparkle.png';

interface DesktopNavigationProps {
  firstLineItems: NavItem[];
  adminLineItems: NavItem[];
  adminNavItems: NavItem[];
  showAllOnSameLine: boolean;
  location: { pathname: string };
  sparkle: { show: boolean; x: number; y: number; itemId: string };
  onItemClick: (e: React.MouseEvent, item: NavItem) => void;
}

export const DesktopNavigation: React.FC<DesktopNavigationProps> = ({
  firstLineItems,
  adminLineItems,
  adminNavItems,
  showAllOnSameLine,
  location,
  sparkle,
  onItemClick
}) => {
  const renderNavItem = (item: NavItem) => (
    <li key={item.name} className="relative">
      <button
        onClick={(e) => onItemClick(e, item)}
        className={`flex items-center rounded-md hover:bg-white/10 transition-colors px-1 ${
          (item.path === '/' ? location.pathname === '/' : location.pathname.startsWith(item.path)) ? 'bg-white/10' : ''
        }`}
        aria-label={item.name}
      >
        {item.desktopIcon || item.icon}
        
        {/* Sparkle effect */}
        {sparkle.show && sparkle.itemId === item.name && (
          <img 
            src={sparklePic}
            alt=""
            className="sparkle"
            style={{
              left: `${sparkle.x - 10}px`,
              top: `${sparkle.y - 10}px`,
            }}
          />
        )}
        
        {/* Badges */}
        {item.badge !== undefined && item.badge !== null && item.badge > 0 && (
          <span className="absolute -top-1 -right-1 px-1.5 py-0.5 text-xs font-semibold rounded-full bg-red-500 text-white min-w-[20px] text-center">
            {item.badge > 99 ? '99+' : item.badge}
          </span>
        )}
        {item.newBadge && (
          <span className="absolute -top-1 -right-1 px-1.5 py-0.5 text-xs font-semibold rounded-md bg-tertiary text-white">
            New
          </span>
        )}
      </button>
    </li>
  );

  return (
    <div className="w-full bg-primary">
      <nav className="max-w-screen-2xl mx-auto px-4 py-1">
        {/* First line navigation items */}
        <ul className="flex flex-wrap items-center justify-center">
          {firstLineItems.map(renderNavItem)}
        </ul>
        
        {/* Second line with Setlist Game and subsequent items */}
        <div className="border-white/10"></div>
        <ul className="flex flex-wrap items-center justify-center mt-1.5">
          {adminLineItems.map(renderNavItem)}
        </ul>
        
        {/* Admin section if not showing all on same line */}
        {!showAllOnSameLine && adminNavItems.length > 0 && (
          <>
            <div className="border-white/10"></div>
            <ul className="flex flex-wrap items-center justify-center mt-1">
              {adminNavItems.map(renderNavItem)}
            </ul>
          </>
        )}
      </nav>
    </div>
  );
};
