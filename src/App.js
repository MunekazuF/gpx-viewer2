import React, { useState, useEffect, useRef } from 'react';
import Split from 'split.js';
import Sidebar from './components/Sidebar';
import ElevationGraph from './components/ElevationGraph';
import Map from './components/Map';
import GpxInfoOverlay from './components/GpxInfoOverlay';
import FilterModal from './components/FilterModal';
import SettingsModal from './components/SettingsModal';
import useUI from './hooks/useUI';
import { useGpxContext } from './contexts/GpxContext';
import useMap from './hooks/useMap';
import './App.css';

function App() {
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const { 
    isMobile, isTablet, isSidebarOpen, toggleSidebar, 
    isSidebarCollapsed, toggleSidebarCollapse, 
    isFilterModalOpen, toggleFilterModal, 
    mobileView, setMobileView,
    graphSizeMode, toggleGraphSizeMode,
    isSettingsModalOpen, toggleSettingsModal,
    getGraphAreaStyle, getMapAreaStyle, getGraphButtonIcon
  } = useUI();
  const { mapBounds, onBoundsChange } = useMap();
  const { isInfoOverlayVisible } = useGpxContext();
  const [settingsChanged, setSettingsChanged] = useState(false);

  const horizontalSplitRef = useRef(null);
  const verticalSplitRef = useRef(null);

  const handleCloseSettingsModal = () => {
    toggleSettingsModal();
    setSettingsChanged(prev => !prev);
  };

  useEffect(() => {
    const preventDefault = (e) => e.preventDefault();
    window.addEventListener('dragover', preventDefault, false);
    window.addEventListener('drop', preventDefault, false);
    return () => {
      window.removeEventListener('dragover', preventDefault, false);
      window.removeEventListener('drop', preventDefault, false);
    };
  }, []);

  useEffect(() => {
    if (isMobile) {
      if (horizontalSplitRef.current) {
        horizontalSplitRef.current.destroy();
        horizontalSplitRef.current = null;
      }
      return;
    }

    const sidebarSize = isTablet ? 30 : 15;
    if (!horizontalSplitRef.current) {
      horizontalSplitRef.current = Split(['#sidebar', '#main-area'], {
        sizes: [sidebarSize, 100 - sidebarSize], minSize: [0, 300], gutterSize: 8, cursor: 'col-resize',
      });
    }

    return () => {
      if (horizontalSplitRef.current) {
        horizontalSplitRef.current.destroy();
        horizontalSplitRef.current = null;
      }
    };
  }, [isMobile, isTablet]);

  useEffect(() => {
    if (isMobile) {
        if (verticalSplitRef.current) {
            verticalSplitRef.current.destroy();
            verticalSplitRef.current = null;
        }
        return;
    }

    if (graphSizeMode === 'normal' && !verticalSplitRef.current) {
        verticalSplitRef.current = Split(['#map-area', '#graph-area'], {
            sizes: [70, 30], direction: 'vertical', minSize: 100, gutterSize: 8, cursor: 'row-resize',
        });
    } else if (graphSizeMode !== 'normal' && verticalSplitRef.current) {
        verticalSplitRef.current.destroy();
        verticalSplitRef.current = null;
    }

    return () => {
        if (verticalSplitRef.current) {
            verticalSplitRef.current.destroy();
            verticalSplitRef.current = null;
        }
    };
}, [isMobile, graphSizeMode]);


  useEffect(() => {
    if (!isMobile && horizontalSplitRef.current) {
      const sidebarSize = isTablet ? 30 : 15;
      horizontalSplitRef.current.setSizes(isSidebarCollapsed ? [0, 100] : [sidebarSize, 100 - sidebarSize]);
    }
  }, [isSidebarCollapsed, isMobile, isTablet]);

  const sidebarClasses = `${isMobile ? 'sidebar-mobile' : 'split'} ${isMobile && isSidebarOpen ? 'open' : ''}`;

  return (
    <div className="app-container">
      {isFilterModalOpen && (
        <FilterModal onClose={toggleFilterModal} mapBounds={mapBounds} />
      )}
      {isSettingsModalOpen && (
        <SettingsModal isOpen={isSettingsModalOpen} onClose={handleCloseSettingsModal} />
      )}
      {isMobile && (
        <button className="hamburger-menu" onClick={toggleSidebar}>
          {isSidebarOpen ? <>&times;</> : <>&equiv;</>}
        </button>
      )}
      {!isMobile && isSidebarCollapsed && (
        <button className="sidebar-expand-button" onClick={toggleSidebarCollapse}>
          &gt;
        </button>
      )}
      <div id="sidebar" className={sidebarClasses}>
        <Sidebar onToggleFilterModal={toggleFilterModal} mapBounds={mapBounds} onOpenSettings={toggleSettingsModal} onCollapse={toggleSidebarCollapse} />
      </div>
      {!isMobile && <div className="gutter gutter-horizontal"></div>}
      <div id="main-area" className={isMobile ? 'main-area-mobile' : 'split'}>
        {isInfoOverlayVisible && <GpxInfoOverlay />}
        {!isMobile && (
          <button onClick={toggleGraphSizeMode} className="graph-size-toggle-btn" title="グラフサイズ切替">
            {getGraphButtonIcon()}
          </button>
        )}
        {isMobile ? (
          <>
            <div className="view-toggle">
              <button onClick={() => setMobileView('map')} className={mobileView === 'map' ? 'active' : ''}>地図</button>
              <button onClick={() => setMobileView('graph')} className={mobileView === 'graph' ? 'active' : ''}>グラフ</button>
            </div>
            {mobileView === 'map' && (
              <div id="map-area" className="map-area-mobile">
                <Map hoveredPoint={hoveredPoint} onBoundsChange={onBoundsChange} settingsChanged={settingsChanged} />
              </div>
            )}
            {mobileView === 'graph' && (
              <div id="graph-area" className="graph-area-mobile">
                <ElevationGraph onPointHover={setHoveredPoint} />
              </div>
            )}
          </>
        ) : (
          <>
            <div id="map-area" className="split-vertical" style={getMapAreaStyle()}>
              <Map hoveredPoint={hoveredPoint} onBoundsChange={onBoundsChange} settingsChanged={settingsChanged} />
            </div>
            <div id="graph-area" className="split-vertical" style={getGraphAreaStyle()}>
              <ElevationGraph onPointHover={setHoveredPoint} key={graphSizeMode} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default App;
