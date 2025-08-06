import { useMapEvents } from 'react-leaflet';

const MapEvents = ({ onBoundsChange, onBaseLayerChange }) => {
  const map = useMapEvents({
    moveend: () => onBoundsChange(map.getBounds()),
    zoomend: () => onBoundsChange(map.getBounds()),
    baselayerchange: (e) => onBaseLayerChange(e),
  });
  return null;
};

export default MapEvents;
