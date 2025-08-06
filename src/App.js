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

/**
 * アプリケーションのメインコンポーネント
 * 全体のレイアウトとコンポーネント間の連携を管理します。
 */
function App() {
  // 標高グラフ上でホバーされたポイントの状態
  const [hoveredPoint, setHoveredPoint] = useState(null);
  // UI関連のカスタムフック
  const { 
    isMobile, isTablet, isSidebarOpen, toggleSidebar, 
    isSidebarCollapsed, toggleSidebarCollapse, 
    isFilterModalOpen, toggleFilterModal, 
    mobileView, setMobileView,
    graphSizeMode, toggleGraphSizeMode,
    isSettingsModalOpen, toggleSettingsModal,
    getGraphAreaStyle, getMapAreaStyle, getGraphButtonIcon
  } = useUI();
  // 地図関連のカスタムフック
  const { mapBounds, onBoundsChange } = useMap();
  // GPXコンテキストから情報を取得
  const { isInfoOverlayVisible } = useGpxContext();
  // 設定変更を子コンポーネントに通知するための状態
  const [settingsChanged, setSettingsChanged] = useState(false);

  // Split.jsのインスタンスを保持するためのref
  const horizontalSplitRef = useRef(null);
  const verticalSplitRef = useRef(null);

  /**
   * 設定モーダルを閉じるハンドラー
   * 設定が変更された可能性があるため、settingsChangedフラグを更新します。
   */
  const handleCloseSettingsModal = () => {
    toggleSettingsModal();
    setSettingsChanged(prev => !prev);
  };

  // グローバルなドラッグ＆ドロップのデフォルト動作を無効化
  useEffect(() => {
    const preventDefault = (e) => e.preventDefault();
    window.addEventListener('dragover', preventDefault, false);
    window.addEventListener('drop', preventDefault, false);
    return () => {
      window.removeEventListener('dragover', preventDefault, false);
      window.removeEventListener('drop', preventDefault, false);
    };
  }, []);

  // 水平方向の分割レイアウト（サイドバーとメインエリア）を管理
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

  // 垂直方向の分割レイアウト（地図とグラフ）を管理
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


  // サイドバーの表示／非表示状態に応じてレイアウトを調整
  useEffect(() => {
    if (!isMobile && horizontalSplitRef.current) {
      const sidebarSize = isTablet ? 30 : 15;
      horizontalSplitRef.current.setSizes(isSidebarCollapsed ? [0, 100] : [sidebarSize, 100 - sidebarSize]);
    }
  }, [isSidebarCollapsed, isMobile, isTablet]);

  const sidebarClasses = `${isMobile ? 'sidebar-mobile' : 'split'} ${isMobile && isSidebarOpen ? 'open' : ''}`;

  return (
    <div className="app-container">
      {/* モーダル表示 */}
      {isFilterModalOpen && (
        <FilterModal onClose={toggleFilterModal} mapBounds={mapBounds} />
      )}
      {isSettingsModalOpen && (
        <SettingsModal isOpen={isSettingsModalOpen} onClose={handleCloseSettingsModal} />
      )}

      {/* モバイル用のUI要素 */}
      {isMobile && (
        <button className="hamburger-menu" onClick={toggleSidebar}>
          {isSidebarOpen ? <>&times;</> : <>&equiv;</>}
        </button>
      )}
      {/* デスクトップ／タブレット用のサイドバー展開ボタン */}
      {!isMobile && isSidebarCollapsed && (
        <button className="sidebar-expand-button" onClick={toggleSidebarCollapse}>
          &gt;
        </button>
      )}

      {/* サイドバー */}
      <div id="sidebar" className={sidebarClasses}>
        <Sidebar onToggleFilterModal={toggleFilterModal} mapBounds={mapBounds} onOpenSettings={toggleSettingsModal} onCollapse={toggleSidebarCollapse} />
      </div>
      {!isMobile && <div className="gutter gutter-horizontal"></div>}
      
      {/* メインエリア */}
      <div id="main-area" className={isMobile ? 'main-area-mobile' : 'split'}>
        {isInfoOverlayVisible && <GpxInfoOverlay />}
        {!isMobile && (
          <button onClick={toggleGraphSizeMode} className="graph-size-toggle-btn" title="グラフサイズ切替">
            {getGraphButtonIcon()}
          </button>
        )}

        {/* モバイル表示とデスクトップ表示の切り替え */}
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
