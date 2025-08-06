import React, { useState } from 'react';
import { useGpxContext } from '../contexts/GpxContext';
import './FilterModal.css';

/**
 * フィルターモーダルコンポーネント
 * @param {object} props - コンポーネントのプロパティ
 * @param {function} props.onClose - モーダルを閉じるための関数
 * @param {object} props.mapBounds - 現在の地図の表示範囲
 */
const FilterModal = ({ onClose, mapBounds }) => {
  const { filter: currentFilter, setFilter: onApplyFilter } = useGpxContext();
  const [keyword, setKeyword] = useState(currentFilter.keyword || '');
  const [startDate, setStartDate] = useState(currentFilter.startDate || '');
  const [endDate, setEndDate] = useState(currentFilter.endDate || '');
  const [useMapBounds, setUseMapBounds] = useState(currentFilter.useMapBounds || false);

  /**
   * フィルターを適用するハンドラー
   */
  const handleApply = () => {
    let boundsToApply = null;
    if (useMapBounds && mapBounds && mapBounds._southWest && mapBounds._northEast) {
      boundsToApply = {
        south: mapBounds._southWest.lat,
        west: mapBounds._southWest.lng,
        north: mapBounds._northEast.lat,
        east: mapBounds._northEast.lng,
      };
    }
    onApplyFilter({ keyword, startDate, endDate, useMapBounds, mapBounds: boundsToApply });
    onClose();
  };

  /**
   * フィルターをクリアするハンドラー
   */
  const handleClear = () => {
    setKeyword('');
    setStartDate('');
    setEndDate('');
    setUseMapBounds(false);
    onApplyFilter({ keyword: '', startDate: '', endDate: '', useMapBounds: false, mapBounds: null, isClear: true });
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>フィルター</h2>
          <button onClick={onClose} className="close-button">&times;</button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label htmlFor="keyword">キーワード</label>
            <input
              type="text"
              id="keyword"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="GPX名で検索"
            />
          </div>
          <div className="form-group">
            <label>日付範囲</label>
            <div className="date-range-picker">
              <input
                type="date"
                id="startDate"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
              <span>-</span>
              <input
                type="date"
                id="endDate"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={useMapBounds}
                onChange={(e) => setUseMapBounds(e.target.checked)}
              />
              地図の範囲を適用
            </label>
          </div>
        </div>
        <div className="modal-footer">
          <button onClick={handleClear} className="clear-button">クリア</button>
          <button onClick={handleApply} className="apply-button">適用</button>
        </div>
      </div>
    </div>
  );
};

export default FilterModal;
