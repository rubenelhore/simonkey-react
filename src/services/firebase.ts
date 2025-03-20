// src/services/firebase.ts

import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, setPersistence, browserLocalPersistence } from "firebase/auth";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyC26QZw7297E_YOoF5OqR2Ck6x_bw5_Hic",
  authDomain: "simonkey-5c78f.firebaseapp.com",
  projectId: "simonkey-5c78f",
  storageBucket: "simonkey-5c78f.firebasestorage.app",
  messagingSenderId: "235501879490",
  appId: "1:235501879490:web:05fea6dae9c63b2a827b5b"
};

// Inicializar Firebase solo si no existe una instancia previa
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Inicializar servicios - Corregido para evitar duplicación
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Configurar persistencia para autenticación (mantener sesión activa)
setPersistence(auth, browserLocalPersistence)
  .catch((error) => {
    console.error("Error configurando persistencia de autenticación:", error);
  });

// Habilitar persistencia offline para Firestore (opcional)
// Solo habilitar en entorno del cliente (browser) y con manejo de errores adecuado
if (typeof window !== 'undefined') {
  try {
    enableIndexedDbPersistence(db)
      .catch((error) => {
        if (error.code === 'failed-precondition') {
          // Múltiples pestañas abiertas, la persistencia solo puede habilitarse en una pestaña a la vez
          console.log('La persistencia no se pudo habilitar porque hay múltiples pestañas abiertas');
        } else if (error.code === 'unimplemented') {
          // El navegador actual no soporta las características requeridas
          console.log('Tu navegador no soporta la persistencia offline');
        } else {
          console.error("Error habilitando persistencia Firestore:", error);
        }
      });
  } catch (err) {
    console.error("Error al configurar persistencia:", err);
  }
}

// Exportar todo lo que necesitamos
export { 
  app, 
  auth, 
  db, // Exportamos db como firestore principal
  storage
};

// Exportación explícita de Firestore (para mayor claridad)
export const firestore = db;

// Exportar tipos y funciones de Firestore comúnmente usados
export {
  collection,
  doc,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';


// Funciones de utilidad para trabajar con Firebase
export const firebaseUtils = {
  // Convertir timestamps de Firestore a Date
  timestampToDate: (timestamp: any) => {
    if (!timestamp) return null;
    return timestamp.toDate ? timestamp.toDate() : timestamp;
  },
  
  // Eliminar campos undefined antes de enviar a Firestore
  cleanUndefinedFields: (obj: Record<string, any>) => {
    const cleanedObj = { ...obj };
    Object.keys(cleanedObj).forEach(key => {
      if (cleanedObj[key] === undefined) {
        delete cleanedObj[key];
      }
    });
    return cleanedObj;
  }
};