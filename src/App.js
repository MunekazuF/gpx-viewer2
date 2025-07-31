import React, { useEffect } from 'react';
import Split from 'split.js';
import Sidebar from './Sidebar';
import ElevationGraph from './ElevationGraph';
import useUI from './hooks/useUI';
import './App.css';

function App() {
  const { isMobile, isSidebarOpen, toggleSidebar } = useUI();

  useEffect(() => {
    if (isMobile) return; // スマホ表示ではSplit.jsを初期化しない

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
      // コンポーネントのクリーンアップ時にSplitインスタンスを破棄
      if (horizontalSplit) horizontalSplit.destroy();
      if (verticalSplit) verticalSplit.destroy();
    };
  }, [isMobile]); // isMobileが変わるたびにeffectを再実行

  const sidebarClasses = `
    ${isMobile ? 'sidebar-mobile' : 'split'}
    ${isMobile && isSidebarOpen ? 'open' : ''}
  `;

  return (
    <div className="app-container">
      {isMobile && (
        <button className="hamburger-menu" onClick={toggleSidebar}>
          {isSidebarOpen ? <>&times;</> : <>&equiv;</>}
        </button>
      )}
      <div id="sidebar" className={sidebarClasses}>
        <Sidebar />
      </div>
      {!isMobile && <div className="gutter gutter-horizontal"></div>}
      <div id="main-area" className={isMobile ? 'main-area-mobile' : 'split'}>
        <div id="map-area" className="split-vertical">
          <p>Map Area</p>
        </div>
        <div id="graph-area" className="split-vertical">
          <ElevationGraph />
        </div>
      </div>
    </div>
  );
}

export default App;
