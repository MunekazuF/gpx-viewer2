import { useMapEvents } from 'react-leaflet';

/**
 * 地図イベントを処理するコンポーネント
 * @param {object} props - コンポーネントのプロパティ
 * @param {function} props.onBoundsChange - 地図の表示範囲が変更されたときのコールバック
 * @param {function} props.onBaseLayerChange - ベースレイヤーが変更されたときのコールバック
 */
const MapEvents = ({ onBoundsChange, onBaseLayerChange }) => {
  const map = useMapEvents({
    moveend: () => onBoundsChange(map.getBounds()),
    zoomend: () => onBoundsChange(map.getBounds()),
    baselayerchange: (e) => onBaseLayerChange(e),
  });
  return null; // このコンポーネントはUIを描画しない
};

export default MapEvents;
