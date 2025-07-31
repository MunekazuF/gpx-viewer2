import React, { useEffect } from 'react';
import Split from 'split.js';
import Sidebar from './Sidebar';
import ElevationGraph from './ElevationGraph';
import Map from './components/Map';
import useUI from './hooks/useUI';
import useGpx from './hooks/useGpx';
import './App.css';

function App() {
  const { isMobile, isSidebarOpen, toggleSidebar } = useUI();
  const { gpxData, addGpxFiles, toggleGpxVisibility } = useGpx();

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

  const visibleGpxData = gpxData.filter(data => data.isVisible);

  return (
    <div className="app-container">
      {isMobile && (
        <button className="hamburger-menu" onClick={toggleSidebar}>
          {isSidebarOpen ? <>&times;</> : <>&equiv;</>}
        </button>
      )}
      <div id="sidebar" className={sidebarClasses}>
        <Sidebar
          gpxData={gpxData}
          onFileAdd={addGpxFiles}
          onToggleVisibility={toggleGpxVisibility}
        />
      </div>
      {!isMobile && <div className="gutter gutter-horizontal"></div>}
      <div id="main-area" className={isMobile ? 'main-area-mobile' : 'split'}>
        <div id="map-area" className="split-vertical">
          <Map gpxData={visibleGpxData} />
        </div>
        <div id="graph-area" className="split-vertical">
          <ElevationGraph gpxData={visibleGpxData} />
        </div>
      </div>
    </div>
  );
}

export default App;
