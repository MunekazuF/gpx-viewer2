import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet-touch-helper';

const TouchHelperInitializer = () => {
  const map = useMap();
  useEffect(() => {
    if (L.TouchHelper) {
      L.TouchHelper.addTo(map);
    }
  }, [map]);
  return null;
};

export default TouchHelperInitializer;
