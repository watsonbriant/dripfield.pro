import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXTwitter } from '@fortawesome/free-brands-svg-icons';
import { NavItem } from './navigationItems';

interface MobileSidebarProps {
  navigation: NavItem[];
  onNavigate: (path: string) => void;
}

export const MobileSidebar: React.FC<MobileSidebarProps> = ({ navigation, onNavigate }) => {
  return (
    <div className="flex flex-col h-full bg-primary border-r border-tertiary/10 w-full">
      <nav className="flex-1 px-2 py-2 overflow-y-auto">
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
                  className="mx-auto block px-3 pb-0.5 my-4 text-lg font-trad text-black bg-secondary hover:bg-secondary/70 rounded-full transition-colors border border-black"
                  aria-label={item.name}
                >
                  {item.name}
                </button>
                {/* X (Twitter) icon - placed directly after Donate button */}
                <a
                  href="https://x.com/dripfieldpro"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mx-auto block w-fit text-fifth hover:border border border-primary hover:border-fifth rounded-lg p-0.5 hover:text-fifth hover:bg-tertiary bg-primary transition-colors mb-4"
                >
                  <FontAwesomeIcon
                    icon={faXTwitter}
                    size="2x"
                  />
                </a>
              </>
            ) : (
              <button
                onClick={() => {
                  if (item.action) {
                    item.action();
                  } else {
                    onNavigate(item.path);
                  }
                }}
                className="flex items-center px-3 rounded-md hover:bg-white/10 transition-colors my-1 w-full relative"
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
            )}
          </div>
        ))}
      </nav>
    </div>
  );
};
