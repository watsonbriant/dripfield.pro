import React, { createContext, useContext, useState, ReactNode } from 'react';

type SidebarContextType = {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
};

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export const SidebarProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const value = {
    isSidebarOpen,
    setIsSidebarOpen,
  };

  return <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>;
};

export const useSidebar = (): SidebarContextType => {
  const context = useContext(SidebarContext);
  if (context === undefined) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
};

