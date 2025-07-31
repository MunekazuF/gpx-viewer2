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
            id: Date.now() + file.name, // ユニークなIDを生成
            fileName: file.name,
            ...parsedData
          };
          setGpxData(prevData => [...prevData, newGpx]);
        } catch (error) {
          console.error("GPXファイルの解析に失敗しました:", error);
          // ToDo: ユーザーにエラーを通知する
        }
      };
      reader.onerror = () => {
        console.error("ファイルの読み込みに失敗しました。");
        // ToDo: ユーザーにエラーを通知する
      };
      reader.readAsText(file);
    });
  };

  return { gpxData, addGpxFiles };
};

export default useGpx;
