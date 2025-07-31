/**
 * GPXファイルのテキストを解析し、必要な情報を抽出する
 * @param {string} gpxText - GPXファイルのテキストコンテンツ
 * @returns {{name: string, time: Date | null, points: Array<{lat: number, lng: number}>}}
 */
export const parseGpx = (gpxText) => {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(gpxText, "text/xml");

  // GPX名を取得
  const name = xmlDoc.getElementsByTagName("name")[0]?.textContent || "無題のトラック";

  // 日付を取得
  const timeStr = xmlDoc.getElementsByTagName("time")[0]?.textContent;
  const time = timeStr ? new Date(timeStr) : null;

  // 軌跡のポイントを取得
  const trackPoints = xmlDoc.getElementsByTagName("trkpt");
  const points = Array.from(trackPoints).map(pt => {
    return {
      lat: parseFloat(pt.getAttribute("lat")),
      lng: parseFloat(pt.getAttribute("lon")),
    };
  });

  return { name, time, points };
};
