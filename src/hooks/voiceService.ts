import { db, auth } from '../services/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

// Interfaz para las configuraciones de voz
export interface VoiceSettings {
  voiceName: string;
  rate: number;
  pitch: number;
  volume: number;
  autoRead: boolean;
}

// Configuraciones por defecto
export const defaultVoiceSettings: VoiceSettings = {
  voiceName: '',  // Se asignará dinámicamente la primera voz española disponible
  rate: 1.0,
  pitch: 1.0,
  volume: 1.0,
  autoRead: false
};

/**
 * Carga las configuraciones de voz del usuario actual
 */
export const loadVoiceSettings = async (): Promise<VoiceSettings> => {
  // Verificar que haya un usuario autenticado
  if (!auth.currentUser) {
    return { ...defaultVoiceSettings };
  }
  
  try {
    const userSettingsRef = doc(db, 'users', auth.currentUser.uid, 'settings', 'voice');
    const settingsDoc = await getDoc(userSettingsRef);
    
    if (settingsDoc.exists()) {
      const data = settingsDoc.data();
      
      // Combinar con valores por defecto para asegurar que todos los campos existan
      return {
        ...defaultVoiceSettings,
        voiceName: data.voiceName || defaultVoiceSettings.voiceName,
        rate: data.rate || defaultVoiceSettings.rate,
        pitch: data.pitch || defaultVoiceSettings.pitch,
        volume: data.volume || defaultVoiceSettings.volume,
        autoRead: data.autoRead !== undefined ? data.autoRead : defaultVoiceSettings.autoRead
      };
    }
    
    return { ...defaultVoiceSettings };
  } catch (error) {
    console.error("Error loading voice settings:", error);
    return { ...defaultVoiceSettings };
  }
};

/**
 * Guarda las configuraciones de voz del usuario actual
 */
export const saveVoiceSettings = async (settings: VoiceSettings): Promise<boolean> => {
  // Verificar que haya un usuario autenticado
  if (!auth.currentUser) {
    console.error("No user authenticated");
    return false;
  }
  
  try {
    const userSettingsRef = doc(db, 'users', auth.currentUser.uid, 'settings', 'voice');
    
    await setDoc(userSettingsRef, {
      ...settings,
      updatedAt: new Date()
    });
    
    return true;
  } catch (error) {
    console.error("Error saving voice settings:", error);
    return false;
  }
};

/**
 * Obtiene la mejor voz disponible según el idioma preferido
 */
export const getBestVoice = (preferredLanguage = 'es'): SpeechSynthesisVoice | null => {
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    return null;
  }
  
  const voices = window.speechSynthesis.getVoices();
  
  // Buscar voces que coincidan con el idioma preferido
  const matchingVoices = voices.filter(voice => 
    voice.lang.toLowerCase().startsWith(preferredLanguage.toLowerCase())
  );
  
  // Si hay voces que coinciden, priorizar la voz por defecto del sistema
  const defaultVoice = matchingVoices.find(voice => voice.default);
  if (defaultVoice) return defaultVoice;
  
  // Si no hay voz por defecto, usar la primera voz que coincide
  if (matchingVoices.length > 0) return matchingVoices[0];
  
  // Si no hay voces que coincidan, usar cualquier voz por defecto
  const anyDefaultVoice = voices.find(voice => voice.default);
  if (anyDefaultVoice) return anyDefaultVoice;
  
  // En último caso, usar la primera voz disponible
  return voices.length > 0 ? voices[0] : null;
};

/**
 * Crea y configura un objeto SpeechSynthesisUtterance
 */
export const createUtterance = (
  text: string, 
  settings?: Partial<VoiceSettings>
): SpeechSynthesisUtterance => {
  const utterance = new SpeechSynthesisUtterance(text);
  
  // Configurar con los ajustes proporcionados o valores por defecto
  utterance.rate = settings?.rate || defaultVoiceSettings.rate;
  utterance.pitch = settings?.pitch || defaultVoiceSettings.pitch;
  utterance.volume = settings?.volume || defaultVoiceSettings.volume;
  
  // Intentar asignar la voz seleccionada
  if (settings?.voiceName && typeof window !== 'undefined' && window.speechSynthesis) {
    const voices = window.speechSynthesis.getVoices();
    const voice = voices.find(v => v.name === settings.voiceName);
    if (voice) {
      utterance.voice = voice;
    }
  }
  
  return utterance;
};

/**
 * Lee un texto en voz alta usando la configuración del usuario
 */
export const speak = async (text: string, options?: { immediate?: boolean }): Promise<void> => {
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    console.error("SpeechSynthesis not supported");
    return;
  }
  
  try {
    // Cargar configuraciones del usuario
    const settings = await loadVoiceSettings();
    
    // Si se especificó que debe ser inmediato, cancelar cualquier síntesis en curso
    if (options?.immediate) {
      window.speechSynthesis.cancel();
    }
    
    // Crear y configurar el utterance
    const utterance = createUtterance(text, settings);
    
    // Comenzar a hablar
    window.speechSynthesis.speak(utterance);
    
    return new Promise((resolve) => {
      utterance.onend = () => resolve();
    });
  } catch (error) {
    console.error("Error in text-to-speech:", error);
  }
};

/**
 * Detiene la síntesis de voz en curso
 */
export const stopSpeaking = (): void => {
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
};

/**
 * Pausa la síntesis de voz en curso
 */
export const pauseSpeaking = (): void => {
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.pause();
  }
};

/**
 * Reanuda la síntesis de voz pausada
 */
export const resumeSpeaking = (): void => {
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.resume();
  }
};

// Exportar todas las funciones y tipos
export default {
  loadVoiceSettings,
  saveVoiceSettings,
  getBestVoice,
  createUtterance,
  speak,
  stopSpeaking,
  pauseSpeaking,
  resumeSpeaking,
  defaultVoiceSettings
};