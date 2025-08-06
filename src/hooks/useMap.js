import { useState, useRef } from 'react';

/**
 * 地図の状態とインタラクションを管理するカスタムフック
 * @returns {object} - 地図の境界、および境界変更ハンドラーを含むオブジェクト
 * @property {object|null} mapBounds - 現在の地図の表示範囲 (LeafletのBoundsオブジェクト)
 * @property {function} onBoundsChange - 地図の表示範囲が変更されたときに呼び出されるコールバック関数
 */
const useMap = () => {
  const [mapBounds, setMapBounds] = useState(null);
  const lastBoundsRef = useRef(null);

  /**
   * 地図の表示範囲が変更されたときに呼び出されるハンドラー。
   * パフォーマンス向上のため、範囲が実際に変更された場合のみstateを更新します。
   * @param {object} newBounds - 新しい地図の表示範囲 (LeafletのBoundsオブジェクト)
   */
  const handleBoundsChange = (newBounds) => {
    const lastBounds = lastBoundsRef.current;
    // 前回の境界と異なる場合のみ更新
    if (!lastBounds || !newBounds.equals(lastBounds)) {
      lastBoundsRef.current = newBounds;
      setMapBounds(newBounds);
    }
  };

  return {
    mapBounds,
    onBoundsChange: handleBoundsChange,
  };
};

export default useMap;
