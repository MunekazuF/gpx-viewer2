import { useState, useRef } from 'react';

const useMap = () => {
  const [mapBounds, setMapBounds] = useState(null);
  const lastBoundsRef = useRef(null);

  const handleBoundsChange = (newBounds) => {
    const lastBounds = lastBoundsRef.current;
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
