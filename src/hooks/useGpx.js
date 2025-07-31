import { useState, useEffect, useMemo } from 'react';
import { parseGpx } from '../utils/gpxParser';
import { saveGpxData, getAllGpxMetadata, getGpxDataById } from '../utils/db';

const useGpx = () => {
  const [gpxTracks, setGpxTracks] = useState([]);
  const [focusedGpxId, _setFocusedGpxId] = useState(null);
  const [focusedGpxData, setFocusedGpxData] = useState(null); // フォーカスされたトラックの完全なデータ
  const [filter, setFilter] = useState({ keyword: '' });

  useEffect(() => {
    const loadMetadata = async () => {
      const metadata = await getAllGpxMetadata();
      const tracks = metadata.map(meta => ({ ...meta, isVisible: false, points: null }));
      setGpxTracks(tracks);
    };
    loadMetadata();
  }, []);

  const addGpxFiles = (files) => {
    const newFiles = Array.from(files).filter(file => !gpxTracks.some(track => track.fileName === file.name));
    if (newFiles.length === 0) return;

    newFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const parsedData = parseGpx(e.target.result);
          const newTrack = { id: Date.now() + file.name, fileName: file.name, ...parsedData };
          await saveGpxData(newTrack);
          const { points, ...metadata } = newTrack;
          setGpxTracks(prev => [...prev, { ...metadata, isVisible: false, points: null }]);
        } catch (error) { console.error("GPX解析/保存エラー:", error); }
      };
      reader.readAsText(file);
    });
  };

  const toggleGpxVisibility = async (id) => {
    const targetTrack = gpxTracks.find(track => track.id === id);
    if (!targetTrack) return;

    const newVisibility = !targetTrack.isVisible;

    if (newVisibility) {
      const fullData = await getGpxDataById(id);
      setGpxTracks(prev => prev.map(track => track.id === id ? { ...fullData, isVisible: true } : track));
    } else {
      setGpxTracks(prev => prev.map(track => track.id === id ? { ...track, isVisible: false, points: null } : track));
    }
  };

  // フォーカスするGPXのIDを設定する新しい関数
  const setFocusedGpxId = async (id) => {
    if (id) {
      const fullData = await getGpxDataById(id);
      setFocusedGpxData(fullData);
    } else {
      setFocusedGpxData(null);
    }
    _setFocusedGpxId(id);
  };

  const filteredGpxTracks = useMemo(() => {
    return gpxTracks.filter(track => {
      if (filter.keyword && !track.name.toLowerCase().includes(filter.keyword.toLowerCase())) {
        return false;
      }
      return true;
    });
  }, [gpxTracks, filter]);

  return {
    gpxTracks: filteredGpxTracks,
    visibleGpxTracks: gpxTracks.filter(t => t.isVisible && t.points),
    focusedGpxData, // 新しく返す
    addGpxFiles,
    toggleGpxVisibility,
    focusedGpxId,
    setFocusedGpxId,
    filter,
    setFilter,
  };
};

export default useGpx;
