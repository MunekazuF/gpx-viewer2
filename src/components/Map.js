import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, LayersControl, ScaleControl, Polyline, Marker, useMap, useMapEvents, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import StartEndMarkers from './StartEndMarkers';

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
  const lastFittedIdRef = useRef(null);

  useEffect(() => {
    // ユーザーによるフォーカス操作を最優先で処理
    if (focusedGpxData) {
      if (focusedGpxData.points && focusedGpxData.points.length > 0) {
        const points = focusedGpxData.points.map(p => [p.lat, p.lng]);
        const bounds = L.latLngBounds(points);
        map.invalidateSize();
        map.fitBounds(bounds, { padding: [50, 50] });
      }
      return; // フォーカスがある場合は、ここで処理を終了
    }

    // フォーカスが無く、表示トラックが1つの場合のみ、自動ズーム
    if (gpxData && gpxData.length === 1) {
      const singleTrack = gpxData[0];
      if (singleTrack.points && singleTrack.points.length > 0) {
        const points = singleTrack.points.map(p => [p.lat, p.lng]);
        const bounds = L.latLngBounds(points);
        map.invalidateSize();
        map.fitBounds(bounds, { padding: [50, 50] });
      }
    }
  }, [gpxData, focusedGpxData, map]);

  return null;
};


const Map = ({ gpxData, focusedGpxData, hoveredPoint, onBoundsChange, onTrackClick }) => {
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

      {gpxList.map(gpx => {
        const isFocused = focusedGpxData && gpx.id === focusedGpxData.id;
        return (
          <Polyline
            key={`${gpx.id}-${isFocused}`}
            positions={gpx.points.map(p => [p.lat, p.lng])}
            color={gpx.color || 'blue'}
            weight={isFocused ? 5 : 3}
            eventHandlers={{
              click: () => onTrackClick(gpx.id),
            }}
          />
        );
      })}
      
      {hoveredPoint && <Marker position={[hoveredPoint.lat, hoveredPoint.lng]} />}
      
      <MapEvents onBoundsChange={onBoundsChange} />
      <MapController gpxData={gpxData} focusedGpxData={focusedGpxData} />
      <StartEndMarkers gpxData={gpxList} />

    </MapContainer>
  );
};

export default Map;