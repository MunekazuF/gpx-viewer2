import { calculateDistance } from './distanceCalculator';

// 1点間の最大許容距離 (km)。これより大きい距離の移動は異常とみなす。
const MAX_DISTANCE_BETWEEN_POINTS = 1.0; // 1km

// 標高スパイクを検出するための閾値 (m)。
const ELEVATION_SPIKE_THRESHOLD = 100; // 100m

/**
 * GPXのポイントデータから異常値を除外する
 * @param {Array<object>} points - パースされたGPXポイントの配列
 * @returns {Array<object>} フィルタリング後のGPXポイントの配列
 */
export const filterGpxPoints = (points) => {
  if (!points || points.length < 3) {
    return points;
  }

  // 1. 距離によるフィルタリング
  const distanceFiltered = points.filter((point, index) => {
    if (index === 0) return true;
    const prevPoint = points[index - 1];
    const distance = calculateDistance(prevPoint, point);
    return distance <= MAX_DISTANCE_BETWEEN_POINTS;
  });

  // 2. 標高によるフィルタリング
  const elevationFiltered = distanceFiltered.filter((point, index, arr) => {
    if (index === 0 || index === arr.length - 1) return true;

    const prevPoint = arr[index - 1];
    const nextPoint = arr[index + 1];

    if (point.ele === null || prevPoint.ele === null || nextPoint.ele === null) {
      return true;
    }

    const diffPrev = Math.abs(point.ele - prevPoint.ele);
    const diffNext = Math.abs(point.ele - nextPoint.ele);

    // 前後の両方の点から標高が大きく離れている場合、異常値とみなす
    if (diffPrev > ELEVATION_SPIKE_THRESHOLD && diffNext > ELEVATION_SPIKE_THRESHOLD) {
      console.log(`標高の異常値を検出して除外しました: ${point.ele}m`);
      return false;
    }

    return true;
  });

  return elevationFiltered;
};

/**
 * 指定された緯度経度ポイントが地図の境界内にあるかチェックする
 * @param {{lat: number, lng: number}} point - チェックするポイント
 * @param {{south: number, west: number, north: number, east: number}} bounds - 地図の境界
 * @returns {boolean} - 境界内にある場合はtrue
 */
const isPointInBounds = (point, bounds) => {
  if (!point || !bounds) return false;
  return (
    point.lat >= bounds.south &&
    point.lat <= bounds.north &&
    point.lng >= bounds.west &&
    point.lng <= bounds.east
  );
};

/**
 * GPXファイルリストをフィルター条件に基づいて絞り込む
 * @param {Array<object>} gpxFiles - GPXファイルのメタデータ配列
 * @param {object} filters - フィルター条件
 * @param {string} [filters.keyword] - ファイル名キーワード
 * @param {string} [filters.startDate] - 開始日 (YYYY-MM-DD)
 * @param {string} [filters.endDate] - 終了日 (YYYY-MM-DD)
 * @param {boolean} [filters.useMapBounds] - 地図の範囲を使用するか
 * @param {{south: number, west: number, north: number, east: number}} [filters.mapBounds] - 地図の境界
 * @returns {Array<object>} フィルターされたGPXファイルの配列
 */
export const filterGpxFiles = (gpxFiles, filters) => {
  const { keyword, startDate, endDate, useMapBounds, mapBounds } = filters;

  return gpxFiles.filter(gpx => {
    // キーワードフィルタ
    if (keyword && !gpx.name.toLowerCase().includes(keyword.toLowerCase())) {
      return false;
    }

    // 日付範囲フィルタ
    if (gpx.time) {
      const gpxDate = new Date(gpx.time);
      if (startDate) {
        const startFilterDate = new Date(startDate);
        if (gpxDate < startFilterDate) {
          return false;
        }
      }
      if (endDate) {
        const endFilterDate = new Date(endDate);
        // 日付の比較は日付の終わりまでを含むように調整
        endFilterDate.setDate(endFilterDate.getDate() + 1); // 翌日の00:00:00までを範囲に含める
        if (gpxDate >= endFilterDate) {
          return false;
        }
      }
    }

    // 地図範囲フィルタ
    if (useMapBounds && mapBounds) {
      const startInBounds = isPointInBounds(gpx.startPoint, mapBounds);
      const endInBounds = isPointInBounds(gpx.endPoint, mapBounds);
      if (!startInBounds && !endInBounds) {
        return false;
      }
    }

    return true;
  });
};
