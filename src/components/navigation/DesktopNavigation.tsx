import React from 'react';
import { Link } from 'react-router-dom';
import { NavItem } from './navigationItems';
import sparklePic from '../../img/sparkle.png';
import { useYearsDataForYears } from '../../hooks/useYearsDataForYears';

interface DesktopNavigationProps {
  mainNavItems: NavItem[];
  rightSideNavItems: NavItem[];
  location: { pathname: string };
  sparkle: { show: boolean; x: number; y: number; itemId: string };
  onItemClick: (e: React.MouseEvent, item: NavItem) => void;
  logoElement: React.ReactNode;
  rightSideElements: React.ReactNode;
}

export const DesktopNavigation: React.FC<DesktopNavigationProps> = ({
  mainNavItems,
  rightSideNavItems,
  location,
  sparkle,
  onItemClick,
  logoElement,
  rightSideElements
}) => {
  const { years } = useYearsDataForYears();
  
  // Extract current year from URL if on years page
  const currentYearId = location.pathname.startsWith('/years/') 
    ? location.pathname.split('/years/')[1] 
    : null;
    
  const renderNavItem = (item: NavItem) => (
    <li key={item.name} className="relative">
      {item.action ? (
      <button
        onClick={(e) => onItemClick(e, item)}
        className={`flex items-center rounded-md hover:bg-white/10 transition-colors px-0.5 ${
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
      ) : (
        <Link
          to={item.path}
          onClick={(e) => onItemClick(e, item)}
          className={`flex items-center rounded-md hover:bg-white/10 transition-colors px-0.5 ${
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
        </Link>
      )}
    </li>
  );

  return (
    <div className="w-full bg-canvas">
      <div className="flex items-center w-full px-4 py-1">
        {/* Left side: Logo */}
        <div className="flex-shrink-0 mr-2">
          <div className="flex flex-col">
            {logoElement}
            <p className="text-xs text-secondary mt-0.5 font-medium">A Setlist Archive for Goose the Band</p>
          </div>
        </div>
        
        {/* Center: Main nav items and years */}
        <div className="flex-1">
          {/* Main navigation items */}
          <ul className="flex flex-wrap items-center gap-0.5">
            {mainNavItems.map(renderNavItem)}
          </ul>
          
          {/* Years selector underneath */}
          <div className="flex flex-wrap items-center ml-1 mt-1 text-[0.625rem] font-medium">
            {years.map((year, index) => (
              <React.Fragment key={year.year_id}>
                <Link
                  to={`/years/${year.year_id}`}
                  className={`hover:underline transition-colors ${
                    currentYearId === year.year_id ? 'font-semibold' : ''
                  }`}
                >
                  {year.year}
                </Link>
                {index < years.length - 1 && (
                  <span className="mx-1.5">•</span>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
        
        {/* Right side: Admin items + Submit, X, Donate, Profile */}
        <div className="flex items-center gap-2 ml-4 flex-shrink-0">
          {/* Admin items and Submit in same list */}
          {rightSideNavItems.length > 0 && (
            <ul className="flex items-center gap-1">
              {rightSideNavItems.map(renderNavItem)}
            </ul>
          )}
          {/* X button, Donate, Profile menu */}
          {rightSideElements}
        </div>
      </div>
    </div>
  );
};
