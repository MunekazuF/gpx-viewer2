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
