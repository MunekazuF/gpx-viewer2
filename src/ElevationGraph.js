import React, { useMemo } from 'react';
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

// (中略: crosshairPluginは変更なし)
const crosshairPlugin = {
  id: 'crosshair',

  afterEvent: (chart, args) => {
    const { event } = args;
    const { canvas, scales, options } = chart;
    const { x: xAxis, y: yAxis } = scales;
    const pluginOptions = options.plugins.crosshair || {};
    const { focusedGpxData, onPointHover } = pluginOptions;

    const clearCrosshair = () => {
      if (chart.crosshair) {
        chart.crosshair = undefined;
        if (onPointHover) onPointHover(null);
        chart.draw();
      }
    };

    if (!focusedGpxData) {
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
        const points = focusedGpxData.points;
        let interpolatedPoint = null;

        if (points && points.length >= 2) {
          for (let j = 0; j < points.length - 1; j++) {
            const p1 = points[j];
            const p2 = points[j + 1];
            if (p1.distance <= distance && p2.distance >= distance) {
              const t = (p2.distance - p1.distance) > 0 ? (distance - p1.distance) / (p2.distance - p1.distance) : 0;
              const ele = p1.ele + t * (p2.ele - p1.ele);
              const lat = p1.lat + t * (p2.lat - p1.lat);
              const lng = p1.lng + t * (p2.lng - p1.lng);
              interpolatedPoint = { lat, lng, ele, distance, color: focusedGpxData.color };
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


const ElevationGraph = ({ gpxData, onPointHover, focusedGpxData }) => {
  const longestTrack = useMemo(() => {
    if (!gpxData || gpxData.length === 0) return null;
    return gpxData.reduce((longest, current) => {
      const longestDist = longest.points[longest.points.length - 1]?.distance || 0;
      const currentDist = current.points[current.points.length - 1]?.distance || 0;
      return currentDist > longestDist ? current : longest;
    });
  }, [gpxData]);

  const data = {
    labels: longestTrack?.points.map(p => p.distance.toFixed(2)) || [],
    datasets: (gpxData || []).map((gpx, index) => ({
      label: gpx.name,
      data: gpx.points.map(p => ({ x: p.distance, y: p.ele })),
      borderColor: gpx.color || `hsl(${index * 137.5}, 70%, 50%)`,
      backgroundColor: gpx.color ? `${gpx.color.slice(0, -1)}, 0.5)` : `hsla(${index * 137.5}, 70%, 50%, 0.5)`,
      tension: 0.1,
      pointRadius: 0,
    })),
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      crosshair: {
        focusedGpxData: focusedGpxData,
        onPointHover: onPointHover,
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
      }
    },
    scales: {
      y: {
        title: {
          display: true,
          text: '標高 (m)',
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
  };

  return (
    <div className="elevation-graph">
      {(gpxData && gpxData.length > 0) ? (
        <Line options={options} data={data} />
      ) : (
        <p>グラフを表示するデータがありません。</p>
      )}
    </div>
  );
};

export default ElevationGraph;