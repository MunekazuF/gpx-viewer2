import React, { useState } from 'react';
import { clearAllGpxData } from '../utils/db';
import { getCookie, setCookie } from '../utils/cookie';
import './SettingsModal.css';

const SettingsModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const DEFAULT_ZOOM_THRESHOLD = 12; // 設計書に記載のデフォルト値
  const [zoomThreshold, setZoomThreshold] = useState(() => {
    const savedThreshold = getCookie('zoomThreshold');
    return savedThreshold ? parseInt(savedThreshold, 10) : DEFAULT_ZOOM_THRESHOLD;
  });

  const handleClearAllData = () => {
    if (window.confirm('全てのデータを削除します。よろしいですか？')) {
      clearAllGpxData();
      window.location.reload(); // ページをリロード
    }
  };

  const handleZoomThresholdChange = (e) => {
    const newThreshold = parseInt(e.target.value, 10);
    setZoomThreshold(newThreshold);
    setCookie('zoomThreshold', newThreshold.toString(), 365);
  };

  const zoomOptions = [];
  for (let i = 0; i <= 18; i++) {
    zoomOptions.push(<option key={i} value={i}>{i}</option>);
  }

  return (
    <div className="settings-modal-overlay" onClick={onClose}>
      <div className="settings-modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>設定</h2>
        <div className="settings-section">
          <h3>データ管理</h3>
          <button onClick={handleClearAllData} className="clear-data-button">データ全削除</button>
        </div>
        <div className="settings-section">
          <h3>マーカー表示設定</h3>
          <div className="setting-item">
            <label htmlFor="zoom-threshold">閾値:</label>
            <select id="zoom-threshold" value={zoomThreshold} onChange={handleZoomThresholdChange}>
              {zoomOptions}
            </select>
          </div>
          <p className="setting-description">このズームレベル以下でマーカーが非表示になります。</p>
        </div>
        <button onClick={onClose}>閉じる</button>
      </div>
    </div>
  );
};

export default SettingsModal;
