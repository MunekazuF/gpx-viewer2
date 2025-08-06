import { useState, useEffect, useCallback } from 'react';

const useUI = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isTablet, setIsTablet] = useState(window.innerWidth > 768 && window.innerWidth <= 1366);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isFilterModalOpen, setFilterModalOpen] = useState(false);
  const [mobileView, setMobileView] = useState('map'); // 'map' or 'graph'
  const [graphSizeMode, setGraphSizeMode] = useState('normal');
  const [isSettingsModalOpen, setSettingsModalOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
      setIsTablet(window.innerWidth > 768 && window.innerWidth <= 1366);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleSidebar = () => {
    if (isMobile) {
      setSidebarOpen(!isSidebarOpen);
    }
  };

  const toggleSidebarCollapse = () => {
    setSidebarCollapsed(!isSidebarCollapsed);
  };

  const toggleFilterModal = () => {
    setFilterModalOpen(!isFilterModalOpen);
  };

  const toggleGraphSizeMode = useCallback(() => {
    setGraphSizeMode(currentMode => {
      if (currentMode === 'normal') return 'maximized';
      if (currentMode === 'maximized') return 'minimized';
      return 'normal';
    });
  }, []);

  const toggleSettingsModal = () => {
    setSettingsModalOpen(!isSettingsModalOpen);
  };

  const getGraphAreaStyle = () => {
    if (isMobile || graphSizeMode === 'normal') return {};
    if (graphSizeMode === 'maximized') return { flexGrow: 1, height: '100%', minHeight: '0' };
    if (graphSizeMode === 'minimized') return { flexGrow: 0, height: '0', minHeight: '0', overflow: 'hidden' };
    return {};
  };

  const getMapAreaStyle = () => {
    if (isMobile || graphSizeMode === 'normal') return {};
    if (graphSizeMode === 'maximized') return { flexGrow: 0, height: '0', minHeight: '0', overflow: 'hidden' };
    if (graphSizeMode === 'minimized') return { flexGrow: 1, height: '100%', minHeight: '0' };
    return {};
  };
  
  const getGraphButtonIcon = () => {
    if (graphSizeMode === 'normal') return '↗';
    if (graphSizeMode === 'maximized') return '↙';
    return '↔';
  };

  return { 
    isMobile, 
    isTablet,
    isSidebarOpen, 
    toggleSidebar, 
    isSidebarCollapsed,
    toggleSidebarCollapse,
    isFilterModalOpen, 
    toggleFilterModal, 
    mobileView, 
    setMobileView,
    graphSizeMode,
    toggleGraphSizeMode,
    isSettingsModalOpen,
    toggleSettingsModal,
    getGraphAreaStyle,
    getMapAreaStyle,
    getGraphButtonIcon
  };
};

export default useUI;