import React from 'react';
import { Home, MapPin, Music, Users, Building2, Disc, ShieldCheck, Search, Bug, FileWarning, ListMusic, Trophy, List } from 'lucide-react';
import wlIcon from '../../img/WL.png';

export interface NavItem {
  name: string;
  icon: React.ReactNode;
  desktopIcon?: React.ReactNode;
  path: string;
  adminOnly?: boolean;
  mobileOnly?: boolean;
  action?: () => void;
  badge?: number | null;
  newBadge?: boolean;
}

export const getNavigationItems = (bugCount: number | null, openShowModal?: () => void): NavItem[] => [
  { 
    name: 'Home', 
    icon: <Home className="w-5 h-5" />, 
    desktopIcon: (
      <div className="flex items-center gap-1 px-1 py-0.5 bg-primary text-fourth rounded-lg border border-fourth transition-all duration-300 hover:bg-fourth hover:text-canvas hover:drop-shadow-[3px_3px_0px_rgba(244,155,29,1)]">
        <Home className="w-3 h-3 flex-shrink-0" />
        <span className="font-medium text-xs">Home</span>
      </div>
    ),
    path: '/',
    mobileOnly: true 
  },
  { 
    name: 'Tours', 
    icon: <MapPin className="w-5 h-5" />, 
    desktopIcon: (
      <div className="flex items-center gap-1 px-1 py-0.5 bg-primary text-fourth rounded-lg border border-fourth transition-all duration-300 hover:bg-fourth hover:text-canvas hover:drop-shadow-[3px_3px_0px_rgba(244,155,29,1)]">
        <MapPin className="w-3 h-3 flex-shrink-0" />
        <span className="font-medium text-xs">Tours</span>
      </div>
    ),
    path: '/tours' 
  },
  { 
    name: 'Songs', 
    icon: <Music className="w-5 h-5" />, 
    desktopIcon: (
      <div className="flex items-center gap-1 px-1 py-0.5 bg-primary text-fourth rounded-lg border border-fourth transition-all duration-300 hover:bg-fourth hover:text-canvas hover:drop-shadow-[3px_3px_0px_rgba(244,155,29,1)]">
        <Music className="w-3 h-3 flex-shrink-0" />
        <span className="font-medium text-xs">Songs</span>
      </div>
    ),
    path: '/songs' 
  },
  { 
    name: 'Personnel', 
    icon: <Users className="w-5 h-5" />, 
    desktopIcon: (
      <div className="flex items-center gap-1 px-1 py-0.5 bg-primary text-fourth rounded-lg border border-fourth transition-all duration-300 hover:bg-fourth hover:text-canvas hover:drop-shadow-[3px_3px_0px_rgba(244,155,29,1)]">
        <Users className="w-3 h-3 flex-shrink-0" />
        <span className="font-medium text-xs">Personnel</span>
      </div>
    ),
    path: '/personnel' 
  },
  { 
    name: 'Venues', 
    icon: <Building2 className="w-5 h-5" />, 
    desktopIcon: (
      <div className="flex items-center gap-1 px-1 py-0.5 bg-primary text-fourth rounded-lg border border-fourth transition-all duration-300 hover:bg-fourth hover:text-canvas hover:drop-shadow-[3px_3px_0px_rgba(244,155,29,1)]">
        <Building2 className="w-3 h-3 flex-shrink-0" />
        <span className="font-medium text-xs">Venues</span>
      </div>
    ),
    path: '/venues' 
  },
  { 
    name: 'Discography', 
    icon: <Disc className="w-5 h-5" />, 
    desktopIcon: (
      <div className="flex items-center gap-1 px-1 py-0.5 bg-primary text-fourth rounded-lg border border-fourth transition-all duration-300 hover:bg-fourth hover:text-canvas hover:drop-shadow-[3px_3px_0px_rgba(244,155,29,1)]">
        <Disc className="w-3 h-3 flex-shrink-0" />
        <span className="font-medium text-xs">Discography</span>
      </div>
    ),
    path: '/discography' 
  },
  { 
    name: 'Lists', 
    icon: <List className="w-5 h-5" />, 
    desktopIcon: (
      <div className="flex items-center gap-1 px-1 py-0.5 bg-primary text-fourth rounded-lg border border-fourth transition-all duration-300 hover:bg-fourth hover:text-canvas hover:drop-shadow-[3px_3px_0px_rgba(244,155,29,1)]">
        <List className="w-3 h-3 flex-shrink-0" />
        <span className="font-medium text-xs">Lists</span>
      </div>
    ),
    path: '/lists' 
  },
  { 
    name: 'Setlist Game', 
    icon: <ListMusic className="w-5 h-5" />, 
    desktopIcon: (
      <div className="flex items-center gap-1 px-1 py-0.5 bg-primary text-fourth rounded-lg border border-fourth transition-all duration-300 hover:bg-fourth hover:text-canvas hover:drop-shadow-[3px_3px_0px_rgba(244,155,29,1)]">
        <ListMusic className="w-3 h-3 flex-shrink-0" />
        <span className="font-medium text-xs">Setlist Game</span>
      </div>
    ),
    path: '/setlistgame'
  },
  { 
    name: 'Jam of the Year', 
    icon: <Trophy className="w-5 h-5" />,
    desktopIcon: (
      <div className="flex items-center gap-1 px-1 py-0.5 bg-primary text-fourth rounded-lg border border-fourth transition-all duration-300 hover:bg-fourth hover:text-canvas hover:drop-shadow-[3px_3px_0px_rgba(244,155,29,1)]">
        <Trophy className="w-3 h-3 flex-shrink-0" />
        <span className="font-medium text-xs">Jam of the Year</span>
      </div>
    ),
    path: '/joty'
  },
  { 
    name: 'Program Director', 
    icon: <img src={wlIcon} alt="Program Director" className="w-5 h-5" />,
    desktopIcon: (
      <div className="flex items-center gap-1 px-1 py-0.5 bg-primary text-fourth rounded-lg border border-fourth transition-all duration-300 hover:bg-fourth hover:text-canvas hover:drop-shadow-[3px_3px_0px_rgba(244,155,29,1)]">
        <img src={wlIcon} alt="Program Director" className="w-3 h-3 flex-shrink-0" />
        <span className="font-medium text-xs">Program Director</span>
      </div>
    ),
    path: '/wted',
    adminOnly: true
  },
  { 
    name: 'Submit', 
    icon: <FileWarning className="w-5 h-5" />, 
    desktopIcon: (
      <div className="flex items-center gap-1 px-1 py-0.5 bg-primary text-fourth rounded-lg border border-fourth transition-all duration-300 hover:bg-fourth hover:text-canvas hover:drop-shadow-[3px_3px_0px_rgba(244,155,29,1)]">
        <FileWarning className="w-3 h-3 flex-shrink-0" />
        <span className="font-medium text-xs">Submit</span>
      </div>
    ),
    path: '/submit' 
  },
  // Admin-only items
  { 
    name: 'Admin Panel', 
    icon: <ShieldCheck className="w-5 h-5" />, 
    desktopIcon: (
      <div className="flex items-center gap-1 px-1 py-0.5 bg-primary text-fourth rounded-lg border border-fourth transition-all duration-300 hover:bg-fourth hover:text-canvas hover:drop-shadow-[3px_3px_0px_rgba(244,155,29,1)]">
        <ShieldCheck className="w-3 h-3 flex-shrink-0" />
        <span className="font-medium text-xs">Admin Panel</span>
      </div>
    ),
    path: '/admin', 
    adminOnly: true 
  },
  { 
    name: 'Bug Tracker', 
    icon: <Bug className="w-5 h-5" />, 
    desktopIcon: (
      <div className="flex items-center gap-1 px-1 py-0.5 bg-primary text-fourth rounded-lg border border-fourth transition-all duration-300 hover:bg-fourth hover:text-canvas hover:drop-shadow-[3px_3px_0px_rgba(244,155,29,1)]">
        <Bug className="w-3 h-3 flex-shrink-0" />
        <span className="font-medium text-xs">Bug Tracker</span>
      </div>
    ),
    path: '/bugs', 
    adminOnly: true,
    badge: bugCount
  },
  { 
    name: 'Find', 
    icon: <Search className="w-5 h-5" />, 
    desktopIcon: (
      <div className="flex items-center gap-1 px-1 py-0.5 bg-primary text-fourth rounded-lg border border-fourth transition-all duration-300 hover:bg-fourth hover:text-canvas hover:drop-shadow-[3px_3px_0px_rgba(244,155,29,1)]">
        <Search className="w-3 h-3 flex-shrink-0" />
        <span className="font-medium text-xs">Find</span>
      </div>
    ),
    path: '#', 
    action: openShowModal,
    adminOnly: true
  },
  { 
    name: 'Donate', 
    icon: null,
    path: '#',
    action: () => window.open('https://www.paypal.com/donate/?hosted_button_id=RGT26R3CG44YJ', '_blank'),
    mobileOnly: true 
  },
];