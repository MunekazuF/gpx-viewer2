import React from 'react';
import ReactDOM from 'react-dom/client';
import 'leaflet/dist/leaflet.css'; // LeafletのCSSをインポート
import App from './App';
import { GpxProvider } from './contexts/GpxContext';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <GpxProvider>
      <App />
    </GpxProvider>
  </React.StrictMode>
);
