import React, { useState, useEffect } from 'react';

interface TextToSpeechProps {
  text: string;
  language?: string;
  buttonClassName?: string;
  iconOnly?: boolean;
}

const TextToSpeech: React.FC<TextToSpeechProps> = ({
  text,
  language = 'es-MX',
  buttonClassName = '',
  iconOnly = false
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [speechSynthesis, setSpeechSynthesis] = useState<SpeechSynthesis | null>(null);
  const [utterance, setUtterance] = useState<SpeechSynthesisUtterance | null>(null);
  const [, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);

  // Inicializar speechSynthesis al montar el componente
  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      setSpeechSynthesis(window.speechSynthesis);
      
      // Crear y configurar el objeto utterance
      const speechUtterance = new SpeechSynthesisUtterance(text);
      speechUtterance.lang = language;
      speechUtterance.rate = 1.0; // Velocidad normal
      speechUtterance.pitch = 1.0; // Tono normal
      speechUtterance.volume = 1.0; // Volumen máximo
      
      setUtterance(speechUtterance);
      
      // Añadir eventos para tracking del estado
      speechUtterance.onend = () => {
        setIsPlaying(false);
        setIsPaused(false);
      };
      
      speechUtterance.onpause = () => {
        setIsPaused(true);
      };
      
      speechUtterance.onresume = () => {
        setIsPaused(false);
      };
      
      // Limpiar cuando el componente se desmonte
      return () => {
        if (window.speechSynthesis) {
          window.speechSynthesis.cancel();
        }
      };
    }
  }, [text, language]);

  // Obtener voces disponibles
  useEffect(() => {
    if (!speechSynthesis) return;
    
    const loadVoices = () => {
      const voices = speechSynthesis.getVoices();
      setAvailableVoices(voices);
      
      // Seleccionar voz en español si está disponible
      if (utterance && voices.length > 0) {
        const spanishVoice = voices.find(voice => voice.lang.includes('es'));
        if (spanishVoice) {
          utterance.voice = spanishVoice;
        }
      }
    };
    
    // Compatibilidad con diferentes navegadores
    if (speechSynthesis.onvoiceschanged !== undefined) {
      speechSynthesis.onvoiceschanged = loadVoices;
    }
    
    loadVoices();
  }, [speechSynthesis, utterance]);

  // Actualizar el utterance si cambia el texto
  useEffect(() => {
    if (speechSynthesis && utterance) {
      utterance.text = text;
    }
  }, [text, speechSynthesis, utterance]);

  const toggleSpeech = () => {
    if (!speechSynthesis || !utterance) return;
    
    if (isPlaying) {
      if (isPaused) {
        speechSynthesis.resume();
        setIsPaused(false);
      } else {
        speechSynthesis.pause();
        setIsPaused(true);
      }
    } else {
      // Cancelar cualquier síntesis de voz anterior
      speechSynthesis.cancel();
      
      // Comenzar a hablar
      speechSynthesis.speak(utterance);
      setIsPlaying(true);
      setIsPaused(false);
    }
  };

  const stopSpeech = () => {
    if (!speechSynthesis) return;
    
    speechSynthesis.cancel();
    setIsPlaying(false);
    setIsPaused(false);
  };

  // Determinar el ícono a mostrar según el estado
  const renderIcon = () => {
    if (isPlaying && !isPaused) {
      return <i className="fas fa-pause"></i>;
    }
    if (isPlaying && isPaused) {
      return <i className="fas fa-play"></i>;
    }
    return <i className="fas fa-volume-up"></i>;
  };

  return (
    <div className="text-to-speech-controls">
      <button
        onClick={toggleSpeech}
        className={`text-to-speech-button ${buttonClassName} ${isPlaying ? 'playing' : ''}`}
        title={isPlaying ? (isPaused ? 'Continuar' : 'Pausar') : 'Leer en voz alta'}
      >
        {renderIcon()}
        {!iconOnly && (
          <span className="button-text">
            {isPlaying ? (isPaused ? 'Continuar' : 'Pausar') : 'Leer'}
          </span>
        )}
      </button>
      
      {isPlaying && (
        <button
          onClick={stopSpeech}
          className="text-to-speech-stop"
          title="Detener"
        >
          <i className="fas fa-stop"></i>
        </button>
      )}
    </div>
  );
};

export default TextToSpeech;