import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
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
}

export function Sidebar({ 
  onNavigate, 
  onClose, 
  isMobile = true, 
  isAdmin = false,
  openShowModal,
  showAllOnSameLine = false
}: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const bugCount = useBugCount(isAdmin);
  const { sparkle, handleItemClick } = useSparkleEffect();

  const handleNavigation = (path: string) => {
    if (onNavigate) {
      onNavigate();
    }
    if (onClose) {
      onClose();
    }
    navigate(path);
  };

  // Get navigation items
  const navigation = getNavigationItems(bugCount, openShowModal);

  // Filter navigation items based on admin status and view mode
  const filteredNavigation = navigation.filter(item => 
    ((!item.adminOnly || isAdmin) && (!item.mobileOnly || isMobile))
  );

  // For mobile: vertical sidebar
  if (isMobile) {
    return (
      <MobileSidebar 
        navigation={filteredNavigation}
        onNavigate={handleNavigation}
      />
    );
  }
  
  // For desktop: horizontal navigation
  // Separate regular and admin navigation items
  const regularNavItems = filteredNavigation.filter(item => !item.adminOnly && !item.mobileOnly);
  const adminNavItems = filteredNavigation.filter(item => item.adminOnly && !item.mobileOnly);

  // Find the index of "Setlist Game" in regularNavItems
  const echoIndex = regularNavItems.findIndex(item => item.name === 'Setlist Game');

  // Split regularNavItems into two arrays
  const firstLineItems = regularNavItems.slice(0, echoIndex);
  const secondLineItems = regularNavItems.slice(echoIndex);

  // Combine second line items with admin items if showAllOnSameLine is true
  const adminLineItems = showAllOnSameLine 
    ? [...secondLineItems, ...adminNavItems]
    : secondLineItems;

  const handleDesktopItemClick = (e: React.MouseEvent, item: NavItem) => {
    handleItemClick(e, item.name, () => {
      if (item.action) {
        item.action();
      } else {
        handleNavigation(item.path);
      }
    });
  };

  return (
    <DesktopNavigation
      firstLineItems={firstLineItems}
      adminLineItems={adminLineItems}
      adminNavItems={adminNavItems}
      showAllOnSameLine={showAllOnSameLine}
      location={location}
      sparkle={sparkle}
      onItemClick={handleDesktopItemClick}
    />
  );
}