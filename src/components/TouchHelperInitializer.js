import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet-touch-helper';

/**
 * Leafletのタッチ操作を補助する `leaflet-touch-helper` を初期化するコンポーネント。
 * モバイルデバイスでの地図操作（特に2本指でのズームなど）を改善します。
 */
const TouchHelperInitializer = () => {
  const map = useMap();

  // mapオブジェクトが利用可能になったらTouchHelperを適用
  useEffect(() => {
    if (L.TouchHelper) {
      L.TouchHelper.addTo(map);
    }
  }, [map]);

  return null; // このコンポーネントはUIを描画しない
};

export default TouchHelperInitializer;
