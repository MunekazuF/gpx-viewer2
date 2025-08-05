import React from 'react';
import './GpxInfoOverlay.css';

const GpxInfoOverlay = ({ gpx, onClose }) => {
  if (!gpx) {
    return null;
  }

  // 詳細情報を計算
  const calculateStats = (points) => {
    let totalDistance = 0;
    let elevationGain = 0;
    let maxEle = -Infinity;
    let minEle = Infinity;

    if (points && points.length > 0) {
      totalDistance = points[points.length - 1].distance;

      points.forEach((p, i) => {
        if (p.ele !== null) {
          if (p.ele > maxEle) maxEle = p.ele;
          if (p.ele < minEle) minEle = p.ele;
        }
        if (i > 0 && points[i - 1].ele < p.ele) {
          elevationGain += p.ele - points[i - 1].ele;
        }
      });
    }
    return { totalDistance, elevationGain, maxEle, minEle };
  };

  const stats = calculateStats(gpx.points);

  const formatDate = (date) => date ? new Intl.DateTimeFormat('ja-JP').format(date) : 'N/A';
  const formatTime = (date) => date ? new Intl.DateTimeFormat('ja-JP', { hour: '2-digit', minute: '2-digit' }).format(date) : 'N/A';
  const formatNumber = (num) => new Intl.NumberFormat('ja-JP').format(num);

  return (
    <div className="gpx-info-overlay" onClick={onClose}>
      <h3>{gpx.name}</h3>
      <ul>
        <li><strong>出発日:</strong> {formatDate(gpx.time)}</li>
        <li><strong>出発時間:</strong> {formatTime(gpx.points[0]?.time)}</li>
        <li><strong>到着時間:</strong> {formatTime(gpx.points[gpx.points.length - 1]?.time)}</li>
        <li><strong>総距離:</strong> {stats.totalDistance.toFixed(2)} km</li>
        <li><strong>獲得標高:</strong> {formatNumber(stats.elevationGain.toFixed(0))} m</li>
        <li><strong>最高標高:</strong> {stats.maxEle > -Infinity ? `${formatNumber(stats.maxEle.toFixed(0))} m` : 'N/A'}</li>
        <li><strong>最低標高:</strong> {stats.minEle < Infinity ? `${formatNumber(stats.minEle.toFixed(0))} m` : 'N/A'}</li>
      </ul>
    </div>
  );
};

export default GpxInfoOverlay;
