import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, LayersControl, ScaleControl, Polyline, Marker, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import StartEndMarkers from './StartEndMarkers';
import { getCookie, setCookie } from '../utils/cookie';
import { useGpxContext } from '../contexts/GpxContext';
import MapEvents from './MapEvents';
import MapController from './MapController';
import TouchHelperInitializer from './TouchHelperInitializer';

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

/**
 * 地図コンポーネント
 * @param {object} props - コンポーネントのプロパティ
 * @param {object} props.hoveredPoint - 標高グラフでホバーされているポイント
 * @param {function} props.onBoundsChange - 地図の表示範囲が変更されたときのコールバック
 * @param {boolean} props.settingsChanged - 設定が変更されたかどうか
 */
const Map = ({ hoveredPoint, onBoundsChange, settingsChanged, mapRef }) => {
  const { visibleGpxTracks, focusedGpxData, setFocusedGpxId } = useGpxContext();
  const position = [35.681236, 139.767125]; // 初期表示位置（東京駅）
  const gpxList = visibleGpxTracks || [];

  const [selectedTile, setSelectedTile] = useState(() => {
    return getCookie('mapTile') || 'OpenStreetMap';
  });

  // コンポーネントのマウント時に地図のサイズを再描画
  useEffect(() => {
    const timer = setTimeout(() => {
      if (mapRef.current) {
        mapRef.current.invalidateSize();
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [mapRef]);

  

  

  


  /**
   * ベースレイヤー（タイル）が変更されたときのハンドラー
   * @param {object} e - イベントオブジェクト
   */
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
        <LayersControl.BaseLayer checked={selectedTile === '地理院淡色地図'} name="地理院淡色地図">
          <TileLayer
            url="https://cyberjapandata.gsi.go.jp/xyz/pale/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://maps.gsi.go.jp/development/ichiran.html">国土地理院</a>'
          />
        </LayersControl.BaseLayer>
        <LayersControl.BaseLayer checked={selectedTile === '地理院白地図'} name="地理院白地図">
          <TileLayer
            url="https://cyberjapandata.gsi.go.jp/xyz/blank/{z}/{x}/{y}.png"
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
            key={`${gpx.id}-${isFocused}-${gpx.color}`}
            positions={gpx.points.map(p => [p.lat, p.lng])}
            color={gpx.color || 'blue'}
            weight={isFocused ? 5 : 3}
            eventHandlers={{
              click: () => setFocusedGpxId(gpx.id),
            }}
          />
        );
      })}
      
      {hoveredPoint && <Marker position={[hoveredPoint.lat, hoveredPoint.lng]} />}
      
      <MapEvents onBoundsChange={onBoundsChange} onBaseLayerChange={handleBaseLayerChange} />
      <MapController />
      <StartEndMarkers gpxData={gpxList} settingsChanged={settingsChanged} />
      <TouchHelperInitializer />

    </MapContainer>
  );
};

export default Map;
