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

  const resetSelection = () => {
    setGpxTracks(prev => prev.map(track => ({ ...track, isVisible: false, points: null })));
    setInfoOverlayVisible(false);
    _setFocusedGpxId(null);
    setFocusedGpxData(null);
  };

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

    // メモリ上の軽量なメタデータのみでフィルタリング
    const filtered = filterGpxFiles(gpxTracks, filters);
    const filteredIds = filtered.map(track => track.id);

    // フィルター結果をisVisibleフラグに反映
    const newGpxTracks = gpxTracks.map(track => {
      const isFiltered = filteredIds.includes(track.id);
      // 20件の上限を維持しつつ、表示状態を更新
      const shouldBeVisible = isFiltered && filteredIds.indexOf(track.id) < 20;
      
      // isVisibleが変更される可能性のあるトラックのみを更新
      if (track.isVisible !== shouldBeVisible) {
        return { ...track, isVisible: shouldBeVisible, points: null }; // 表示時にpointsは再取得
      }
      return track;
    });

    // 実際に表示されるトラックの完全なデータを非同期で読み込む
    const tracksToLoad = newGpxTracks.filter(t => t.isVisible && !t.points);
    if (tracksToLoad.length > 0) {
      const loadedTracks = await Promise.all(
        tracksToLoad.map(t => getGpxDataById(t.id))
      );
      
      setGpxTracks(currentTracks => {
        const updatedTracks = [...currentTracks];
        loadedTracks.forEach(loadedTrack => {
          const index = updatedTracks.findIndex(t => t.id === loadedTrack.id);
          if (index !== -1) {
            updatedTracks[index] = { ...loadedTrack, isVisible: true };
          }
        });
        return updatedTracks;
      });
    } else {
      setGpxTracks(newGpxTracks);
    }
  }, [gpxTracks]);

  const visibleGpxTracks = useMemo(() => {
    return gpxTracks.filter(t => t.isVisible && t.points);
  }, [gpxTracks]);

  return {
    gpxTracks: gpxTracks, // 全てのトラックを返す
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
