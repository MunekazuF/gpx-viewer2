import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, LayersControl, ScaleControl, Polyline, Marker, useMap, useMapEvents, ZoomControl } from 'react-leaflet';
import L from 'leaflet';

// --- Leafletのデフォルトアイコン問題を修正 ---
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});
// --- 修正ここまで ---


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
  const map = useMap();
  const lastFittedIdRef = useRef(null); // 最後にfitBoundsしたIDを記録

  useEffect(() => {
    let targetGpx = null;
    if (focusedGpxData) {
      targetGpx = focusedGpxData;
    } else if (gpxData && gpxData.length === 1) {
      targetGpx = gpxData[0];
    }

    if (!targetGpx) {
      lastFittedIdRef.current = null;
      return;
    }

    if (targetGpx.id !== lastFittedIdRef.current) {
      if (targetGpx.points && targetGpx.points.length > 0) {
        const points = targetGpx.points.map(p => [p.lat, p.lng]);
        const bounds = L.latLngBounds(points);
        map.fitBounds(bounds, { padding: [50, 50] });
        lastFittedIdRef.current = targetGpx.id;
      }
    }
  }, [gpxData, focusedGpxData, map]);

  return null;
};


const Map = ({ gpxData, focusedGpxData, hoveredPoint, onBoundsChange }) => {
  // 初期表示位置を東京駅に設定
  const position = [35.681236, 139.767125];
  const gpxList = gpxData || [];

  return (
    <MapContainer center={position} zoom={13} style={{ height: '100%', width: '100%' }} zoomControl={false}>
      <ScaleControl position="bottomleft" />
      
      <LayersControl position="bottomright">
        <LayersControl.BaseLayer checked name="OpenStreetMap">
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
        </LayersControl.BaseLayer>
        <LayersControl.BaseLayer name="OpenStreetMap Japan">
          <TileLayer
            url="https://tile.openstreetmap.jp/styles/osm-bright/{z}/{x}/{y}.png"
            attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
          />
        </LayersControl.BaseLayer>
        <LayersControl.BaseLayer name="国土地理院">
          <TileLayer
            url="https://cyberjapandata.gsi.go.jp/xyz/std/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://maps.gsi.go.jp/development/ichiran.html">国土地理院</a>'
          />
        </LayersControl.BaseLayer>
      </LayersControl>
      <ZoomControl position="bottomright" />

      {gpxList.map(gpx => (
        <Polyline
          key={gpx.id}
          positions={gpx.points.map(p => [p.lat, p.lng])}
          color={gpx.color || 'blue'}
        />
      ))}
      
      {hoveredPoint && <Marker position={[hoveredPoint.lat, hoveredPoint.lng]} />}
      
      <MapEvents onBoundsChange={onBoundsChange} />
      <MapController gpxData={gpxData} focusedGpxData={focusedGpxData} />

    </MapContainer>
  );
};

export default Map;
