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

const formatNumber = (num) => new Intl.NumberFormat('ja-JP').format(num);

// (中略: crosshairPluginは変更なし)
const crosshairPlugin = {
  id: 'crosshair',

  afterEvent: (chart, args) => {
    const { event } = args;
    const { canvas, scales, options } = chart;
    const { x: xAxis, y: yAxis } = scales;
    const pluginOptions = options.plugins.crosshair || {};
    const { focusedGpxData, onPointHover, isMergeMode, mergedPoints } = pluginOptions;

    const clearCrosshair = () => {
      if (chart.crosshair) {
        chart.crosshair = undefined;
        if (onPointHover) onPointHover(null);
        chart.draw();
      }
    };

    let pointsToUse = [];
    let currentFocusedGpxData = null;

    if (isMergeMode && mergedPoints && mergedPoints.length > 0) {
      pointsToUse = mergedPoints;
      // In merge mode, focusedGpxData is not directly used for crosshair point finding
      // We need to find the original point from mergedPoints
    } else if (focusedGpxData) {
      pointsToUse = focusedGpxData.points;
      currentFocusedGpxData = focusedGpxData;
    }

    if (!pointsToUse || pointsToUse.length === 0) {
      clearCrosshair();
      return;
    }
    
    if (event.type === 'mouseout') {
      clearCrosshair();
      return;
    }

    if (event.type === 'mousemove') {
      const mouseX = event.x;
      const mouseY = event.y;

      if (mouseX >= xAxis.left && mouseX <= xAxis.right && mouseY >= yAxis.top && mouseY <= yAxis.bottom) {
        const distance = xAxis.getValueForPixel(mouseX);
        let interpolatedPoint = null;

        if (pointsToUse && pointsToUse.length >= 2) {
          for (let j = 0; j < pointsToUse.length - 1; j++) {
            const p1 = pointsToUse[j];
            const p2 = pointsToUse[j + 1];
            
            const p1Distance = isMergeMode ? p1.x : p1.distance;
            const p2Distance = isMergeMode ? p2.x : p2.distance;
            const p1Ele = isMergeMode ? p1.y : p1.ele;
            const p2Ele = isMergeMode ? p2.y : p2.ele;

            if (p1Distance <= distance && p2Distance >= distance) {
              const t = (p2Distance - p1Distance) > 0 ? (distance - p1Distance) / (p2Distance - p1Distance) : 0;
              const ele = p1Ele + t * (p2Ele - p1Ele);
              
              // For crosshair, we need original lat/lng for map. If merged, use originalPoint.
              const originalP1 = isMergeMode ? p1.originalPoint : p1;
              const originalP2 = isMergeMode ? p2.originalPoint : p2;

              const lat = originalP1.lat + t * (originalP2.lat - originalP1.lat);
              const lng = originalP1.lng + t * (originalP2.lng - originalP1.lng);
              
              interpolatedPoint = {
                lat, lng, ele, distance,
                color: isMergeMode ? p1.color : (currentFocusedGpxData?.color || '#007bff'),
                originalGpxName: isMergeMode ? p1.label : currentFocusedGpxData?.name,
                originalTime: isMergeMode ? originalP1.time : originalP1.time,
              };
              break;
            }
          }
        }
        
        const lastPoint = chart.crosshair?.lastInterpolatedPoint;
        if (JSON.stringify(lastPoint) === JSON.stringify(interpolatedPoint)) {
            chart.crosshair.x = mouseX;
            chart.draw();
            return;
        }

        chart.crosshair = {
          x: mouseX,
          interpolatedPoint: interpolatedPoint,
          lastInterpolatedPoint: interpolatedPoint,
        };

        if (onPointHover) {
          onPointHover(interpolatedPoint);
        }

        chart.draw();
      } else {
        clearCrosshair();
      }
    }
  },

  afterDraw: (chart) => {
    if (!chart.crosshair || !chart.crosshair.interpolatedPoint) return;

    const { ctx, scales } = chart;
    const { x: crosshairX, interpolatedPoint } = chart.crosshair;
    const { y: yAxis } = scales;

    ctx.save();

    ctx.beginPath();
    ctx.moveTo(crosshairX, yAxis.top);
    ctx.lineTo(crosshairX, yAxis.bottom);
    ctx.lineWidth = 1;
    ctx.strokeStyle = '#888';
    ctx.stroke();

    const yPosition = yAxis.getPixelForValue(interpolatedPoint.ele);
    ctx.beginPath();
    ctx.arc(crosshairX, yPosition, 5, 0, 2 * Math.PI, false);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = interpolatedPoint.color || '#007bff';
    ctx.stroke();

    ctx.restore();
  }
};

ChartJS.register(crosshairPlugin);


