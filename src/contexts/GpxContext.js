import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { parseGpx } from '../utils/gpxParser';
import { saveGpxData, getAllGpxMetadata, getGpxDataById, deleteGpxDataByIds, updateGpxData } from '../utils/db';
import { filterGpxFiles } from '../utils/gpxFilter';

/**
 * GPXデータ管理のためのReact Context
 */
const GpxContext = createContext();

/**
 * GpxContextにアクセスするためのカスタムフック
 * @returns {object} GPXコンテキストの値
 */
export const useGpxContext = () => useContext(GpxContext);

/**
 * GPXトラックに割り当てるためのランダムで鮮やかな色を生成します。
 * 地図上で見やすいように、緑色の範囲（HUE: 80-160）は避けます。
 * @returns {string} HSL形式のカラーコード (e.g., "hsl(240, 90%, 50%)")
 */
const generateColor = () => {
  let hue;
  do {
    hue = Math.floor(Math.random() * 360);
  } while (hue >= 80 && hue <= 160); // 緑色の範囲を避ける
  return `hsl(${hue}, 90%, 50%)`;
};

/**
 * GPXデータの状態と操作を提供するコンポーネント。
 * このProvider内で、GPXファイルの追加、表示切替、フィルタリング、削除などのロジックを管理します。
 * @param {object} props - コンポーネントのプロパティ
 * @param {React.ReactNode} props.children - 子コンポーネント
 */
