import React, { useState, useMemo, useCallback } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { useGpxContext } from '../contexts/GpxContext';
import './ElevationGraph.css';

// Chart.jsに必要なコンポーネントを登録
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

// 数値を3桁区切りの文字列にフォーマットする
const formatNumber = (num) => new Intl.NumberFormat('ja-JP').format(num);

/**
 * @typedef {object} CrosshairPluginOptions
 * @property {object} focusedGpxData - フォーカスされているGPXトラックのデータ
 * @property {function} onPointHover - グラフ上のホバー位置情報を親コンポーネントに通知するコールバック
 * @property {boolean} isMergeMode - グラフがマージモードかどうか
 * @property {Array<object>} mergedPoints - マージモード時に結合されたポイントの配列
 */

/**
 * グラフ上にマウスカーソルに追従する十字線とマーカーを表示するChart.jsプラグイン
 * @type {import('chart.js').Plugin}
 */
const crosshairPlugin = {
  id: 'crosshair',

  // イベント（マウス移動など）の後に呼び出されるフック
  afterEvent: (chart, args) => {
    const { event } = args;
    const { canvas, scales, options } = chart;
    const { x: xAxis, y: yAxis } = scales;
    /** @type {CrosshairPluginOptions} */
    const pluginOptions = options.plugins.crosshair || {};
    const { focusedGpxData, onPointHover, isMergeMode, mergedPoints } = pluginOptions;

    // 十字線を消去するヘルパー関数
    const clearCrosshair = () => {
      if (chart.crosshair) {
        chart.crosshair = undefined; // 十字線情報を削除
        if (onPointHover) onPointHover(null); // 地図上のマーカーも消去
        chart.draw(); // グラフを再描画
      }
    };

    // どのポイント配列を使用するかを決定する
    let pointsToUse = [];
    let currentFocusedGpxData = null;

    if (isMergeMode && mergedPoints && mergedPoints.length > 0) {
      // マージモードの場合は、結合されたポイントを使用
      pointsToUse = mergedPoints;
    } else if (focusedGpxData) {
      // 通常モードの場合は、フォーカスされているトラックのポイントを使用
      pointsToUse = focusedGpxData.points;
      currentFocusedGpxData = focusedGpxData;
    }

    // 対象となるポイントがない場合は十字線を消去
    if (!pointsToUse || pointsToUse.length === 0) {
      clearCrosshair();
      return;
    }
    
    // マウスがグラフエリアから離れたら十字線を消去
    if (event.type === 'mouseout') {
      clearCrosshair();
      return;
    }

    // マウスが移動した際の処理
    if (event.type === 'mousemove') {
      const mouseX = event.x;
      const mouseY = event.y;

      // マウスがグラフの描画エリア内にあるかチェック
      if (mouseX >= xAxis.left && mouseX <= xAxis.right && mouseY >= yAxis.top && mouseY <= yAxis.bottom) {
        // X軸のピクセル位置から距離を算出
        const distance = xAxis.getValueForPixel(mouseX);
        let interpolatedPoint = null;

        // 2点間の値を線形補間して、マウス位置に正確な標高や緯度経度を算出する
        if (pointsToUse && pointsToUse.length >= 2) {
          for (let j = 0; j < pointsToUse.length - 1; j++) {
            const p1 = pointsToUse[j];
            const p2 = pointsToUse[j + 1];
            
            // マージモードか否かで参照するプロパティを切り替え
            const p1Distance = isMergeMode ? p1.x : p1.distance;
            const p2Distance = isMergeMode ? p2.x : p2.distance;
            const p1Ele = isMergeMode ? p1.y : p1.ele;
            const p2Ele = isMergeMode ? p2.y : p2.ele;

            // マウスカーソルの距離が2点間にある場合
            if (p1Distance <= distance && p2Distance >= distance) {
              // 2点間の距離に対するマウス位置の割合を計算
              const t = (p2Distance - p1Distance) > 0 ? (distance - p1Distance) / (p2Distance - p1Distance) : 0;
              // 標高を線形補間
              const ele = p1Ele + t * (p2Ele - p1Ele);
              
              // 地図上のマーカー表示のため、元の緯度経度情報も線形補間する
              const originalP1 = isMergeMode ? p1.originalPoint : p1;
              const originalP2 = isMergeMode ? p2.originalPoint : p2;
              const lat = originalP1.lat + t * (originalP2.lat - originalP1.lat);
              const lng = originalP1.lng + t * (originalP2.lng - originalP1.lng);
              
              // 地図とグラフに渡すための補間されたポイント情報
              interpolatedPoint = {
                lat, lng, ele, distance,
                color: isMergeMode ? p1.color : (currentFocusedGpxData?.color || '#007bff'),
                originalGpxName: isMergeMode ? p1.label : currentFocusedGpxData?.name,
                originalTime: isMergeMode ? originalP1.time : originalP1.time,
              };
              break; // 対応する点が見つかったらループを抜ける
            }
          }
        }
        
        // パフォーマンスのため、補間されたポイントが変わらない場合は再描画しない
        const lastPoint = chart.crosshair?.lastInterpolatedPoint;
        if (JSON.stringify(lastPoint) === JSON.stringify(interpolatedPoint)) {
            chart.crosshair.x = mouseX;
            chart.draw();
            return;
        }

        // chartオブジェクトにカスタムプロパティとして十字線の情報を保存
        chart.crosshair = {
          x: mouseX,
          interpolatedPoint: interpolatedPoint,
          lastInterpolatedPoint: interpolatedPoint,
        };

        // 親コンポーネントにホバー情報を通知（地図上のマーカーを更新するため）
        if (onPointHover) {
          onPointHover(interpolatedPoint);
        }

        chart.draw(); // グラフを再描画して十字線を表示
      } else {
        clearCrosshair(); // マウスがエリア外なら十字線を消去
      }
    }
  },

  // グラフの描画が終わった後に呼び出されるフック
  afterDraw: (chart) => {
    // 十字線情報がなければ何もしない
    if (!chart.crosshair || !chart.crosshair.interpolatedPoint) return;

    const { ctx, scales } = chart;
    const { x: crosshairX, interpolatedPoint } = chart.crosshair;
    const { y: yAxis } = scales;

    ctx.save(); // 現在の描画状態を保存

    // 垂直な十字線を描画
    ctx.beginPath();
    ctx.moveTo(crosshairX, yAxis.top);
    ctx.lineTo(crosshairX, yAxis.bottom);
    ctx.lineWidth = 1;
    ctx.strokeStyle = '#888'; // 線の色
    ctx.stroke();

    // グラフ上のマーカー（円）を描画
    const yPosition = yAxis.getPixelForValue(interpolatedPoint.ele);
    ctx.beginPath();
    ctx.arc(crosshairX, yPosition, 5, 0, 2 * Math.PI, false); // 半径5pxの円
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'; // 内側の色
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = interpolatedPoint.color || '#007bff'; // 枠線の色
    ctx.stroke();

    ctx.restore(); // 描画状態を元に戻す
  }
};

