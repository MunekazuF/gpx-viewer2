import React, { useState, useEffect } from 'react';
import { hslToHex, hexToHsl } from '../utils/colorConverter';
import './EditGpxModal.css';

const EditGpxModal = ({ isOpen, onClose, gpxData, onSave }) => {
  const [fileName, setFileName] = useState('');
  const [trackColor, setTrackColor] = useState('#000000');

  useEffect(() => {
    if (isOpen && gpxData) {
      setFileName(gpxData.name || '');
      // HSL形式の色をHEX形式に変換して設定
      setTrackColor(gpxData.color && gpxData.color.startsWith("hsl") ? hslToHex(gpxData.color) : gpxData.color || '#000000');
      console.log("Editing GPX color:", gpxData.color);
    }
  }, [isOpen, gpxData]);

  const handleSave = () => {
    // HEX形式の色をHSL形式に変換して保存
    const colorToSave = trackColor.startsWith("#") ? hexToHsl(trackColor) : trackColor;
    onSave(gpxData.id, { name: fileName, color: colorToSave });
    onClose();
  };

  const handleReset = () => {
    setFileName(gpxData.originalName || '');
    // HSL形式の色をHEX形式に変換して設定
    setTrackColor(gpxData.color && gpxData.color.startsWith("hsl") ? hslToHex(gpxData.color) : gpxData.color || '#000000');
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>GPX情報編集</h2>
        <div className="form-group">
          <label htmlFor="fileName">ファイル名:</label>
          <input
            type="text"
            id="fileName"
            value={fileName}
            onChange={(e) => setFileName(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label htmlFor="trackColor">軌跡の色:</label>
          <input
            type="color"
            id="trackColor"
            value={trackColor}
            onChange={(e) => setTrackColor(e.target.value)}
          />
        </div>
        <div className="modal-actions">
          <button onClick={handleSave}>保存</button>
          <button onClick={handleReset}>リセット</button>
          <button onClick={onClose}>キャンセル</button>
        </div>
      </div>
    </div>
  );
};

export default EditGpxModal;
