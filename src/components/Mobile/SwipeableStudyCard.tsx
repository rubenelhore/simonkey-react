// src/components/Mobile/SwipeableStudyCard.jsx
import React, { useState, useEffect } from 'react';
import useSwipe from '../../hooks/useSwipe';
import './SwipeableStudyCard.css';
import TextToSpeech from '../TextToSpeech';

const SwipeableStudyCard = ({ concept, onComplete, onLater, isLast }) => {
  const [flipped, setFlipped] = useState(false);
  const [confidence, setConfidence] = useState(null);
  const [exitDirection, setExitDirection] = useState(null);
  const [isExiting, setIsExiting] = useState(false);
  const [touchStartY, setTouchStartY] = useState(null);
  const [dragOffsetY, setDragOffsetY] = useState(0);
  
  // Configurar hook de swipe
  const { swipeHandlers, swipeDirection, swiping, resetSwipe } = useSwipe({
    threshold: 100,
    timeout: 500
  });
  
  // Manejar swipe
  useEffect(() => {
    if (swipeDirection) {
      handleSwipe(swipeDirection);
      resetSwipe();
    }
  }, [swipeDirection, resetSwipe]);
  
  // Manejar dirección de swipe
  const handleSwipe = (direction) => {
    if (direction === 'left' || direction === 'right') {
      setExitDirection(direction);
      setIsExiting(true);
      
      // Determinar confianza basada en dirección
      const newConfidence = direction === 'right' ? 'high' : 'low';
      setConfidence(newConfidence);
      
      // Esperar a que termine la animación para notificar al padre
      setTimeout(() => {
        if (direction === 'right') {
          onComplete(concept.id, newConfidence);
        } else {
          onLater(concept.id);
        }
      }, 300);
    }
  };
  
  // Manejar tap para voltear la tarjeta
  const handleCardTap = (e) => {
    // Solo considerar taps, no swipes
    if (!swiping) {
      setFlipped(!flipped);
    }
  };
  
  // Manejar drag vertical para voltear tarjeta
  const handleTouchStart = (e) => {
    setTouchStartY(e.touches[0].clientY);
  };
  
  const handleTouchMove = (e) => {
    if (touchStartY === null) return;
    
    const currentY = e.touches[0].clientY;
    const deltaY = currentY - touchStartY;
    
    // Limitar el arrastre vertical
    const maxDrag = 100;
    const drag = Math.max(-maxDrag, Math.min(maxDrag, deltaY));
    
    setDragOffsetY(drag);
  };
  
  const handleTouchEnd = () => {
    // Si el arrastre es significativo, voltear la tarjeta
    if (Math.abs(dragOffsetY) > 50) {
      setFlipped(!flipped);
    }
    
    setTouchStartY(null);
    setDragOffsetY(0);
  };
  
  // Combinar handlers de swipe y drag
  const handlers = {
    ...swipeHandlers,
    onTouchStart: (e) => {
      swipeHandlers.onTouchStart(e);
      handleTouchStart(e);
    },
    onTouchMove: (e) => {
      swipeHandlers.onTouchMove(e);
      handleTouchMove(e);
    },
    onTouchEnd: (e) => {
      swipeHandlers.onTouchEnd(e);
      handleTouchEnd(e);
    },
    onClick: handleCardTap
  };
  
  // Calcular estilos dinámicos
  const getCardStyle = () => {
    let style = {
      transform: `perspective(1000px) rotateX(${dragOffsetY * 0.2}deg)`
    };
    
    if (isExiting) {
      style.transform = `translateX(${exitDirection === 'right' ? 1000 : -1000}px) rotate(${exitDirection === 'right' ? 30 : -30}deg)`;
      style.transition = 'transform 0.3s ease-out';
      style.opacity = 0;
    }
    
    return style;
  };
  
  return (
    <div
      className={`swipeable-card ${flipped ? 'flipped' : ''} ${isLast ? 'last-card' : ''}`}
      style={getCardStyle()}
      {...handlers}
    >
      <div className="card-inner">
        <div className="card-front">
          <div className="term">{concept.término}</div>
          <div className="hint">
            <span>Toca para ver definición</span>
            <div className="hint-icon">
              <i className="fas fa-hand-point-up"></i>
            </div>
          </div>
          
          <div className="swipe-hints">
            <div className="swipe-hint left">
              <i className="fas fa-arrow-left"></i>
              <span>Revisar después</span>
            </div>
            <div className="swipe-hint right">
              <span>Dominado</span>
              <i className="fas fa-arrow-right"></i>
            </div>
          </div>
        </div>
        
        <div className="card-back">
          <div className="definition">
            <h3>Definición:</h3>
            <p>{concept.definición}</p>
            
            <div className="text-to-speech-container">
              <TextToSpeech text={concept.definición} iconOnly={true} />
            </div>
          </div>
          
          <div className="source">
            <span>Fuente: {concept.fuente}</span>
          </div>
          
          <div className="confidence-buttons">
            <button className="low-confidence" onClick={() => handleSwipe('left')}>
              <i className="fas fa-redo"></i> Repasar
            </button>
            <button className="high-confidence" onClick={() => handleSwipe('right')}>
              <i className="fas fa-check"></i> Dominado
            </button>
          </div>
          
          <div className="tap-hint">
            <span>Toca para volver</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SwipeableStudyCard;