import { useState } from 'react';
import { parseGpx } from '../utils/gpxParser';

const useGpx = () => {
  const [gpxData, setGpxData] = useState([]);

  /**
   * 新しいGPXファイルを追加し、解析する
   * @param {FileList} files - ファイル選択ダイアログから受け取ったファイルのリスト
   */
  const addGpxFiles = (files) => {
    const newFiles = Array.from(files).filter(file => {
      return !gpxData.some(existing => existing.fileName === file.name);
    });

    if (newFiles.length === 0) {
      return;
    }

    newFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const parsedData = parseGpx(e.target.result);
          const newGpx = {
            id: Date.now() + file.name,
            fileName: file.name,
            isVisible: true, // 表示状態プロパティを追加
            ...parsedData
          };
          setGpxData(prevData => [...prevData, newGpx]);
        } catch (error) {
          console.error("GPXファイルの解析に失敗しました:", error);
        }
      };
      reader.onerror = () => {
        console.error("ファイルの読み込みに失敗しました。");
      };
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

  return { gpxData, addGpxFiles, toggleGpxVisibility };
};

export default useGpx;
