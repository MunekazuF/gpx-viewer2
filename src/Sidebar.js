import React from 'react';
import './Sidebar.css';

const Sidebar = ({ gpxData, onFileAdd, onToggleVisibility }) => {
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

  const filesToRender = gpxData || [];

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
      </div>
      <div className="file-list">
        {filesToRender.map((data) => (
          <div key={data.id} className="file-item">
            <input
              type="checkbox"
              checked={data.isVisible}
              onChange={() => onToggleVisibility(data.id)}
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
