import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { useGpxContext } from '../contexts/GpxContext';

const MapController = () => {
  const map = useMap();
  const { visibleGpxTracks, focusedGpxData } = useGpxContext();

  useEffect(() => {
    if (focusedGpxData) {
      if (focusedGpxData.points && focusedGpxData.points.length > 0) {
        const points = focusedGpxData.points.map(p => [p.lat, p.lng]);
        const bounds = L.latLngBounds(points);
        map.invalidateSize();
        map.fitBounds(bounds, { padding: [50, 50] });
      }
      return;
    }

    if (visibleGpxTracks && visibleGpxTracks.length === 1) {
      const singleTrack = visibleGpxTracks[0];
      if (singleTrack.points && singleTrack.points.length > 0) {
        const points = singleTrack.points.map(p => [p.lat, p.lng]);
        const bounds = L.latLngBounds(points);
        map.invalidateSize();
        map.fitBounds(bounds, { padding: [50, 50] });
      }
    }
  }, [visibleGpxTracks, focusedGpxData, map]);

  return null;
};

export default MapController;
