import { useState, useEffect } from 'react';

const useUI = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isTablet, setIsTablet] = useState(window.innerWidth > 768 && window.innerWidth <= 1366);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isFilterModalOpen, setFilterModalOpen] = useState(false);
  const [mobileView, setMobileView] = useState('map'); // 'map' or 'graph'

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
  };
};

export default useUI;
