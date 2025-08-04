import React, { useEffect } from 'react';
import { MapContainer, TileLayer, LayersControl, ScaleControl, Polyline, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';

const MapEvents = ({ onBoundsChange }) => {
  const map = useMapEvents({
    moveend: () => {
      onBoundsChange(map.getBounds());
    },
    zoomend: () => {
      onBoundsChange(map.getBounds());
    },
  });
  return null;
};

const MapController = ({ gpxData, focusedGpxData }) => {
  const map = useMap();

  useEffect(() => {
    let targetGpx = null;

    // 1. フォーカスされたGPXデータを最優先
    if (focusedGpxData) {
      targetGpx = focusedGpxData;
    }
    // 2. フォーカスがなければ、表示されているGPXデータが1つの場合
    else if (gpxData && gpxData.length === 1) {
      targetGpx = gpxData[0];
    }

    if (targetGpx && targetGpx.points && targetGpx.points.length > 0) {
      const points = targetGpx.points.map(p => [p.lat, p.lng]);
      const bounds = L.latLngBounds(points);
      map.fitBounds(bounds);
    }
  }, [gpxData, focusedGpxData, map]);

  return null;
}

const Map = ({ gpxData, focusedGpxData, onBoundsChange }) => {
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
          color="blue" // ToDo: 仕様書通りランダムな色にする
        />
      ))}
      <MapEvents onBoundsChange={onBoundsChange} />
      <MapController gpxData={gpxData} focusedGpxData={focusedGpxData} />
    </MapContainer>
  );
};

export default Map;
