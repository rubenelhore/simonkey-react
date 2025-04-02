import { Timestamp } from 'firebase/firestore';

/**
 * Representa un concepto de estudio
 */
export interface Concept {
  id: string;
  término: string;
  definición: string;
  fuente: string;
  usuarioId?: string;
  docId?: string;
  index?: number;
  notasPersonales?: string;
  reviewId?: string;
  dominado?: boolean;
  // Otros campos que puedas necesitar
}

/**
 * Calidad de respuesta para algoritmo de repetición espaciada
 */
export enum ResponseQuality {
    CompletelyForgotten = 0,
    AlmostForgotten = 1,
    Difficult = 2,
    NotSmooth = 3,
    Good = 4,
    Perfect = 5
  }

/**
 * Modos de estudio disponibles
 */
export enum StudyMode {
  STUDY = 'study',
  REVIEW = 'review',
  QUIZ = 'quiz'
}

/**
 * Representa un cuaderno de estudio
 */
export interface Notebook {
  id: string;
  title: string;
  color: string;
  userId?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  conceptCount?: number;
}

/**
 * Actividad en el dashboard
 */
export interface Activity {
  id: string;
  type: string;
  title: string;
  timestamp: Timestamp;
  userId?: string;
  notebookId?: string;
  notebookTitle?: string;
  conceptId?: string;
  conceptTitle?: string;
}

/**
 * Estadísticas para el dashboard
 */
export interface Stats {
  totalConcepts: number;
  totalNotebooks: number;
  studyTimeMinutes: number;
  masteredConcepts: number;
}

/**
 * Métricas de sesiones de estudio
 */
export interface StudySessionMetrics {
  totalConcepts: number;
  conceptsReviewed: number;
  mastered: number;
  reviewing: number;
  timeSpent: number;
  startTime: Date;
  endTime?: Date;
}