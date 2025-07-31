import React, { useState } from 'react';
import './FilterModal.css';

const FilterModal = ({ currentFilter, onApplyFilter, onClose }) => {
  const [keyword, setKeyword] = useState(currentFilter.keyword || '');

  const handleApply = () => {
    onApplyFilter({ keyword });
    onClose();
  };

  const handleClear = () => {
    setKeyword('');
    onApplyFilter({ keyword: '' });
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
          {/* ToDo: 他のフィルター（日付範囲など）をここに追加 */}
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
