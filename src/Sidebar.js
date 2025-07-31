import React from 'react';
import './Sidebar.css';

const Sidebar = ({ gpxTracks, onFileAdd, onToggleVisibility, onFocusGpx, focusedGpxId, onToggleFilterModal }) => {
  const handleFileChange = (e) => {
    if (e.target.files) {
      onFileAdd(e.target.files);
      e.target.value = '';
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
    <div className="sidebar-container">
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
    </div>
  );
};

export default Sidebar;
