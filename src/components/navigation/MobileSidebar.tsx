import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXTwitter } from '@fortawesome/free-brands-svg-icons';
import { NavItem } from './navigationItems';
import { useYearsDataForYears } from '../../hooks/useYearsDataForYears';

interface MobileSidebarProps {
  navigation: NavItem[];
  onNavigate: () => void;
}

export const MobileSidebar: React.FC<MobileSidebarProps> = ({ navigation, onNavigate }) => {
  const location = useLocation();
  const { years } = useYearsDataForYears();
  
  // Extract current year from URL if on years page
  const currentYearId = location.pathname.startsWith('/years/') 
    ? location.pathname.split('/years/')[1] 
    : null;
  
  return (
    <div className="flex flex-col h-full bg-canvas border-r border-tertiary/10 w-full">
      <nav className="flex-1 px-2 py-2 overflow-y-auto">
        {/* Years selector - displayed above navigation items */}
        <div className="flex flex-wrap gap-1 pb-3 border-b border-white/5">
          {years.map((year) => (
            <Link
              key={year.year_id}
              to={`/years/${year.year_id}`}
              onClick={onNavigate}
              className={`px-1 py-0.5 border border-fourth rounded-md hover:bg-fourth hover:text-canvas transition-all duration-300 text-xs hover:drop-shadow-[2px_2px_0px_rgba(244,155,29,1)] font-medium ${
                currentYearId === year.year_id ? 'bg-fourth text-canvas' : 'text-fourth bg-primary'
              }`}
            >
              {year.year}
            </Link>
          ))}
        </div>
        
        {navigation.map((item) => (
          <div
            key={item.name}
            className="border-b border-white/5 last:border-b-0"
          >
            {item.name === 'Donate' ? (
              <>
                <button
                  onClick={() => {
                    if (item.action) {
                      item.action();
                    }
                  }}
                  className="mx-auto block px-2 py-0.5 my-4 text-sm font-medium text-fifth bg-tertiary hover:bg-fourth hover:text-white rounded transition-colors border border-fourth"
                  aria-label={item.name}
                >
                  {item.name}
                </button>
                {/* X (Twitter) icon - placed directly after Donate button */}
                <a
                  href="https://x.com/dripfieldpro"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mx-auto block w-fit text-white border border-fourth rounded-lg p-0.5 hover:text-white hover:bg-fifth bg-fifth transition-colors mb-4"
                >
                  <FontAwesomeIcon
                    icon={faXTwitter}
                    size="2x"
                  />
                </a>
              </>
            ) : item.action ? (
              <button
                onClick={() => {
                  item.action?.();
                }}
                className="flex items-center px-1 rounded-md hover:bg-white/10 transition-colors my-0.5 w-full relative"
                aria-label={item.name}
              >
                <div className="relative">
                  {/* Use desktop icon (image) if available, fallback to icon */}
                  {item.desktopIcon || (
                    <div className="text-[#b27139]">{item.icon}</div>
                  )}
                  
                  {/* Badges positioned relative to the icon */}
                  {item.badge !== undefined && item.badge !== null && item.badge > 0 && (
                    <span className="absolute -top-2 -right-2 px-1.5 py-0.5 text-xs font-semibold rounded-full bg-red-500 text-white min-w-[20px] text-center">
                      {item.badge > 99 ? '99+' : item.badge}
                    </span>
                  )}
                  {item.newBadge && (
                    <span className="absolute -top-2 -right-2 px-1.5 py-0.5 text-xs font-semibold rounded-md bg-tertiary text-white">
                      New
                    </span>
                  )}
                </div>
              </button>
            ) : (
              <Link
                to={item.path}
                onClick={onNavigate}
                className="flex items-center px-1 rounded-md hover:bg-white/10 transition-colors my-0.5 w-full relative"
                aria-label={item.name}
              >
                <div className="relative">
                  {/* Use desktop icon (image) if available, fallback to icon */}
                  {item.desktopIcon || (
                    <div className="text-[#b27139]">{item.icon}</div>
                  )}
                  
                  {/* Badges positioned relative to the icon */}
                  {item.badge !== undefined && item.badge !== null && item.badge > 0 && (
                    <span className="absolute -top-2 -right-2 px-1.5 py-0.5 text-xs font-semibold rounded-full bg-red-500 text-white min-w-[20px] text-center">
                      {item.badge > 99 ? '99+' : item.badge}
                    </span>
                  )}
                  {item.newBadge && (
                    <span className="absolute -top-2 -right-2 px-1.5 py-0.5 text-xs font-semibold rounded-md bg-tertiary text-white">
                      New
                    </span>
                  )}
                </div>
              </Link>
            )}
          </div>
        ))}
      </nav>
    </div>
  );
};
