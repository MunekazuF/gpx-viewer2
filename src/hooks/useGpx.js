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
  const [isInfoOverlayVisible, setInfoOverlayVisible] = useState(false);
  const [currentFilter, setCurrentFilter] = useState({ keyword: '', startDate: '', endDate: '', useMapBounds: false, mapBounds: null });

  useEffect(() => {
    const loadMetadata = async () => {
      const metadata = await getAllGpxMetadata();
      const sortedTracks = metadata.map(meta => ({
        ...meta,
        isVisible: false,
        points: null,
        color: meta.color || generateColor() // DBに色がなければ生成
      })).sort((a, b) => {
        // timeがnullの場合はソートの最後に持ってくる
        if (!a.time && !b.time) return 0;
        if (!a.time) return 1;
        if (!b.time) return -1;
        return b.time.getTime() - a.time.getTime(); // 降順
      });
      setGpxTracks(sortedTracks);
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
          setGpxTracks(prev => {
            const newGpxList = [...prev, { ...metadata, isVisible: false, points: null }];
            return newGpxList.sort((a, b) => {
              if (!a.time && !b.time) return 0;
              if (!a.time) return 1;
              if (!b.time) return -1;
              return b.time.getTime() - a.time.getTime(); // 降順
            });
          });
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

  const setFocusedGpxId = (id) => {
    if (id && id === focusedGpxId) {
      // 同じIDが再度クリックされた場合は、オーバーレイの表示/非表示を切り替える
      // そして、MapControllerが再ズームするようにfocusedGpxDataを一時的にnullにする
      setInfoOverlayVisible(prev => !prev);
      setFocusedGpxData(null); // これでMapControllerのuseEffectが再実行される
      requestAnimationFrame(async () => {
        const fullData = await getGpxDataById(id);
        setFocusedGpxData(fullData);
        _setFocusedGpxId(id);
      });
    } else {
      // 新しいIDがクリックされた場合
      _setFocusedGpxId(null);
      setFocusedGpxData(null);
      if (id) {
        requestAnimationFrame(async () => {
          const fullData = await getGpxDataById(id);
          setFocusedGpxData(fullData);
          _setFocusedGpxId(id);
          setInfoOverlayVisible(true); // 新しいデータを表示
        });
      } else {
        setInfoOverlayVisible(false); // IDがnullなら非表示
      }
    }
  };

  const hideInfoOverlay = () => {
    setInfoOverlayVisible(false);
  };

  const resetSelection = useCallback(() => {
    setGpxTracks(prev => prev.map(track => ({ ...track, isVisible: false, points: null })));
    setInfoOverlayVisible(false);
    _setFocusedGpxId(null);
    setFocusedGpxData(null);
  }, []);

  const deleteSelectedGpx = async () => {
    const selectedIds = gpxTracks.filter(track => track.isVisible).map(track => track.id);
    if (selectedIds.length === 0) return;

    await deleteGpxDataByIds(selectedIds);
    setGpxTracks(prev => prev.filter(track => !selectedIds.includes(track.id)));
    // 削除されたトラックがフォーカスされていたら、フォーカスも解除
    if (selectedIds.includes(focusedGpxId)) {
        setInfoOverlayVisible(false);
        _setFocusedGpxId(null);
        setFocusedGpxData(null);
    }
  };

  const applyFilter = useCallback(async (filters) => {
    setCurrentFilter(filters);

    // フィルター条件がクリアされた場合はリセットを実行
    if (filters.isClear) {
      resetSelection();
      return;
    }

    // フィルター条件がデフォルトの場合は何もしない
    const isDefaultFilter = !filters.keyword && !filters.startDate && !filters.endDate && !filters.useMapBounds;
    if (isDefaultFilter) {
      return;
    }

    // 1. 適用前にすべての選択を解除
    const deselectedTracks = gpxTracks.map(track => 
      track.isVisible ? { ...track, isVisible: false, points: null } : track
    );

    // 2. メモリ上の軽量なメタデータでフィルタリング
    const filtered = filterGpxFiles(deselectedTracks, filters);
    const filteredIds = filtered.map(track => track.id);

    // 3. 上位20件を選択状態にする
    const tracksWithNewVisibility = deselectedTracks.map(track => {
      const isFiltered = filteredIds.includes(track.id);
      const shouldBeVisible = isFiltered && filteredIds.indexOf(track.id) < 20;
      return { ...track, isVisible: shouldBeVisible };
    });

    // 4. 表示が必要なトラックの完全なデータを読み込む
    const tracksToLoad = tracksWithNewVisibility.filter(t => t.isVisible && !t.points);
    if (tracksToLoad.length > 0) {
      const loadedTracksData = await Promise.all(
        tracksToLoad.map(t => getGpxDataById(t.id))
      );
      
      // 読み込んだデータで状態を更新
      setGpxTracks(currentTracks => {
        const updatedTracks = [...tracksWithNewVisibility];
        loadedTracksData.forEach(loadedTrack => {
          const index = updatedTracks.findIndex(t => t.id === loadedTrack.id);
          if (index !== -1) {
            updatedTracks[index] = { ...loadedTrack, isVisible: true };
          }
        });
        return updatedTracks;
      });
    } else {
      // 表示するトラックがない場合でも、非表示の状態を反映
      setGpxTracks(tracksWithNewVisibility);
    }
  }, [gpxTracks, resetSelection]);

  const sidebarTracks = useMemo(() => {
    const isFilterActive = currentFilter.keyword || currentFilter.startDate || currentFilter.endDate || currentFilter.useMapBounds;
    if (!isFilterActive) {
      return gpxTracks; // フィルターがなければ全件
    }
    // フィルターがあれば、フィルターにマッチしたものだけを返す
    return filterGpxFiles(gpxTracks, currentFilter);
  }, [gpxTracks, currentFilter]);

  const visibleGpxTracks = useMemo(() => {
    return gpxTracks.filter(t => t.isVisible && t.points);
  }, [gpxTracks]);

  return {
    gpxTracks: sidebarTracks, // サイドバー表示用
    visibleGpxTracks,
    focusedGpxData,
    isInfoOverlayVisible,
    hideInfoOverlay,
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
