import React, { useState, useEffect, useRef, useCallback } from 'react';
import Split from 'split.js';
import Sidebar from './Sidebar';
import ElevationGraph from './ElevationGraph';
import Map from './components/Map';
import GpxInfoOverlay from './GpxInfoOverlay';
import FilterModal from './FilterModal';
import SettingsModal from './components/SettingsModal'; // SettingsModalをインポート
import useUI from './hooks/useUI';
import useGpx from './hooks/useGpx';
import useMap from './hooks/useMap';
import './App.css';

function App() {
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const { isMobile, isSidebarOpen, toggleSidebar, isFilterModalOpen, toggleFilterModal, mobileView, setMobileView } = useUI();
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
  const verticalSplitRef = useRef(null);
  const [isSettingsModalOpen, setSettingsModalOpen] = useState(false); // 設定モーダルのstate
  const [settingsChanged, setSettingsChanged] = useState(false); // 設定変更を通知するstate

  const handleCloseSettingsModal = () => {
    setSettingsModalOpen(false);
    setSettingsChanged(prev => !prev); // stateを反転させて子コンポーネントに通知
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
      if (verticalSplitRef.current) {
        verticalSplitRef.current.destroy();
        verticalSplitRef.current = null;
      }
      return;
    }

    const horizontalSplit = Split(['#sidebar', '#main-area'], {
      sizes: [15, 85], minSize: [200, 300], gutterSize: 8, cursor: 'col-resize',
    });

    if (graphSizeMode === 'normal') {
      verticalSplitRef.current = Split(['#map-area', '#graph-area'], {
        sizes: [70, 30], direction: 'vertical', minSize: 100, gutterSize: 8, cursor: 'row-resize',
      });
    } else {
      if (verticalSplitRef.current) {
        verticalSplitRef.current.destroy();
        verticalSplitRef.current = null;
      }
    }

    return () => {
      horizontalSplit.destroy();
      if (verticalSplitRef.current) {
        verticalSplitRef.current.destroy();
        verticalSplitRef.current = null;
      }
    };
  }, [isMobile, graphSizeMode]);

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
      <div id="sidebar" className={sidebarClasses}>
        <Sidebar gpxTracks={gpxTracks} onFileAdd={addGpxFiles} onToggleVisibility={toggleGpxVisibility} onFocusGpx={setFocusedGpxId} focusedGpxId={focusedGpxId} onToggleFilterModal={toggleFilterModal} onResetSelection={resetSelection} onDeleteSelected={deleteSelectedGpx} mapBounds={mapBounds} onOpenSettings={() => setSettingsModalOpen(true)} />
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