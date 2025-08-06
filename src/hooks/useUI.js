import { useState, useEffect, useCallback } from 'react';

/**
 * アプリケーション全体のUI状態とロジックを管理するカスタムフック。
 * ウィンドウサイズに応じたレスポンシブデザインの制御、モーダルやサイドバーの開閉、
 * ビューの切り替えなどを担当します。
 * @returns {object} UIの状態とそれを操作する関数を含むオブジェクト
 */
const useUI = () => {
  // デバイス種別（モバイル、タブレット）の状態
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isTablet, setIsTablet] = useState(window.innerWidth > 768 && window.innerWidth <= 1366);
  
  // UI要素の表示状態
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isFilterModalOpen, setFilterModalOpen] = useState(false);
  const [isSettingsModalOpen, setSettingsModalOpen] = useState(false);
  
  // モバイル表示時のビュー（地図 or グラフ）
  const [mobileView, setMobileView] = useState('map'); 
  
  // グラフエリアのサイズモード（通常, 最大化, 最小化）
  const [graphSizeMode, setGraphSizeMode] = useState('normal');

  // ウィンドウリサイズ時にデバイス種別を更新
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
      setIsTablet(window.innerWidth > 768 && window.innerWidth <= 1366);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  /**
   * モバイル表示でサイドバーの開閉をトグルします。
   */
  const toggleSidebar = () => {
    if (isMobile) {
      setSidebarOpen(!isSidebarOpen);
    }
  };

  /**
   * デスクトップ/タブレット表示でサイドバーの折りたたみをトグルします。
   */
  const toggleSidebarCollapse = () => {
    setSidebarCollapsed(!isSidebarCollapsed);
  };

  /**
   * フィルターモーダルの表示をトグルします。
   */
  const toggleFilterModal = () => {
    setFilterModalOpen(!isFilterModalOpen);
  };

  /**
   * グラフエリアのサイズモードを 'normal' -> 'maximized' -> 'minimized' -> 'normal' の順で切り替えます。
   */
  const toggleGraphSizeMode = useCallback(() => {
    setGraphSizeMode(currentMode => {
      if (currentMode === 'normal') return 'maximized';
      if (currentMode === 'maximized') return 'minimized';
      return 'normal';
    });
  }, []);

  /**
   * 設定モーダルの表示をトグルします。
   */
  const toggleSettingsModal = () => {
    setSettingsModalOpen(!isSettingsModalOpen);
  };

  /**
   * 現在のグラフサイズモードに基づいて、グラフエリアに適用するスタイルを返します。
   * @returns {object} Reactのstyleオブジェクト
   */
  const getGraphAreaStyle = () => {
    if (isMobile || graphSizeMode === 'normal') return {};
    if (graphSizeMode === 'maximized') return { flexGrow: 1, height: '100%', minHeight: '0' };
    if (graphSizeMode === 'minimized') return { flexGrow: 0, height: '0', minHeight: '0', overflow: 'hidden' };
    return {};
  };

  /**
   * 現在のグラフサイズモードに基づいて、地図エリアに適用するスタイルを返します。
   * @returns {object} Reactのstyleオブジェクト
   */
  const getMapAreaStyle = () => {
    if (isMobile || graphSizeMode === 'normal') return {};
    if (graphSizeMode === 'maximized') return { flexGrow: 0, height: '0', minHeight: '0', overflow: 'hidden' };
    if (graphSizeMode === 'minimized') return { flexGrow: 1, height: '100%', minHeight: '0' };
    return {};
  };
  
  /**
   * 現在のグラフサイズモードに基づいて、サイズ切り替えボタンのアイコンを返します。
   * @returns {string} アイコンとして表示する文字列
   */
  const getGraphButtonIcon = () => {
    if (graphSizeMode === 'normal') return '↗'; // 最大化
    if (graphSizeMode === 'maximized') return '↙'; // 通常サイズに戻す
    return '↔'; // 最小化から通常サイズに戻す
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
    graphSizeMode,
    toggleGraphSizeMode,
    isSettingsModalOpen,
    toggleSettingsModal,
    getGraphAreaStyle,
    getMapAreaStyle,
    getGraphButtonIcon
  };
};

export default useUI;
