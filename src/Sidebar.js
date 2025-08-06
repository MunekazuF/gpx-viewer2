import React, { useState } from 'react';
import './Sidebar.css';

const Sidebar = ({ gpxTracks, onFileAdd, onToggleVisibility, onFocusGpx, focusedGpxId, onToggleFilterModal, onResetSelection, onDeleteSelected, onOpenSettings, onCollapse }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (e) => {
    if (e.target.files) {
      onFileAdd(e.target.files);
      e.target.value = '';
    }
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFileAdd(e.dataTransfer.files);
    }
  };

  const formatDate = (date) => {
    if (!date) return '';
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}/${m}/${d}`;
  };

  const filesToRender = gpxTracks || [];

  return (
    <div
      className={`sidebar-container ${isDragging ? 'dragging' : ''}`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
    >
      <div className="sidebar-header">
        <label htmlFor="file-upload" className="file-upload-label">
          アップロード
        </label>
        <input
          id="file-upload"
          type="file"
          multiple
          accept=".gpx"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
        <button onClick={onToggleFilterModal} className="filter-button">
          フィルター
        </button>
        <button onClick={onCollapse} className="collapse-button">
          &lt;
        </button>
      </div>
      <div className="file-list">
        {filesToRender.map((data) => (
          <div
            key={data.id}
            className={`file-item ${data.id === focusedGpxId ? 'focused' : ''}`}
            onClick={() => onFocusGpx(data.id)}
          >
            <input
              type="checkbox"
              checked={data.isVisible}
              onChange={(e) => {
                e.stopPropagation();
                onToggleVisibility(data.id);
              }}
            />
            <span className="file-name">
              {formatDate(data.time)} {data.name}
            </span>
          </div>
        ))}
      </div>
      <div className="sidebar-footer">
        <button onClick={onResetSelection} className="reset-button">
          リセット
        </button>
        <button onClick={() => {
          if (window.confirm('選択したファイルを削除しますか？')) {
            onDeleteSelected();
          }
        }} className="delete-button">
          削除
        </button>
        <div className="version-info" onClick={onOpenSettings}>
          Version: {process.env.REACT_APP_VERSION}
        </div>
      </div>
      {isDragging && (
        <div className="drag-overlay">
          <p>ここにファイルをドロップ</p>
        </div>
      )}
    </div>
  );
};

export default Sidebar;