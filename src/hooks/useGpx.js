import { useState, useMemo } from 'react';
import { parseGpx } from '../utils/gpxParser';

const useGpx = () => {
  const [gpxData, setGpxData] = useState([]);
  const [focusedGpxId, setFocusedGpxId] = useState(null);
  const [filter, setFilter] = useState({ keyword: '' }); // フィルター条件

  /**
   * 新しいGPXファイルを追加し、解析する
   * @param {FileList} files - ファイル選択ダイアログから受け取ったファイルのリスト
   */
  const addGpxFiles = (files) => {
    const newFiles = Array.from(files).filter(file => {
      return !gpxData.some(existing => existing.fileName === file.name);
    });

    if (newFiles.length === 0) return;

    newFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const parsedData = parseGpx(e.target.result);
          const newGpx = {
            id: Date.now() + file.name,
            fileName: file.name,
            isVisible: true,
            ...parsedData
          };
          setGpxData(prevData => [...prevData, newGpx]);
        } catch (error) { console.error("GPXファイルの解析に失敗しました:", error); }
      };
      reader.onerror = () => { console.error("ファイルの読み込みに失敗しました。"); };
      reader.readAsText(file);
    });
  };

  /**
   * GPXデータの表示/非表示を切り替える
   * @param {string} id - 対象のGPXデータのID
   */
  const toggleGpxVisibility = (id) => {
    setGpxData(prevData =>
      prevData.map(data =>
        data.id === id ? { ...data, isVisible: !data.isVisible } : data
      )
    );
  };

  // フィルター条件に基づいて表示するデータをメモ化
  const filteredGpxData = useMemo(() => {
    return gpxData.filter(data => {
      if (filter.keyword && !data.name.toLowerCase().includes(filter.keyword.toLowerCase())) {
        return false;
      }
      // ToDo: 他のフィルター条件（日付、地図範囲）をここに追加
      return true;
    });
  }, [gpxData, filter]);

  return {
    allGpxData: gpxData, // 全データ
    filteredGpxData,      // フィルタリング後のデータ
    addGpxFiles,
    toggleGpxVisibility,
    focusedGpxId,
    setFocusedGpxId,
    filter,
    setFilter,
  };
};

export default useGpx;
