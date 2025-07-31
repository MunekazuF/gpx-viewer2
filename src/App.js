import React, { useEffect } from 'react';
import Split from 'split.js';
import Sidebar from './Sidebar';
import ElevationGraph from './ElevationGraph';
import Map from './components/Map';
import GpxInfoOverlay from './GpxInfoOverlay';
import FilterModal from './FilterModal'; // FilterModalをインポート
import useUI from './hooks/useUI';
import useGpx from './hooks/useGpx';
import './App.css';

function App() {
  const { isMobile, isSidebarOpen, toggleSidebar, isFilterModalOpen, toggleFilterModal } = useUI();
  const {
    filteredGpxData,
    addGpxFiles,
    toggleGpxVisibility,
    focusedGpxId,
    setFocusedGpxId,
    filter,
    setFilter,
    allGpxData
  } = useGpx();

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

  const visibleGpxData = filteredGpxData.filter(data => data.isVisible);
  const focusedGpxData = allGpxData.find(data => data.id === focusedGpxId);

  return (
    <div className="app-container">
      {isFilterModalOpen && (
        <FilterModal
          currentFilter={filter}
          onApplyFilter={setFilter}
          onClose={toggleFilterModal}
        />
      )}
      {isMobile && (
        <button className="hamburger-menu" onClick={toggleSidebar}>
          {isSidebarOpen ? <>&times;</> : <>&equiv;</>}
        </button>
      )}
      <div id="sidebar" className={sidebarClasses}>
        <Sidebar
          gpxData={filteredGpxData} // フィルタリング後のデータを渡す
          onFileAdd={addGpxFiles}
          onToggleVisibility={toggleGpxVisibility}
          onFocusGpx={setFocusedGpxId}
          focusedGpxId={focusedGpxId}
          onToggleFilterModal={toggleFilterModal}
        />
      </div>
      {!isMobile && <div className="gutter gutter-horizontal"></div>}
      <div id="main-area" className={isMobile ? 'main-area-mobile' : 'split'}>
        <GpxInfoOverlay gpx={focusedGpxData} />
        <div id="map-area" className="split-vertical">
          <Map gpxData={visibleGpxData} focusedGpxId={focusedGpxId} />
        </div>
        <div id="graph-area" className="split-vertical">
          <ElevationGraph gpxData={visibleGpxData} />
        </div>
      </div>
    </div>
  );
}

export default App;
