import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { useGpxContext } from '../contexts/GpxContext';

/**
 * 地図の表示を制御するコンポーネント
 * GPXトラックの表示状態に応じて、地図の表示範囲を自動的に調整します。
 */
const MapController = () => {
  const map = useMap();
  const { visibleGpxTracks, focusedGpxData } = useGpxContext();

  // visibleGpxTracksまたはfocusedGpxDataが変更されたときに地図の表示範囲を更新
  useEffect(() => {
    // フォーカスされたGPXデータがある場合、そのトラックにズーム
    if (focusedGpxData) {
      if (focusedGpxData.points && focusedGpxData.points.length > 0) {
        const points = focusedGpxData.points.map(p => [p.lat, p.lng]);
        const bounds = L.latLngBounds(points);
        map.invalidateSize(); // コンテナサイズ変更を再計算
        map.fitBounds(bounds, { padding: [50, 50] }); // バウンズにフィット
      }
      return;
    }

    // 表示されているGPXトラックが1つだけの場合、そのトラックにズーム
    if (visibleGpxTracks && visibleGpxTracks.length === 1) {
      const singleTrack = visibleGpxTracks[0];
      if (singleTrack.points && singleTrack.points.length > 0) {
        const points = singleTrack.points.map(p => [p.lat, p.lng]);
        const bounds = L.latLngBounds(points);
        map.invalidateSize();
        map.fitBounds(bounds, { padding: [50, 50] });
      }
    }
  }, [visibleGpxTracks, focusedGpxData, map]);

  return null; // このコンポーネントはUIを描画しない
};

export default MapController;