export const GpxProvider = ({ children }) => {
  const [gpxTracks, setGpxTracks] = useState([]); // 全てのGPXメタデータと表示状態
  const [focusedGpxId, _setFocusedGpxId] = useState(null);
  const [focusedGpxData, setFocusedGpxData] = useState(null); // フォーカスされたトラックの完全なデータ
  const [isInfoOverlayVisible, setInfoOverlayVisible] = useState(false);
  const [currentFilter, setCurrentFilter] = useState({ keyword: '', startDate: '', endDate: '', useMapBounds: false, mapBounds: null });

  // 初期化時にIndexedDBからGPXメタデータをロード
  useEffect(() => {
    const loadMetadata = async () => {
      const metadata = await getAllGpxMetadata();
      const tracksToUpdateInDb = [];
      const processedMetadata = metadata.map(meta => {
        let currentOriginalName = meta.originalName || meta.name;

        // Prepare updates for IndexedDB if properties were missing
        if (!meta.originalName) {
          tracksToUpdateInDb.push({ id: meta.id, originalName: currentOriginalName });
        }

        return {
          ...meta, // Start with original meta to preserve other properties
          originalName: currentOriginalName,
          isVisible: false,
          points: null,
          color: meta.color || generateColor() // DBに色がなければ生成
        };
      });

      const sortedTracks = processedMetadata.sort((a, b) => {
        if (!a.time && !b.time) return 0;
        if (!a.time) return 1;
        if (!b.time) return -1;
        return b.time.getTime() - a.time.getTime(); // 日付の降順でソート
      });
      setGpxTracks(sortedTracks);

      // Persist changes to IndexedDB
      for (const trackUpdate of tracksToUpdateInDb) {
        await updateGpxData(trackUpdate.id, trackUpdate); // originalNameを更新
      }
    };
    loadMetadata();
  }, []);

  /**
   * 複数のGPXファイルを追加し、パースしてDBに保存後、stateを更新します。
   * @param {FileList} files - ユーザーが選択したファイルのリスト
   */
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

  /**
   * 指定されたIDのGPXトラックの表示/非表示を切り替えます。
   * 表示する場合はDBから完全なポイントデータを読み込みます。
   * @param {string} id - トグルするGPXトラックのID
   */
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

  /**
   * 指定されたIDのGPXトラックにフォーカスします。
   * フォーカスされたトラックは強調表示され、情報オーバーレイが表示されます。
   * @param {string | null} id - フォーカスするGPXトラックのID。nullでフォーカス解除。
   */
  const setFocusedGpxId = (id) => {
    if (id && id === focusedGpxId) {
      // すでにフォーカスされているトラックをクリックした場合、情報オーバーレイの表示を切り替える
      setInfoOverlayVisible(prev => !prev);
      setFocusedGpxData(null);
      requestAnimationFrame(async () => {
        const fullData = await getGpxDataById(id);
        setFocusedGpxData(fullData);
        _setFocusedGpxId(id);
      });
    } else {
      _setFocusedGpxId(null);
      setFocusedGpxData(null);
      if (id) {
        // 新しいトラックにフォーカス
        requestAnimationFrame(async () => {
          const fullData = await getGpxDataById(id);
          setFocusedGpxData(fullData);
          _setFocusedGpxId(id);
          setInfoOverlayVisible(true);
        });
      } else {
        // フォーカス解除
        setInfoOverlayVisible(false);
      }
    }
  };

  /**
   * GPX情報オーバーレイを非表示にします。
   */
  const hideInfoOverlay = () => {
    setInfoOverlayVisible(false);
  };

  /**
   * 全てのGPXトラックの表示状態とフォーカスをリセットします。
   */
  const resetSelection = useCallback(() => {
    setGpxTracks(prev => prev.map(track => ({ ...track, isVisible: false, points: null })));
    setInfoOverlayVisible(false);
    _setFocusedGpxId(null);
    setFocusedGpxData(null);
  }, []);

  /**
   * 全てのGPXトラックの表示状態をONにします。
   * 20件を超える場合は確認ダイアログを表示します。
   */
  const checkAllGpxTracks = async () => {
    const tracksToLoad = [];
    const updatedTracks = gpxTracks.map(track => {
      if (!track.isVisible) {
        tracksToLoad.push(track);
      }
      return { ...track, isVisible: true };
    });

    if (tracksToLoad.length > 20) {
      if (!window.confirm(`20件を超えるGPXトラック（${tracksToLoad.length}件）を全て表示しますか？`)) {
        return; // ユーザーがキャンセルしたら何もしない
      }
    }

    // 必要なトラックの完全なデータをロード
    const loadedTracksData = await Promise.all(
      tracksToLoad.map(t => getGpxDataById(t.id))
    );

    setGpxTracks(currentTracks => {
      const finalTracks = [...currentTracks];
      loadedTracksData.forEach(loadedTrack => {
        const index = finalTracks.findIndex(t => t.id === loadedTrack.id);
        if (index !== -1) {
          finalTracks[index] = { ...loadedTrack, isVisible: true };
        }
      });
      return finalTracks;
    });
  };

  /**
   * 現在表示されている（選択されている）GPXトラックを削除します。
   */
  const deleteSelectedGpx = async (idsToDelete) => {
    const ids = idsToDelete || gpxTracks.filter(track => track.isVisible).map(track => track.id);
    if (ids.length === 0) return;

    await deleteGpxDataByIds(ids);
    setGpxTracks(prev => prev.filter(track => !ids.includes(track.id)));
    if (ids.includes(focusedGpxId)) {
        setInfoOverlayVisible(false);
        _setFocusedGpxId(null);
        setFocusedGpxData(null);
    }
  };

  /**
   * 指定されたIDのGPXトラックの情報を更新します。
   * @param {string} id - 更新するGPXトラックのID
   * @param {object} updates - 更新するプロパティと値のオブジェクト
   */
  const updateGpxTrack = async (id, updates) => {
    await updateGpxData(id, updates);
    setGpxTracks(prev => prev.map(track => 
      track.id === id ? { ...track, ...updates } : track
    ));
    // フォーカスされているトラックが更新された場合、focusedGpxDataも更新
    if (focusedGpxId === id) {
      setFocusedGpxData(prev => ({ ...prev, ...updates }));
    }
  };

  /**
   * フィルター条件を適用し、GPXトラックの表示状態を更新します。
   * @param {object} filters - 適用するフィルター条件
   */
  const applyFilter = useCallback(async (filters) => {
    setCurrentFilter(filters);

    if (filters.isClear) {
      resetSelection();
      return;
    }

    const isDefaultFilter = !filters.keyword && !filters.startDate && !filters.endDate && !filters.useMapBounds;
    if (isDefaultFilter) {
      return;
    }

    const deselectedTracks = gpxTracks.map(track => 
      track.isVisible ? { ...track, isVisible: false, points: null } : track
    );

    const filtered = filterGpxFiles(deselectedTracks, filters);
    const filteredIds = filtered.map(track => track.id);

    const tracksWithNewVisibility = deselectedTracks.map(track => {
      const isFiltered = filteredIds.includes(track.id);
      const shouldBeVisible = isFiltered && filteredIds.indexOf(track.id) < 20; // 表示上限20件
      return { ...track, isVisible: shouldBeVisible };
    });

    const tracksToLoad = tracksWithNewVisibility.filter(t => t.isVisible && !t.points);
    if (tracksToLoad.length > 0) {
      const loadedTracksData = await Promise.all(
        tracksToLoad.map(t => getGpxDataById(t.id))
      );
      
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
      setGpxTracks(tracksWithNewVisibility);
    }
  }, [gpxTracks, resetSelection]);

  /**
   * サイドバーに表示するためのフィルタリングされたGPXトラックのリスト
   */
  const sidebarTracks = useMemo(() => {
    const isFilterActive = currentFilter.keyword || currentFilter.startDate || currentFilter.endDate || currentFilter.useMapBounds;
    if (!isFilterActive) {
      return gpxTracks;
    }
    return filterGpxFiles(gpxTracks, currentFilter);
  }, [gpxTracks, currentFilter]);

  /**
   * 地図上に表示するためのGPXトラックのリスト（表示状態でフィルタリング済み）
   */
  const visibleGpxTracks = useMemo(() => {
    return gpxTracks.filter(t => t.isVisible && t.points);
  }, [gpxTracks]);

  // コンテキストとして提供する値
  const value = {
    gpxTracks: sidebarTracks,
    visibleGpxTracks,
    focusedGpxData,
    isInfoOverlayVisible,
    hideInfoOverlay,
    addGpxFiles,
    toggleGpxVisibility,
    focusedGpxId,
    setFocusedGpxId,
    filter: currentFilter,
    setFilter: applyFilter,
    resetSelection,
    deleteSelectedGpx,
    updateGpxTrack,
    checkAllGpxTracks,
  };

  return <GpxContext.Provider value={value}>{children}</GpxContext.Provider>;
};