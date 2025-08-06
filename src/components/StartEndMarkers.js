
import React, { useState, useEffect } from 'react';
import { Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import { getCookie } from '../utils/cookie';

// --- Leafletのデフォルトアイコン問題を修正 ---
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

/**
 * カスタムカラーのLeafletアイコンを作成します。
 * @param {string} className - アイコンに適用するCSSクラス名
 * @returns {L.Icon} - LeafletのIconオブジェクト
 */
const createColoredIcon = (className) => {
  return new L.Icon({
    ...L.Icon.Default.prototype.options,
    iconUrl: markerIcon,
    iconRetinaUrl: markerIcon2x,
    shadowUrl: markerShadow,
    className: className
  });
};

// 始点・終点用のアイコンを定義
const startIcon = createColoredIcon('start-marker-icon');
const endIcon = createColoredIcon('end-marker-icon');


/**
 * GPXトラックの始点と終点にマーカーを表示するコンポーネント
 * @param {object} props - コンポーネントのプロパティ
 * @param {Array<object>} props.gpxData - 表示対象のGPXデータ配列
 * @param {boolean} props.settingsChanged - 設定変更を検知するためのフラグ
 */
const StartEndMarkers = ({ gpxData, settingsChanged }) => {
  const map = useMap();
  const [currentZoom, setCurrentZoom] = useState(map.getZoom());
  const [zoomThreshold, setZoomThreshold] = useState(() => {
    const savedThreshold = getCookie('zoomThreshold');
    return savedThreshold ? parseInt(savedThreshold, 10) : 12; // デフォルト値は12
  });

  // 地図のズームレベルを監視
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

  // 設定が変更されたらズーム閾値を更新
  useEffect(() => {
    const savedThreshold = getCookie('zoomThreshold');
    const newThreshold = savedThreshold ? parseInt(savedThreshold, 10) : 12;
    setZoomThreshold(newThreshold);
  }, [settingsChanged]);

  // 現在のズームレベルが閾値以下ならマーカーを表示しない
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
