import { useState, useEffect, useMemo, useCallback } from 'react';
import { parseGpx } from '../utils/gpxParser';
import { saveGpxData, getAllGpxMetadata, getGpxDataById, deleteGpxDataByIds } from '../utils/db';
import { filterGpxFiles } from '../utils/gpxFilter';

// 緑色を避けつつ、ランダムで鮮やかな色を生成する
const generateColor = () => {
  let hue;
  do {
    hue = Math.floor(Math.random() * 360);
  } while (hue >= 80 && hue <= 160); // 緑色の範囲を避ける
  return `hsl(${hue}, 90%, 50%)`;
};

const useGpx = (mapBounds) => {
  const [gpxTracks, setGpxTracks] = useState([]); // 全てのGPXメタデータと表示状態
  const [focusedGpxId, _setFocusedGpxId] = useState(null);
  const [focusedGpxData, setFocusedGpxData] = useState(null); // フォーカスされたトラックの完全なデータ
  const [currentFilter, setCurrentFilter] = useState({ keyword: '', startDate: '', endDate: '', useMapBounds: false, mapBounds: null });

  useEffect(() => {
    const loadMetadata = async () => {
      const metadata = await getAllGpxMetadata();
      const tracks = metadata.map(meta => ({
        ...meta,
        isVisible: false,
        points: null,
        color: meta.color || generateColor() // DBに色がなければ生成
      }));
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
          const color = generateColor();
          const newTrack = { id: Date.now() + file.name, fileName: file.name, ...parsedData, color };
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

  const setFocusedGpxId = async (id) => {
    if (id) {
      const fullData = await getGpxDataById(id);
      setFocusedGpxData(fullData);
    } else {
      setFocusedGpxData(null);
    }
    _setFocusedGpxId(id);
  };

  const resetSelection = () => {
    setGpxTracks(prev => prev.map(track => ({ ...track, isVisible: false, points: null })));
  };

  const deleteSelectedGpx = async () => {
    const selectedIds = gpxTracks.filter(track => track.isVisible).map(track => track.id);
    if (selectedIds.length === 0) return;

    await deleteGpxDataByIds(selectedIds);
    setGpxTracks(prev => prev.filter(track => !selectedIds.includes(track.id)));
  };

  const applyFilter = useCallback(async (filters) => {
    setCurrentFilter(filters);

    const allTracksFullData = await Promise.all(
      gpxTracks.map(track => getGpxDataById(track.id))
    );

    const filtered = filterGpxFiles(allTracksFullData, filters);
    const filteredIds = filtered.map(track => track.id);

    const newGpxTracks = gpxTracks.map(track => {
      const isFiltered = filteredIds.includes(track.id);
      const shouldBeVisible = isFiltered && filteredIds.indexOf(track.id) < 20;

      if (shouldBeVisible) {
        const fullData = filtered.find(t => t.id === track.id);
        return { ...fullData, isVisible: true };
      } else {
        const { points, ...metadata } = track;
        return { ...metadata, isVisible: false, points: null };
      }
    });

    setGpxTracks(newGpxTracks);
  }, [gpxTracks]);

  const visibleGpxTracks = useMemo(() => {
    return gpxTracks.filter(t => t.isVisible && t.points);
  }, [gpxTracks]);

  return {
    gpxTracks: gpxTracks, // 全てのトラックを返す
    visibleGpxTracks,
    focusedGpxData,
    addGpxFiles,
    toggleGpxVisibility,
    focusedGpxId,
    setFocusedGpxId,
    filter: currentFilter, // フィルターの状態を返す
    setFilter: applyFilter, // フィルター適用関数を公開
    resetSelection,
    deleteSelectedGpx,
  };
};

export default useGpx;
