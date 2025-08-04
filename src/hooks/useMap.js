import React, { useState, useEffect, useRef } from 'react';
import { useMapEvents, useMap as useLeafletMap } from 'react-leaflet';
import L from 'leaflet';

// --- MapEvents: 地図の移動/ズームイベントを捕捉するコンポーネント ---
const MapEvents = ({ onBoundsChange }) => {
  const map = useMapEvents({
    moveend: () => onBoundsChange(map.getBounds()),
    zoomend: () => onBoundsChange(map.getBounds()),
  });
  return null;
};

// --- MapController: 地図の表示範囲を自動調整するコンポーネント ---
const MapController = ({ gpxData, focusedGpxData }) => {
  const map = useLeafletMap();

  useEffect(() => {
    let targetGpx = null;
    if (focusedGpxData) {
      targetGpx = focusedGpxData;
    } else if (gpxData && gpxData.length === 1) {
      targetGpx = gpxData[0];
    }

    if (targetGpx?.points?.length > 0) {
      const points = targetGpx.points.map(p => [p.lat, p.lng]);
      const bounds = L.latLngBounds(points);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [gpxData, focusedGpxData, map]);

  return null;
};

// --- useMap: 地図関連のロジックと状態を管理するカスタムフック ---
const useMap = () => {
  const [mapBounds, setMapBounds] = useState(null);
  const lastBoundsRef = useRef(null);

  const handleBoundsChange = (newBounds) => {
    const lastBounds = lastBoundsRef.current;
    // 前回のboundsと比較し、変更がある場合のみstateを更新
    if (!lastBounds || !newBounds.equals(lastBounds)) {
      lastBoundsRef.current = newBounds;
      setMapBounds(newBounds);
    }
  };

  const MapEventsComponent = () => <MapEvents onBoundsChange={handleBoundsChange} />;

  const MapControllerComponent = ({ gpxData, focusedGpxData }) => (
    <MapController gpxData={gpxData} focusedGpxData={focusedGpxData} />
  );

  return {
    mapBounds,
    MapEventsComponent,
    MapControllerComponent,
  };
};

export default useMap;
