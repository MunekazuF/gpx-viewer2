import React from 'react';
import './Sidebar.css';

const Sidebar = ({ gpxData, onFileAdd }) => {
  const handleFileChange = (e) => {
    if (e.target.files) {
      onFileAdd(e.target.files);
      e.target.value = '';
    }
  };

  // gpxDataがundefinedの場合に備えてデフォルト値を設定
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
            {/* ToDo: 仕様書通りのフォーマット `yyyy/mm/dd ファイル名` にする */}
            {data.fileName}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Sidebar;
