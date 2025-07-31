import { useState, useEffect } from 'react';

const useUI = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isFilterModalOpen, setFilterModalOpen] = useState(false); // フィルターモーダルの表示状態

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleSidebar = () => {
    if (isMobile) {
      setSidebarOpen(!isSidebarOpen);
    }
  };

  const toggleFilterModal = () => {
    setFilterModalOpen(!isFilterModalOpen);
  };

  return { isMobile, isSidebarOpen, toggleSidebar, isFilterModalOpen, toggleFilterModal };
};

export default useUI;
