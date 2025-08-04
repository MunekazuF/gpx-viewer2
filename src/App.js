import React, { useState, useEffect } from 'react';
import Split from 'split.js';
import Sidebar from './Sidebar';
import ElevationGraph from './ElevationGraph';
import Map from './components/Map';
import GpxInfoOverlay from './GpxInfoOverlay';
import FilterModal from './FilterModal';
import useUI from './hooks/useUI';
import useGpx from './hooks/useGpx';
import useMap from './hooks/useMap';
import './App.css';

function App() {
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const { isMobile, isSidebarOpen, toggleSidebar, isFilterModalOpen, toggleFilterModal, mobileView, setMobileView } = useUI();
  const { mapBounds, onBoundsChange } = useMap(); // シンプルなフックに変更
  const {
    gpxTracks,
    visibleGpxTracks,
    focusedGpxData,
    addGpxFiles,
    toggleGpxVisibility,
    focusedGpxId,
    setFocusedGpxId,
    filter,
    setFilter,
    resetSelection,
    deleteSelectedGpx,
  } = useGpx(mapBounds);

  useEffect(() => {
    const preventDefault = (e) => {
      e.preventDefault();
    };

    window.addEventListener('dragover', preventDefault, false);
    window.addEventListener('drop', preventDefault, false);

    return () => {
      window.removeEventListener('dragover', preventDefault, false);
      window.removeEventListener('drop', preventDefault, false);
    };
  }, []);

  useEffect(() => {
    if (isMobile) return;

    const horizontalSplit = Split(['#sidebar', '#main-area'], {
      sizes: [25, 75],
      minSize: [200, 300],
      gutterSize: 8,
      cursor: 'col-resize',
    });

    const verticalSplit = Split(['#map-area', '#graph-area'], {
      sizes: [70, 30],
      direction: 'vertical',
      minSize: [100, 100],
      gutterSize: 8,
      cursor: 'row-resize',
    });

    return () => {
      if (horizontalSplit) horizontalSplit.destroy();
      if (verticalSplit) verticalSplit.destroy();
    };
  }, [isMobile]);

  const sidebarClasses = `
    ${isMobile ? 'sidebar-mobile' : 'split'}
    ${isMobile && isSidebarOpen ? 'open' : ''}
  `;

  return (
    <div className="app-container">
      {isFilterModalOpen && (
        <FilterModal
          currentFilter={filter}
          onApplyFilter={setFilter}
          onClose={toggleFilterModal}
          mapBounds={mapBounds}
        />
      )}
      {isMobile && (
        <button className="hamburger-menu" onClick={toggleSidebar}>
          {isSidebarOpen ? <>&times;</> : <>&equiv;</>}
        </button>
      )}
      <div id="sidebar" className={sidebarClasses}>
        <Sidebar
          gpxTracks={gpxTracks}
          onFileAdd={addGpxFiles}
          onToggleVisibility={toggleGpxVisibility}
          onFocusGpx={setFocusedGpxId}
          focusedGpxId={focusedGpxId}
          onToggleFilterModal={toggleFilterModal}
          onResetSelection={resetSelection}
          onDeleteSelected={deleteSelectedGpx}
          mapBounds={mapBounds}
        />
      </div>
      {!isMobile && <div className="gutter gutter-horizontal"></div>}
      <div id="main-area" className={isMobile ? 'main-area-mobile' : 'split'}>
        <GpxInfoOverlay gpx={focusedGpxData} />
        {isMobile ? (
          <>
            <div className="view-toggle">
              <button onClick={() => setMobileView('map')} className={mobileView === 'map' ? 'active' : ''}>地図</button>
              <button onClick={() => setMobileView('graph')} className={mobileView === 'graph' ? 'active' : ''}>グラフ</button>
            </div>
            {mobileView === 'map' && (
              <div id="map-area" className="map-area-mobile">
                <Map 
                  gpxData={visibleGpxTracks} 
                  focusedGpxData={focusedGpxData}
                  hoveredPoint={hoveredPoint}
                  onBoundsChange={onBoundsChange}
                />
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
            <div id="map-area" className="split-vertical">
              <Map 
                gpxData={visibleGpxTracks} 
                focusedGpxData={focusedGpxData}
                hoveredPoint={hoveredPoint}
                onBoundsChange={onBoundsChange}
              />
            </div>
            <div id="graph-area" className="split-vertical">
              <ElevationGraph gpxData={visibleGpxTracks} onPointHover={setHoveredPoint} focusedGpxData={focusedGpxData} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default App;