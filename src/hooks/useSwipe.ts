// src/hooks/useSwipe.js
import { useState, useEffect } from 'react';

/**
 * Custom hook para detectar gestos de swipe en dispositivos táctiles
 * @param {object} options - Opciones de configuración
 * @param {number} options.threshold - Distancia mínima para considerar un swipe válido (en px)
 * @param {number} options.timeout - Tiempo máximo para realizar el swipe (en ms)
 * @returns {object} - Objeto con funciones de detección y estados de swipe
 */
const useSwipe = (options = {}) => {
  const { threshold = 50, timeout = 300 } = options;
  
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const [touchStartTime, setTouchStartTime] = useState(null);
  const [swipeDirection, setSwipeDirection] = useState(null);
  const [swiping, setSwiping] = useState(false);

  // Resetea el estado de swipe
  const resetSwipe = () => {
    setTouchStart(null);
    setTouchEnd(null);
    setTouchStartTime(null);
    setSwipeDirection(null);
    setSwiping(false);
  };

  // Detecta la dirección del swipe
  useEffect(() => {
    if (!touchStart || !touchEnd) return;
    
    const timeElapsed = Date.now() - touchStartTime;
    
    // Si se excedió el tiempo, ignorar el swipe
    if (timeElapsed > timeout) {
      resetSwipe();
      return;
    }
    
    // Calcular distancias
    const distanceX = touchEnd.x - touchStart.x;
    const distanceY = touchEnd.y - touchStart.y;
    const isHorizontal = Math.abs(distanceX) > Math.abs(distanceY);
    
    // Determinar dirección
    let direction = null;
    
    if (isHorizontal && Math.abs(distanceX) > threshold) {
      direction = distanceX > 0 ? 'right' : 'left';
    } else if (!isHorizontal && Math.abs(distanceY) > threshold) {
      direction = distanceY > 0 ? 'down' : 'up';
    }
    
    setSwipeDirection(direction);
    setSwiping(false);
  }, [touchStart, touchEnd, touchStartTime, threshold, timeout]);

  // Handlers para eventos táctiles
  const onTouchStart = (e) => {
    const touch = e.touches[0];
    setTouchStart({ x: touch.clientX, y: touch.clientY });
    setTouchStartTime(Date.now());
    setSwiping(true);
  };

  const onTouchMove = (e) => {
    if (!touchStart) return;
    const touch = e.touches[0];
    setTouchEnd({ x: touch.clientX, y: touch.clientY });
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) {
      resetSwipe();
      return;
    }
    
    // El efecto se encargará de determinar la dirección
  };

  // Props para agregar al elemento que recibirá los gestos
  const swipeHandlers = {
    onTouchStart,
    onTouchMove,
    onTouchEnd
  };

  return {
    swipeHandlers,
    swipeDirection,
    swiping,
    resetSwipe
  };
};

export default useSwipe;