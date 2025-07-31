import React from 'react';
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

const ElevationGraph = ({ gpxData }) => {
  const data = {
    labels: gpxData?.[0]?.points.map(p => p.distance.toFixed(2)) || [],
    datasets: (gpxData || []).map((gpx, index) => ({
      label: gpx.name,
      data: gpx.points.map(p => p.ele),
      borderColor: `hsl(${index * 137.5}, 70%, 50%)`, // ToDo: 仕様書通りの色にする
      backgroundColor: `hsla(${index * 137.5}, 70%, 50%, 0.5)`,
      tension: 0.1,
      pointRadius: 0,
    })),
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: '標高グラフ',
      },
    },
    scales: {
      y: {
        title: {
          display: true,
          text: '標高 (m)',
        },
      },
      x: {
        type: 'linear', // 横軸を線形スケールとして明示
        title: {
          display: true,
          text: '距離 (km)',
        },
        ticks: {
          stepSize: 0.5, // 0.5kmごとにメモリを振る
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