// 作成したプラグインをChart.jsに登録
ChartJS.register(crosshairPlugin);

/**
 * GPXデータの標高グラフを表示するコンポーネント
 * @param {{onPointHover: function}} props - 親コンポーネントにホバー位置を通知するコールバック
 */
const ElevationGraph = ({ onPointHover }) => {
  const { visibleGpxTracks, focusedGpxData } = useGpxContext();
  // グラフの表示モード ('elevation': 標高, 'diff': 標高差, 'gain': 獲得標高)
  const [graphMode, setGraphMode] = useState('elevation');
  // 複数のGPXトラックを1つに結合して表示するモード
  const [isMergeMode, setIsMergeMode] = useState(false);
  // マージモード時の合計獲得標高
  const [totalMergedGain, setTotalMergedGain] = useState(0);

  // グラフモードを切り替える
  const toggleGraphMode = useCallback(() => {
    setGraphMode(currentMode => {
      if (currentMode === 'elevation') return 'diff';
      if (currentMode === 'diff') return 'gain';
      return 'elevation';
    });
  }, []);

  // マージモードのチェックボックスの状態を切り替える
  const handleMergeModeChange = useCallback((e) => {
    setIsMergeMode(e.target.checked);
  }, []);

  // X軸のスケールを決定するため、最も距離が長いトラックを見つける (通常モード時のみ)
  const longestTrack = useMemo(() => {
    if (!visibleGpxTracks || visibleGpxTracks.length === 0 || isMergeMode) return null;

    return visibleGpxTracks.reduce((longest, current) => {
      const longestDist = longest.points[longest.points.length - 1]?.distance || 0;
      const currentDist = current.points[current.points.length - 1]?.distance || 0;
      return currentDist > longestDist ? current : longest;
    });
  }, [visibleGpxTracks, isMergeMode]);

  // Chart.jsに渡すデータを作成する。表示モードやマージモードによって処理が大きく変わる
  const chartData = useMemo(() => {
    let processedGpxData = [...(visibleGpxTracks || [])];
    let calculatedTotalGain = 0;

    // --- マージモードの処理 ---
    if (isMergeMode) {
      // 開始時刻が古い順にソートして、時系列でトラックを連結する
      processedGpxData.sort((a, b) => new Date(a.time) - new Date(b.time));

      const mergedPoints = [];
      let currentXOffset = 0; // X軸（距離）のオフセット
      let currentYOffsetForDiff = 0; // Y軸（標高差）のオフセット
      let currentYOffsetForGain = 0; // Y軸（獲得標高）のオフセット

      processedGpxData.forEach((gpx, index) => {
        let segmentYData = [];
        let segmentGain = 0;

        // 現在のグラフモードに応じて、このセグメントのY軸データを計算
        switch (graphMode) {
          case 'diff': // 標高差モード
            const segmentStartEle = gpx.points[0]?.ele || 0;
            segmentYData = gpx.points.map(p => (p.ele - segmentStartEle));
            break;
          case 'gain': // 獲得標高モード
            let accumulatedGain = 0;
            segmentYData = gpx.points.map((p, i) => {
              if (i > 0 && p.ele > gpx.points[i - 1].ele) {
                accumulatedGain += p.ele - gpx.points[i - 1].ele;
              }
              return accumulatedGain;
            });
            segmentGain = accumulatedGain;
            break;
          default: // 'elevation' (通常標高モード)
            segmentYData = gpx.points.map(p => p.ele);
            break;
        }

        // セグメント内の各ポイントを、オフセットを使って調整し、結合ポイント配列に追加
        gpx.points.forEach((p, i) => {
          const adjustedX = p.distance + currentXOffset;
          let adjustedY = segmentYData[i];

          // 2番目以降のセグメントの場合、Y軸の値を前のセグメントの終点に接続する
          if (index > 0) {
            if (graphMode === 'diff') adjustedY += currentYOffsetForDiff;
            else if (graphMode === 'gain') adjustedY += currentYOffsetForGain;
          }

          mergedPoints.push({
            x: adjustedX,
            y: adjustedY,
            color: gpx.color,
            label: gpx.name,
            originalPoint: p // ツールチップや十字線のために元のポイント情報を保持
          });
        });

        // 次のセグメントのためにオフセットを更新
        currentXOffset = mergedPoints[mergedPoints.length - 1]?.x || 0;
        if (graphMode === 'diff') {
          currentYOffsetForDiff = mergedPoints[mergedPoints.length - 1]?.y || 0;
        } else if (graphMode === 'gain') {
          currentYOffsetForGain = mergedPoints[mergedPoints.length - 1]?.y || 0;
          calculatedTotalGain += segmentGain; // 合計獲得標高に加算
        }
      });

      setTotalMergedGain(calculatedTotalGain); // 計算した合計獲得標高をstateに保存

      const maxDistance = mergedPoints[mergedPoints.length - 1]?.x || 0;

      return {
        labels: Array.from({ length: Math.ceil(maxDistance / 0.5) + 1 }, (_, i) => (i * 0.5).toFixed(1)),
        datasets: [{
          label: '結合トラック',
          data: mergedPoints.map(p => ({ x: p.x, y: p.y })),
          borderColor: '#007bff',
          backgroundColor: 'rgba(0, 123, 255, 0.5)',
          tension: 0.1,
          pointRadius: 0,
        }],
        mergedPoints: mergedPoints, // 十字線プラグインで使うために渡す
      };

    // --- 通常モードの処理 ---
    } else {
      setTotalMergedGain(0); // マージモードでないので合計獲得標高をリセット
      const datasets = (visibleGpxTracks || []).map((gpx, index) => {
        let yData;
        // グラフモードに応じてY軸のデータを計算
        switch (graphMode) {
          case 'diff':
            const startEle = gpx.points[0]?.ele || 0;
            yData = gpx.points.map(p => p.ele - startEle);
            break;
          case 'gain':
            let accumulatedGain = 0;
            yData = gpx.points.map((p, i) => {
              if (i > 0 && p.ele > gpx.points[i - 1].ele) {
                accumulatedGain += p.ele - gpx.points[i - 1].ele;
              }
              return accumulatedGain;
            });
            break;
          default: // 'elevation'
            yData = gpx.points.map(p => p.ele);
            break;
        }

        return {
          label: gpx.name,
          data: gpx.points.map((p, i) => ({ x: p.distance, y: yData[i] })),
          borderColor: gpx.color || `hsl(${index * 137.5}, 70%, 50%)`,
          backgroundColor: gpx.color ? `${gpx.color.slice(0, -1)}, 0.5)` : `hsla(${index * 137.5}, 70%, 50%, 0.5)`,
          tension: 0.1,
          pointRadius: 0,
        };
      });

      return {
        labels: longestTrack?.points.map(p => p.distance.toFixed(2)) || [],
        datasets: datasets,
      };
    }
  }, [visibleGpxTracks, longestTrack, graphMode, isMergeMode]);

  // グラフモードボタンのラベルを取得
  const getButtonLabel = () => {
    if (graphMode === 'elevation') return '標高';
    if (graphMode === 'diff') return '標高差';
    return '獲得標高';
  };

  // Y軸のラベルを取得
  const getYAxisLabel = () => {
    switch (graphMode) {
      case 'diff': return '標高差 (m)';
      case 'gain': return '獲得標高 (m)';
      default: return '標高 (m)';
    }
  };

  // Chart.jsのオプション設定
  const options = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      crosshair: { // 十字線プラグインに渡すオプション
        focusedGpxData: focusedGpxData,
        onPointHover: onPointHover,
        isMergeMode: isMergeMode,
        mergedPoints: chartData.mergedPoints,
      },
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: '標高グラフ',
      },
      tooltip: { // ツールチップの表示内容をカスタマイズ
        enabled: true,
        callbacks: {
          title: () => null, // タイトルは非表示
          label: (context) => { // GPXファイル名を表示
            if (isMergeMode) {
              const point = chartData.mergedPoints[context.dataIndex];
              return point.label || '';
            } else {
              return context.dataset.label || '';
            }
          },
          afterLabel: (context) => { // 日時とY軸の値を表示
            let point;
            if (isMergeMode) {
              point = chartData.mergedPoints[context.dataIndex].originalPoint;
            } else {
              point = visibleGpxTracks[context.datasetIndex].points[context.dataIndex];
            }
            
            const time = point && point.time ? new Date(point.time).toLocaleString('ja-JP') : '';
            const value = Math.round(context.parsed.y);
            const yAxisLabel = getYAxisLabel().split(' ')[0];

            return [
              time,
              `${yAxisLabel}: ${value} m`
            ];
          }
        }
      }
    },
    scales: { // 軸の設定
      y: {
        title: {
          display: true,
          text: getYAxisLabel(),
        },
      },
      x: {
        type: 'linear',
        title: {
          display: true,
          text: '距離 (km)',
        },
        ticks: {
          stepSize: 0.5,
        }
      }
    }
  }), [focusedGpxData, onPointHover, graphMode, isMergeMode, chartData.mergedPoints, visibleGpxTracks]);

  return (
    <div className="elevation-graph">
      <div className="chart-container">
        {/* グラフモード切替ボタン */}
        <button onClick={toggleGraphMode} className="graph-mode-toggle-btn">
          {getButtonLabel()}
        </button>
        {/* マージモード時の合計獲得標高表示 */}
        {isMergeMode && graphMode === 'gain' && (
          <span className="total-gain-display">
            獲得標高: {formatNumber(Math.round(totalMergedGain))} m 総移動距離: {formatNumber((chartData.mergedPoints[chartData.mergedPoints.length - 1]?.x || 0).toFixed(2))} km
          </span>
        )}
        {/* マージモード切替チェックボックス */}
        <label className="merge-mode-checkbox">
          <input
            type="checkbox"
            checked={isMergeMode}
            onChange={handleMergeModeChange}
          />
          マージ
        </label>
        {/* グラフ本体 */}
        {(visibleGpxTracks && visibleGpxTracks.length > 0) ? (
          <Line options={options} data={chartData} />
        ) : (
          <p>グラフを表示するデータがありません。</p>
        )}
      </div>
    </div>
  );
};

export default ElevationGraph;