const ElevationGraph = ({ onPointHover }) => {
  const { visibleGpxTracks, focusedGpxData } = useGpxContext();
  const [graphMode, setGraphMode] = useState('elevation'); // 'elevation', 'diff', 'gain'
  const [isMergeMode, setIsMergeMode] = useState(false); // マージモードのstate
  const [totalMergedGain, setTotalMergedGain] = useState(0); // 合計獲得標高のstate

  const toggleGraphMode = useCallback(() => {
    setGraphMode(currentMode => {
      if (currentMode === 'elevation') return 'diff';
      if (currentMode === 'diff') return 'gain';
      return 'elevation';
    });
  }, []);

  const handleMergeModeChange = useCallback((e) => {
    setIsMergeMode(e.target.checked);
  }, []);

  const longestTrack = useMemo(() => {
    if (!visibleGpxTracks || visibleGpxTracks.length === 0) return null;
    // In merge mode, the longest track is the merged track itself
    if (isMergeMode) return null; // Handled by mergedPoints total distance

    return visibleGpxTracks.reduce((longest, current) => {
      const longestDist = longest.points[longest.points.length - 1]?.distance || 0;
      const currentDist = current.points[current.points.length - 1]?.distance || 0;
      return currentDist > longestDist ? current : longest;
    });
  }, [visibleGpxTracks, isMergeMode]);

  const chartData = useMemo(() => {
    let processedGpxData = [...(visibleGpxTracks || [])];
    let calculatedTotalGain = 0; // Initialize for current calculation

    if (isMergeMode) {
      // Sort by start time for merging
      processedGpxData.sort((a, b) => new Date(a.time) - new Date(b.time));

      const mergedPoints = [];
      let currentXOffset = 0;
      let currentYOffsetForDiff = 0; // For diff mode
      let currentYOffsetForGain = 0; // For gain mode

      processedGpxData.forEach((gpx, index) => {
        let segmentYData = [];
        let segmentGain = 0;

        // Calculate yData for the current segment based on graphMode
        switch (graphMode) {
          case 'diff':
            const segmentStartEle = gpx.points[0]?.ele || 0;
            segmentYData = gpx.points.map(p => (p.ele - segmentStartEle));
            break;
          case 'gain':
            let accumulatedGain = 0;
            segmentYData = gpx.points.map((p, i) => {
              if (i > 0 && p.ele > gpx.points[i - 1].ele) {
                accumulatedGain += p.ele - gpx.points[i - 1].ele;
              }
              return accumulatedGain;
            });
            segmentGain = accumulatedGain; // Total gain for this segment
            break;
          default: // 'elevation'
            segmentYData = gpx.points.map(p => p.ele);
            break;
        }

        gpx.points.forEach((p, i) => {
          const adjustedX = p.distance + currentXOffset;
          let adjustedY = segmentYData[i];

          if (index > 0) {
            if (graphMode === 'diff') {
              adjustedY += currentYOffsetForDiff;
            } else if (graphMode === 'gain') {
              adjustedY += currentYOffsetForGain;
            }
          }

          mergedPoints.push({
            x: adjustedX,
            y: adjustedY,
            color: gpx.color,
            label: gpx.name,
            originalPoint: p // Keep original point for tooltip and crosshair
          });
        });

        // Update offsets for the next segment
        currentXOffset = mergedPoints[mergedPoints.length - 1]?.x || 0;
        if (graphMode === 'diff') {
          currentYOffsetForDiff = mergedPoints[mergedPoints.length - 1]?.y || 0;
        } else if (graphMode === 'gain') {
          currentYOffsetForGain = mergedPoints[mergedPoints.length - 1]?.y || 0;
          calculatedTotalGain += segmentGain; // Accumulate total gain across segments
        }
      });

      // Update the state for total merged gain
      setTotalMergedGain(calculatedTotalGain);

      const maxDistance = mergedPoints[mergedPoints.length - 1]?.x || 0;

      return {
        labels: Array.from({ length: Math.ceil(maxDistance / 0.5) + 1 }, (_, i) => (i * 0.5).toFixed(1)),
        datasets: [{
          label: '結合トラック',
          data: mergedPoints.map(p => ({ x: p.x, y: p.y })),
          borderColor: '#007bff', // Default color for merged track
          backgroundColor: 'rgba(0, 123, 255, 0.5)',
          tension: 0.1,
          pointRadius: 0,
        }],
        mergedPoints: mergedPoints, // Pass merged points for crosshair/tooltip
      };

    } else { // Not merge mode (existing logic)
      setTotalMergedGain(0); // Reset total merged gain when not in merge mode
      const datasets = (visibleGpxTracks || []).map((gpx, index) => {
        let yData;
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

  const getButtonLabel = () => {
    if (graphMode === 'elevation') return '標高';
    if (graphMode === 'diff') return '標高差';
    return '獲得標高';
  };

  const getYAxisLabel = () => {
    switch (graphMode) {
      case 'diff': return '標高差 (m)';
      case 'gain': return '獲得標高 (m)';
      default: return '標高 (m)';
    }
  };

  const options = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      crosshair: {
        focusedGpxData: focusedGpxData,
        onPointHover: onPointHover,
        isMergeMode: isMergeMode,
        mergedPoints: chartData.mergedPoints, // Pass merged points to crosshair plugin
      },
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: '標高グラフ',
      },
      tooltip: {
        enabled: true,
        callbacks: {
          title: function(context) {
            return null; // No title
          },
          label: function(context) {
            if (isMergeMode) {
              const point = chartData.mergedPoints[context.dataIndex];
              return point.label || ''; // Original file name
            } else {
              return context.dataset.label || ''; // File name with color box
            }
          },
          afterLabel: function(context) {
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
    scales: {
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
        <button onClick={toggleGraphMode} className="graph-mode-toggle-btn">
          {getButtonLabel()}
        </button>
        {isMergeMode && graphMode === 'gain' && (
          <span className="total-gain-display">
            獲得標高: {formatNumber(Math.round(totalMergedGain))} m 総移動距離: {formatNumber((chartData.mergedPoints[chartData.mergedPoints.length - 1]?.x || 0).toFixed(2))} km
          </span>
        )}
        <label className="merge-mode-checkbox">
          <input
            type="checkbox"
            checked={isMergeMode}
            onChange={handleMergeModeChange}
          />
          マージ
        </label>
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
