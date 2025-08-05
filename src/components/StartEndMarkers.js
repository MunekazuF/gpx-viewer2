
import React, { useState, useEffect } from 'react';
import { Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import { getCookie } from '../utils/cookie';

// --- Leafletのデフォルトアイコン問題を修正 ---
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// --- カスタムアイコンの定義 ---
const createColoredIcon = (className) => {
  return new L.Icon({
    ...L.Icon.Default.prototype.options,
    iconUrl: markerIcon,
    iconRetinaUrl: markerIcon2x,
    shadowUrl: markerShadow,
    className: className
  });
};

const startIcon = createColoredIcon('start-marker-icon');
const endIcon = createColoredIcon('end-marker-icon');


const StartEndMarkers = ({ gpxData, settingsChanged }) => {
  const map = useMap();
  const [currentZoom, setCurrentZoom] = useState(map.getZoom());
  const [zoomThreshold, setZoomThreshold] = useState(() => {
    const savedThreshold = getCookie('zoomThreshold');
    return savedThreshold ? parseInt(savedThreshold, 10) : 12; // デフォルト値は12
  });

  useEffect(() => {
    const handleZoom = () => {
      const newZoom = map.getZoom();
      setCurrentZoom(newZoom);
    };

    map.on('zoomend', handleZoom);

    return () => {
      map.off('zoomend', handleZoom);
    };
  }, [map]);

  useEffect(() => {
    const savedThreshold = getCookie('zoomThreshold');
    const newThreshold = savedThreshold ? parseInt(savedThreshold, 10) : 12;
    setZoomThreshold(newThreshold);
  }, [settingsChanged]);

  if (currentZoom <= zoomThreshold) {
    return null;
  }

  return (
    <>
      {gpxData.map(track => {
        if (!track.points || track.points.length === 0) {
          return null;
        }
        const startPoint = track.points[0];
        const endPoint = track.points[track.points.length - 1];

        return (
          <React.Fragment key={track.id}>
            <Marker position={[startPoint.lat, startPoint.lng]} icon={startIcon} />
            <Marker position={[endPoint.lat, endPoint.lng]} icon={endIcon} />
          </React.Fragment>
        );
      })}
    </>
  );
};

export default StartEndMarkers;
