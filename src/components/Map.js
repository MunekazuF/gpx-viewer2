import React from 'react';
import { MapContainer, TileLayer, LayersControl, ScaleControl, Polyline, Marker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

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

const Map = ({ gpxData, hoveredPoint, MapEventsComponent, MapControllerComponent }) => {
  // 初期表示位置を東京駅に設定
  const position = [35.681236, 139.767125];
  const gpxList = gpxData || [];

  return (
    <MapContainer center={position} zoom={13} style={{ height: '100%', width: '100%' }}>
      <LayersControl position="topright">
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
      <ScaleControl position="bottomleft" />

      {gpxList.map(gpx => (
        <Polyline
          key={gpx.id}
          positions={gpx.points.map(p => [p.lat, p.lng])}
          color={gpx.color || 'blue'}
        />
      ))}
      
      {hoveredPoint && <Marker position={[hoveredPoint.lat, hoveredPoint.lng]} />}
      
      {/* App.jsから渡されたコンポーネントをレンダリング */}
      <MapEventsComponent />
      <MapControllerComponent />

    </MapContainer>
  );
};

export default Map;