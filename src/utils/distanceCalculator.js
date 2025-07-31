/**
 * 2つの緯度経度座標間の距離を計算する（ハーバーサイン公式）
 * @param {{lat: number, lng: number}} point1 - 1点目の座標
 * @param {{lat: number, lng: number}} point2 - 2点目の座標
 * @returns {number} 2点間の距離 (km)
 */
export const calculateDistance = (point1, point2) => {
  const R = 6371; // 地球の半径 (km)
  const dLat = deg2rad(point2.lat - point1.lat);
  const dLon = deg2rad(point2.lng - point1.lng);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(point1.lat)) * Math.cos(deg2rad(point2.lat)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // 距離 (km)
  return d;
};

/**
 * 度をラジアンに変換する
 * @param {number} deg - 度
 * @returns {number} ラジアン
 */
function deg2rad(deg) {
  return deg * (Math.PI / 180);
}
