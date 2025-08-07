import { calculateDistance } from './distanceCalculator';
import { filterGpxPoints } from './gpxFilter';

/**
 * GPXファイルのテキストを解析し、必要な情報を抽出する
 * @param {string} gpxText - GPXファイルのテキストコンテンツ
 * @returns {{name: string, time: Date | null, points: Array<{lat: number, lng: number, ele: number | null, time: Date | null, distance: number}>}}
 */
export const parseGpx = (gpxText) => {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(gpxText, "text/xml");

  const originalName = xmlDoc.getElementsByTagName("name")[0]?.textContent || "無題のトラック";
  const timeStr = xmlDoc.getElementsByTagName("time")[0]?.textContent;
  const time = timeStr ? new Date(timeStr) : null;

  // 1. GPXからポイントを抽出
  const trackPoints = xmlDoc.getElementsByTagName("trkpt");
  let initialPoints = Array.from(trackPoints).map(pt => {
    const eleTag = pt.getElementsByTagName("ele")[0];
    const timeTag = pt.getElementsByTagName("time")[0];
    return {
      lat: parseFloat(pt.getAttribute("lat")),
      lng: parseFloat(pt.getAttribute("lon")),
      ele: eleTag ? parseFloat(eleTag.textContent) : null,
      time: timeTag ? new Date(timeTag.textContent) : null,
    };
  });

  // 2. 異常なポイントを除外
  const filteredPoints = filterGpxPoints(initialPoints);

  // 3. フィルタリング後のポイントで累積距離を再計算
  let totalDistance = 0;
  const finalPoints = [];
  for (let i = 0; i < filteredPoints.length; i++) {
    const currentPoint = filteredPoints[i];
    if (i > 0) {
      const prevPoint = finalPoints[i - 1];
      totalDistance += calculateDistance(prevPoint, currentPoint);
    }
    finalPoints.push({
      ...currentPoint,
      distance: totalDistance,
    });
  }

  const startPoint = finalPoints.length > 0 ? { lat: finalPoints[0].lat, lng: finalPoints[0].lng } : null;
  const endPoint = finalPoints.length > 0 ? { lat: finalPoints[finalPoints.length - 1].lat, lng: finalPoints[finalPoints.length - 1].lng } : null;

  return { name: originalName, originalName, time, points: finalPoints, startPoint, endPoint };
};
