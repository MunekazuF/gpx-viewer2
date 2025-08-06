import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, LayersControl, ScaleControl, Polyline, Marker, useMap, useMapEvents, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-touch-helper'; // leaflet-touch-helperをインポート
import StartEndMarkers from './StartEndMarkers';
import { getCookie, setCookie } from '../utils/cookie';

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
const MapEvents = ({ onBoundsChange, onBaseLayerChange }) => {
  const map = useMapEvents({
    moveend: () => onBoundsChange(map.getBounds()),
    zoomend: () => onBoundsChange(map.getBounds()),
    baselayerchange: (e) => onBaseLayerChange(e), // baselayerchangeイベントをリッスン
  });
  return null;
};

// --- MapController: 地図の表示範囲を自動調整するコンポーネント ---
const MapController = ({ gpxData, focusedGpxData }) => {
  const map = useMap();

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

// --- TouchHelperInitializer: Leaflet Touch Helperを初期化するコンポーネント ---
const TouchHelperInitializer = () => {
  const map = useMap();
  useEffect(() => {
    if (L.TouchHelper) {
      L.TouchHelper.addTo(map);
    }
  }, [map]);
  return null;
};


const Map = ({ gpxData, focusedGpxData, hoveredPoint, onBoundsChange, onTrackClick, settingsChanged }) => {
  // 初期表示位置を東京駅に設定
  const position = [35.681236, 139.767125];
  const gpxList = gpxData || [];

  const mapRef = useRef();
  const [selectedTile, setSelectedTile] = useState(() => {
    return getCookie('mapTile') || 'OpenStreetMap';
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      if (mapRef.current) {
        mapRef.current.invalidateSize();
      }
    }, 100); // 100ms後に実行

    return () => clearTimeout(timer);
  }, []);

  const handleBaseLayerChange = (e) => {
    const newTileName = e.name;
    setSelectedTile(newTileName);
    setCookie('mapTile', newTileName, 365);
  };

  return (
    <MapContainer center={position} zoom={13} style={{ height: '100%', width: '100%' }} zoomControl={false} ref={mapRef}>
      <ScaleControl position="bottomleft" />
      
      <LayersControl position="bottomright" onBaseLayerChange={handleBaseLayerChange}>
        <LayersControl.BaseLayer checked={selectedTile === 'OpenStreetMap'} name="OpenStreetMap">
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
        </LayersControl.BaseLayer>
        <LayersControl.BaseLayer checked={selectedTile === 'OpenStreetMap Japan'} name="OpenStreetMap Japan">
          <TileLayer
            url="https://tile.openstreetmap.jp/styles/osm-bright/{z}/{x}/{y}.png"
            attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
          />
        </LayersControl.BaseLayer>
        <LayersControl.BaseLayer checked={selectedTile === '国土地理院'} name="国土地理院">
          <TileLayer
            url="https://cyberjapandata.gsi.go.jp/xyz/std/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://maps.gsi.go.jp/development/ichiran.html">国土地理院</a>'
          />
        </LayersControl.BaseLayer>
        <LayersControl.BaseLayer checked={selectedTile === 'OpenTopoMap'} name="OpenTopoMap">
          <TileLayer
            url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>, Tiles: <a href="https://opentopomap.org/">OpenTopoMap</a>'
            maxZoom={17}
          />
        </LayersControl.BaseLayer>
        <LayersControl.BaseLayer checked={selectedTile === 'Esri WorldTopoMap'} name="Esri WorldTopoMap">
          <TileLayer
            url="https://services.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}"
            attribution='Sources: Esri, HERE, Garmin, Intermap, INCREMENT P, GEBCO, USGS, FAO, NPS, NRCan, GeoBase, IGN, Kadaster NL, Ordnance Survey, Esri Japan, METI, Mapwithyou, NOSTRA, &copy; OpenStreetMap contributors, and the GIS user community.'
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
      
      <MapEvents onBoundsChange={onBoundsChange} onBaseLayerChange={handleBaseLayerChange} />
      <MapController gpxData={gpxData} focusedGpxData={focusedGpxData} />
      <StartEndMarkers gpxData={gpxList} settingsChanged={settingsChanged} />
      <TouchHelperInitializer />

    </MapContainer>
  );
};

export default Map;