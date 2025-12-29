import React from 'react';
import { useLocation } from 'react-router-dom';
import { getNavigationItems, NavItem } from './navigation/navigationItems';
import { useSparkleEffect } from '../hooks/useSparkleEffect';
import { useBugCount } from '../hooks/useBugCount';
import { MobileSidebar } from './navigation/MobileSidebar';
import { DesktopNavigation } from './navigation/DesktopNavigation';

interface SidebarProps {
  onNavigate?: () => void;
  onClose?: () => void;
  isMobile?: boolean;
  isAdmin?: boolean;
  openShowModal?: () => void;
  showAllOnSameLine?: boolean;
  logoElement?: React.ReactNode;
  rightSideElements?: React.ReactNode;
}

export function Sidebar({ 
  onNavigate, 
  onClose, 
  isMobile = true, 
  isAdmin = false,
  openShowModal,
  showAllOnSameLine = false,
  logoElement,
  rightSideElements
}: SidebarProps) {
  const location = useLocation();
  const bugCount = useBugCount(isAdmin);
  const { sparkle, handleItemClick } = useSparkleEffect();

  const handleNavigation = () => {
    if (onNavigate) {
      onNavigate();
    }
    if (onClose) {
      onClose();
    }
  };

  // Get navigation items
  const navigation = getNavigationItems(bugCount, openShowModal);

  // Filter navigation items based on admin status and view mode
  const filteredNavigation = navigation.filter(item => 
    ((!item.adminOnly || isAdmin) && (!item.mobileOnly || isMobile))
  );

  // For mobile: vertical sidebar
  if (isMobile) {
    // Filter out "Jam of the Year" from mobile navigation
    const mobileNavigation = filteredNavigation.filter(item => item.name !== 'Jam of the Year');
    return (
      <MobileSidebar 
        navigation={mobileNavigation}
        onNavigate={handleNavigation}
      />
    );
  }
  
  // For desktop: horizontal navigation
  // Get main nav items: Tours, Songs, Personnel, Venues, Discography, Lists, Setlist Game, Program Director
  const mainNavItemNames = ['Tours', 'Songs', 'Personnel', 'Venues', 'Discography', 'Lists', 'Setlist Game', 'Program Director'];
  const mainNavItems = mainNavItemNames
    .map(name => {
      const item = filteredNavigation.find(item => item.name === name && !item.mobileOnly);
      // Allow adminOnly items in main nav if user is admin and item is in mainNavItemNames
      if (item && item.adminOnly && !isAdmin) {
        return undefined;
      }
      return item;
    })
    .filter((item): item is NavItem => item !== undefined);
  
  // Get admin items: Admin Panel, Bug Tracker, Find (exclude Program Director since it's in main nav)
  const adminNavItems = filteredNavigation.filter(item => 
    item.adminOnly && !item.mobileOnly && item.name !== 'Program Director'
  );
  
  // Get Submit button for right side (available to all users)
  const submitItem = filteredNavigation.find(item => item.name === 'Submit' && !item.adminOnly && !item.mobileOnly);
  
  // Combine admin items and Submit for right side display
  const rightSideNavItems = submitItem 
    ? [...adminNavItems, submitItem]
    : adminNavItems;

  const handleDesktopItemClick = (e: React.MouseEvent, item: NavItem) => {
    handleItemClick(e, item.name, () => {
      if (item.action) {
        item.action();
      } else {
        handleNavigation();
      }
    });
  };

  return (
    <DesktopNavigation
      mainNavItems={mainNavItems}
      rightSideNavItems={rightSideNavItems}
      location={location}
      sparkle={sparkle}
      onItemClick={handleDesktopItemClick}
      logoElement={logoElement}
      rightSideElements={rightSideElements}
    />
  );
}