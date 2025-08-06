import React, { useState, useEffect, useRef, useCallback } from 'react';
import Split from 'split.js';
import Sidebar from './Sidebar';
import ElevationGraph from './ElevationGraph';
import Map from './components/Map';
import GpxInfoOverlay from './GpxInfoOverlay';
import FilterModal from './FilterModal';
import SettingsModal from './components/SettingsModal';
import useUI from './hooks/useUI';
import useGpx from './hooks/useGpx';
import useMap from './hooks/useMap';
import './App.css';

function App() {
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const { isMobile, isTablet, isSidebarOpen, toggleSidebar, isSidebarCollapsed, toggleSidebarCollapse, isFilterModalOpen, toggleFilterModal, mobileView, setMobileView } = useUI();
  const { mapBounds, onBoundsChange } = useMap();
  const {
    gpxTracks,
    visibleGpxTracks,
    focusedGpxData,
    isInfoOverlayVisible,
    hideInfoOverlay,
    addGpxFiles,
    toggleGpxVisibility,
    focusedGpxId,
    setFocusedGpxId,
    filter,
    setFilter,
    resetSelection,
    deleteSelectedGpx,
  } = useGpx(mapBounds);

  const [graphSizeMode, setGraphSizeMode] = useState('normal');
  const horizontalSplitRef = useRef(null);
  const verticalSplitRef = useRef(null);
  const [isSettingsModalOpen, setSettingsModalOpen] = useState(false);
  const [settingsChanged, setSettingsChanged] = useState(false);

  const handleCloseSettingsModal = () => {
    setSettingsModalOpen(false);
    setSettingsChanged(prev => !prev);
  };

  const toggleGraphSizeMode = useCallback(() => {
    setGraphSizeMode(currentMode => {
      if (currentMode === 'normal') return 'maximized';
      if (currentMode === 'maximized') return 'minimized';
      return 'normal';
    });
  }, []);

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

  const sidebarClasses = `${isMobile ? 'sidebar-mobile' : 'split'} ${isMobile && isSidebarOpen ? 'open' : ''}`;

  return (
    <div className="app-container">
      {isFilterModalOpen && (
        <FilterModal currentFilter={filter} onApplyFilter={setFilter} onClose={toggleFilterModal} mapBounds={mapBounds} />
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
        <Sidebar gpxTracks={gpxTracks} onFileAdd={addGpxFiles} onToggleVisibility={toggleGpxVisibility} onFocusGpx={setFocusedGpxId} focusedGpxId={focusedGpxId} onToggleFilterModal={toggleFilterModal} onResetSelection={resetSelection} onDeleteSelected={deleteSelectedGpx} mapBounds={mapBounds} onOpenSettings={() => setSettingsModalOpen(true)} onCollapse={toggleSidebarCollapse} />
      </div>
      {!isMobile && <div className="gutter gutter-horizontal"></div>}
      <div id="main-area" className={isMobile ? 'main-area-mobile' : 'split'}>
        {isInfoOverlayVisible && <GpxInfoOverlay gpx={focusedGpxData} onClose={hideInfoOverlay} />}
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
                <Map gpxData={visibleGpxTracks} focusedGpxData={focusedGpxData} hoveredPoint={hoveredPoint} onBoundsChange={onBoundsChange} onTrackClick={setFocusedGpxId} settingsChanged={settingsChanged} />
              </div>
            )}
            {mobileView === 'graph' && (
              <div id="graph-area" className="graph-area-mobile">
                <ElevationGraph gpxData={visibleGpxTracks} onPointHover={setHoveredPoint} focusedGpxData={focusedGpxData} />
              </div>
            )}
          </>
        ) : (
          <>
            <div id="map-area" className="split-vertical" style={getMapAreaStyle()}>
              <Map gpxData={visibleGpxTracks} focusedGpxData={focusedGpxData} hoveredPoint={hoveredPoint} onBoundsChange={onBoundsChange} onTrackClick={setFocusedGpxId} settingsChanged={settingsChanged} />
            </div>
            <div id="graph-area" className="split-vertical" style={getGraphAreaStyle()}>
              <ElevationGraph gpxData={visibleGpxTracks} onPointHover={setHoveredPoint} focusedGpxData={focusedGpxData} key={graphSizeMode} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default App;