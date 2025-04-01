// src/pages/StudyModePage.tsx
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, addDoc, doc, getDoc, deleteDoc } from 'firebase/firestore';
import { db, auth } from '../services/firebase';
import SwipeableStudyCard from '../components/Mobile/SwipeableStudyCard';
import '../styles/StudyModePage.css';

// Define interfaces para los tipos
interface Notebook {
  id: string;
  title: string;
  color: string;
}

interface Concept {
  término: string;
  definición: string;
  fuente: string;
  docId: string;
  index: number;
  id: string;
  reviewId?: string;
}

const StudyModePage = () => {
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [selectedNotebook, setSelectedNotebook] = useState<Notebook | null>(null);
  const [allConcepts, setAllConcepts] = useState<Concept[]>([]);
  const [loading, setLoading] = useState(true);
  const [studyStarted, setStudyStarted] = useState(false);
  const [isSessionComplete, setIsSessionComplete] = useState(false);
  const [currentConcepts, setCurrentConcepts] = useState<Concept[]>([]);
  const [conceptsRemaining, setConceptsRemaining] = useState<number>(0);
  const [conceptsCompleted, setConceptsCompleted] = useState<number>(0);
  const [showReviewMode, setShowReviewMode] = useState<boolean>(false);
  const [pendingReview, setPendingReview] = useState<number>(0);
  const navigate = useNavigate();

  // Estados para el sistema de retroalimentación
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [feedbackType, setFeedbackType] = useState<'success' | 'info' | 'warning' | null>(null);
  const [showFeedback, setShowFeedback] = useState<boolean>(false);

  // Nueva variable para almacenar la sesión actual
  const [sessionStats, setSessionStats] = useState({
    mastered: 0,
    toReview: 0,
    total: 0
  });

  // Función para mostrar retroalimentación
  const displayFeedback = (type: 'success' | 'info' | 'warning', message: string) => {
    setFeedbackType(type);
    setFeedbackMessage(message);
    setShowFeedback(true);
    
    // Ocultar después de 1.5 segundos
    setTimeout(() => {
      setShowFeedback(false);
    }, 1500);
  };

  // Cargar cuadernos del usuario al inicio
  useEffect(() => {
    const fetchNotebooks = async () => {
      if (!auth.currentUser) return;

      try {
        setLoading(true);

        const notebooksQuery = query(
          collection(db, 'notebooks'),
          where('userId', '==', auth.currentUser.uid)
        );

        const notebooksSnapshot = await getDocs(notebooksQuery);

        if (notebooksSnapshot.empty) {
          setLoading(false);
          return;
        }

        const notebooksData = notebooksSnapshot.docs.map(doc => ({
          id: doc.id,
          title: doc.data().title,
          color: doc.data().color || '#6147FF'
        }));

        setNotebooks(notebooksData);

        // Si solo hay un cuaderno, seleccionarlo automáticamente
        if (notebooksData.length === 1) {
          setSelectedNotebook(notebooksData[0]);
          fetchConcepts(notebooksData[0].id);
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error("Error al cargar cuadernos:", error);
        setLoading(false);
      }
    };

    fetchNotebooks();
  }, []);

  // Usar useEffect para verificar si hay un cuaderno guardado en el almacenamiento local
  useEffect(() => {
    const storedNotebookId = localStorage.getItem('lastNotebookId');
    
    if (storedNotebookId && notebooks.length > 0) {
      const storedNotebook = notebooks.find(notebook => notebook.id === storedNotebookId);
      
      if (storedNotebook) {
        handleSelectNotebook(storedNotebook);
      }
    }
  }, [notebooks]);

  // Cargar conceptos pendientes cuando se selecciona un cuaderno
  useEffect(() => {
    if (selectedNotebook && auth.currentUser) {
      checkPendingReview();
    }
  }, [selectedNotebook]);

  // Comprobar conceptos pendientes de repaso
  const checkPendingReview = async () => {
    if (!selectedNotebook || !auth.currentUser) return;
    
    try {
      const reviewQuery = query(
        collection(db, 'reviewConcepts'),
        where('notebookId', '==', selectedNotebook.id),
        where('userId', '==', auth.currentUser.uid)
      );
      
      const reviewSnapshot = await getDocs(reviewQuery);
      const pendingCount = reviewSnapshot.docs.length;
      
      setPendingReview(pendingCount);
      
      // Si estamos en modo repaso pero no hay conceptos, mostrar mensaje
      if (showReviewMode && pendingCount === 0) {
        displayFeedback('info', 'No hay conceptos pendientes para repasar');
        setShowReviewMode(false);
      }
    } catch (error) {
      console.error("Error al cargar conceptos para repaso:", error);
    }
  };

  // Función optimizada para cargar conceptos
  const fetchConcepts = useCallback(async (notebookId: string) => {
    if (!notebookId) return;

    try {
      setLoading(true);

      // Si estamos en modo repaso, cargamos los conceptos guardados para repasar
      if (showReviewMode) {
        const reviewQuery = query(
          collection(db, 'reviewConcepts'),
          where('notebookId', '==', notebookId),
          where('userId', '==', auth.currentUser?.uid)
        );
        
        const reviewSnapshot = await getDocs(reviewQuery);
        
        if (reviewSnapshot.empty) {
          setLoading(false);
          setAllConcepts([]);
          setCurrentConcepts([]);
          setConceptsRemaining(0);
          displayFeedback('info', 'No hay conceptos pendientes de repaso');
          return;
        }
        
        // Procesar conceptos guardados para repaso
        const reviewConceptsPromises = reviewSnapshot.docs.map(async (reviewDoc) => {
          const data = reviewDoc.data();
          
          try {
            // Obtener el concepto original
            const conceptDoc = await getDoc(doc(db, 'conceptos', data.conceptDocId));
            if (!conceptDoc.exists()) return null;
            
            const conceptos = conceptDoc.data().conceptos;
            const originalConcept = conceptos[data.conceptIndex];
            
            if (!originalConcept) return null;
            
            return {
              ...originalConcept,
              docId: data.conceptDocId,
              index: data.conceptIndex,
              id: `${data.conceptDocId}-${data.conceptIndex}`,
              reviewId: reviewDoc.id
            };
          } catch (error) {
            console.error("Error al cargar concepto para repaso:", error);
            return null;
          }
        });
        
        const reviewConcepts = await Promise.all(reviewConceptsPromises);
        
        // Filtrar nulos (conceptos que ya no existen)
        const validConcepts = reviewConcepts.filter(c => c !== null) as Concept[];
        
        // Barajar conceptos para una experiencia más dinámica
        const shuffledConcepts = validConcepts.sort(() => 0.5 - Math.random());
        
        setAllConcepts(shuffledConcepts);
        setCurrentConcepts(shuffledConcepts);
        setConceptsRemaining(shuffledConcepts.length);
        setSessionStats({
          mastered: 0,
          toReview: 0,
          total: shuffledConcepts.length
        });
        
        setLoading(false);
        return;
      }

      // Modo de estudio normal
      const conceptsQuery = query(
        collection(db, 'conceptos'),
        where('cuadernoId', '==', notebookId)
      );

      const conceptsSnapshot = await getDocs(conceptsQuery);

      if (conceptsSnapshot.empty) {
        setLoading(false);
        setAllConcepts([]);
        setCurrentConcepts([]);
        return;
      }

      // Procesar documentos para obtener todos los conceptos
      let allConceptsData: Concept[] = [];

      conceptsSnapshot.docs.forEach(doc => {
        const conceptosData = doc.data().conceptos || [];

        // Agregar ID del documento y metadatos a cada concepto
        const conceptosWithIds = conceptosData.map((concepto: any, index: number) => ({
          ...concepto,
          docId: doc.id,
          index,
          id: `${doc.id}-${index}`
        }));

        allConceptsData = [...allConceptsData, ...conceptosWithIds];
      });

      // Seleccionar conceptos aleatorios para la sesión de estudio (máx. 20)
      const shuffled = allConceptsData.sort(() => 0.5 - Math.random());
      const selected = shuffled.slice(0, Math.min(20, shuffled.length));

      setAllConcepts(allConceptsData);
      setCurrentConcepts(selected);
      setConceptsRemaining(selected.length);
      setSessionStats({
        mastered: 0,
        toReview: 0,
        total: selected.length
      });
      
      setLoading(false);
    } catch (error) {
      console.error("Error al cargar conceptos:", error);
      setLoading(false);
      displayFeedback('warning', 'Error al cargar conceptos');
    }
  }, [showReviewMode]);

  // Manejar selección de cuaderno
  const handleSelectNotebook = (notebook: Notebook) => {
    setSelectedNotebook(notebook);
    localStorage.setItem('lastNotebookId', notebook.id);
    fetchConcepts(notebook.id);
  };

  // Iniciar sesión de estudio
  const handleStartStudy = () => {
    if (currentConcepts.length === 0) {
      displayFeedback('warning', 'No hay conceptos disponibles para estudiar');
      return;
    }

    setStudyStarted(true);
    setConceptsCompleted(0);

    // Registrar inicio de sesión de estudio en actividad
    logStudyActivity('study_session_started', showReviewMode ? 'Sesión de repaso' : 'Sesión de estudio');
  };

  // Manejar concepto completado
  const handleConceptComplete = async (conceptId: string) => {
    // Mostrar mensaje de retroalimentación
    displayFeedback('success', '¡Concepto dominado!');
    
    // Encontrar el concepto en la lista actual
    const conceptIndex = currentConcepts.findIndex(c => c.id === conceptId);
    if (conceptIndex === -1) return;
    
    const concept = currentConcepts[conceptIndex];
    
    // Si estamos en modo repaso y existe un reviewId, eliminamos el concepto de la colección de repaso
    if (showReviewMode && concept.reviewId) {
      try {
        await deleteDoc(doc(db, 'reviewConcepts', concept.reviewId));
        // Actualizar contador de pendientes
        setPendingReview(prev => Math.max(0, prev - 1));
      } catch (error) {
        console.error("Error al eliminar concepto de repaso:", error);
      }
    }
    
    // Incrementar contador de completados
    setConceptsCompleted(prev => prev + 1);
    
    // Actualizar estadísticas de la sesión
    setSessionStats(prev => ({
      ...prev,
      mastered: prev.mastered + 1
    }));
    
    // Remover concepto de la lista actual
    const updatedConcepts = [...currentConcepts];
    updatedConcepts.splice(conceptIndex, 1);
    setCurrentConcepts(updatedConcepts);
    
    // Actualizar conceptos restantes
    const newRemaining = updatedConcepts.length;
    setConceptsRemaining(newRemaining);
    
    // Verificar si la sesión está completa
    if (newRemaining <= 0) {
      setIsSessionComplete(true);
      logStudyActivity('study_session_completed', 'Sesión completada');
    }
    
    // Registrar actividad
    logStudyActivity('concept_mastered', 
      `Concepto dominado: ${concept.término || 'Concepto'}`);
  };

  // Manejar concepto para repasar después
  const handleConceptLater = async (conceptId: string) => {
    // Mostrar mensaje de retroalimentación
    displayFeedback('info', 'Repasar más tarde');
    
    // Encontrar el concepto en la lista actual
    const conceptIndex = currentConcepts.findIndex(c => c.id === conceptId);
    if (conceptIndex === -1) return;
    
    const concept = currentConcepts[conceptIndex];
    
    // Si NO estamos en modo repaso, guardar para repaso posterior
    if (!showReviewMode) {
      try {
        // Verificar si ya existe en la colección de repaso
        const existingQuery = query(
          collection(db, 'reviewConcepts'),
          where('userId', '==', auth.currentUser?.uid),
          where('notebookId', '==', selectedNotebook?.id),
          where('conceptDocId', '==', concept.docId),
          where('conceptIndex', '==', concept.index)
        );
        
        const existingSnapshot = await getDocs(existingQuery);
        
        if (existingSnapshot.empty) {
          // Guardar en la colección de conceptos para repaso
          await addDoc(collection(db, 'reviewConcepts'), {
            userId: auth.currentUser?.uid,
            notebookId: selectedNotebook?.id,
            conceptDocId: concept.docId,
            conceptIndex: concept.index,
            createdAt: new Date()
          });
          
          // Actualizar contador de pendientes
          setPendingReview(prev => prev + 1);
          
          // Actualizar estadísticas de la sesión
          setSessionStats(prev => ({
            ...prev,
            toReview: prev.toReview + 1
          }));
        }
      } catch (error) {
        console.error("Error al guardar concepto para repaso:", error);
        displayFeedback('warning', 'Error al guardar para repaso');
      }
    } else if (concept.reviewId) {
      // Si estamos en modo repaso, lo mantenemos para la próxima sesión
      // No eliminamos el documento de repaso
      displayFeedback('info', 'Concepto guardado para repaso futuro');
    }
    
    // Remover concepto de la lista actual
    const updatedConcepts = [...currentConcepts];
    updatedConcepts.splice(conceptIndex, 1);
    setCurrentConcepts(updatedConcepts);
    
    // Actualizar conceptos restantes
    const newRemaining = updatedConcepts.length;
    setConceptsRemaining(newRemaining);
    
    // Verificar si la sesión está completa
    if (newRemaining <= 0) {
      setIsSessionComplete(true);
      logStudyActivity('study_session_completed', 'Sesión completada');
    }
    
    // Registrar actividad
    logStudyActivity('concept_review_later',
      `Repasar después: ${concept.término || 'Concepto'}`);
  };

  // Registrar actividad de estudio
  const logStudyActivity = async (type: string, title: string) => {
    if (!auth.currentUser || !selectedNotebook) return;

    try {
      // Crear nuevo documento de actividad
      const newActivity = {
        userId: auth.currentUser.uid,
        type,
        title,
        timestamp: new Date(),
        notebookId: selectedNotebook.id
      };

      console.log("Actividad registrada:", newActivity);
      
      // En una implementación real se guardaría en Firestore:
      // await addDoc(collection(db, 'userActivities'), newActivity);
    } catch (error) {
      console.error("Error al registrar actividad:", error);
    }
  };

  // Finalizar sesión de estudio
  const handleFinishSession = () => {
    setStudyStarted(false);
    setIsSessionComplete(false);
    setCurrentConcepts([]);
    setConceptsCompleted(0);
    setConceptsRemaining(0);
    
    // Guardar el ID del cuaderno en el almacenamiento local
    if (selectedNotebook) {
      localStorage.setItem('lastNotebookId', selectedNotebook.id);
    }
    
    // Verificar si hay conceptos pendientes después de la sesión
    if (selectedNotebook) {
      checkPendingReview();
    }
  };

  // Iniciar nueva sesión con el mismo cuaderno
  const handleNewSession = () => {
    if (selectedNotebook) {
      fetchConcepts(selectedNotebook.id);
      setIsSessionComplete(false);
      setStudyStarted(false);
      setConceptsCompleted(0);
    }
  };

  // Cambiar entre modo estudio y repaso
  const toggleReviewMode = () => {
    setShowReviewMode(!showReviewMode);
    if (selectedNotebook) {
      fetchConcepts(selectedNotebook.id);
    }
  };

  // Renderizar página de selección de cuaderno
  const renderNotebookSelection = () => {
    return (
      <div className="study-notebook-selection">
        <h2>Selecciona un cuaderno para estudiar</h2>

        {notebooks.length === 0 ? (
          <div className="empty-notebooks">
            <p>No tienes cuadernos creados.</p>
            <button
              className="create-notebook-button"
              onClick={() => navigate('/notebooks')}
            >
              Crear un cuaderno
            </button>
          </div>
        ) : (
          <div className="notebooks-list">
            {notebooks.map(notebook => (
              <div
                key={notebook.id}
                className={`notebook-item ${selectedNotebook?.id === notebook.id ? 'selected' : ''}`}
                onClick={() => handleSelectNotebook(notebook)}
                style={{ borderColor: notebook.color }}
              >
                <div className="notebook-color" style={{ backgroundColor: notebook.color }}></div>
                <div className="notebook-title">{notebook.title}</div>
                {selectedNotebook?.id === notebook.id && <i className="fas fa-check"></i>}
              </div>
            ))}
          </div>
        )}

        {selectedNotebook && (
          <div className="start-study-container">
            <p>{currentConcepts.length} conceptos disponibles para estudiar</p>
            
            {pendingReview > 0 && (
              <div className="review-toggle">
                <div className="toggle-container">
                  <label className="toggle-switch">
                    <input 
                      type="checkbox" 
                      checked={showReviewMode}
                      onChange={toggleReviewMode}
                    />
                    <span className="switch-slider"></span>
                  </label>
                  <span className="review-label">
                    <span className="review-mode-text">
                      {showReviewMode ? 'Modo repaso' : 'Modo estudio'} 
                    </span>
                    <span className="review-badge">
                      {pendingReview} pendientes
                    </span>
                  </span>
                </div>
                
                <p className="review-description">
                  {showReviewMode 
                    ? 'Repasa únicamente los conceptos que marcaste para revisión posterior.' 
                    : 'Cambia a modo repaso para trabajar en conceptos pendientes.'}
                </p>
              </div>
            )}
            
            <button
              className={`start-study-button ${showReviewMode ? 'review-mode' : ''}`}
              onClick={handleStartStudy}
              disabled={currentConcepts.length === 0}
            >
              <i className={`fas ${showReviewMode ? 'fa-sync-alt' : 'fa-play'}`}></i>
              {showReviewMode ? 'Comenzar repaso' : 'Comenzar a estudiar'}
            </button>
            
            {/* Botón de Aprendizaje */}
            <button
              className="learning-button"
              onClick={() => selectedNotebook && navigate(`/tools/explain/simple/${selectedNotebook.id}`)}
              disabled={!selectedNotebook}
            >
              <i className="fas fa-lightbulb"></i> Explicación de conceptos
            </button>
          </div>
        )}
      </div>
    );
  };

  // Renderizar sesión de estudio activa
  const renderStudySession = () => {
    // Verificamos si hay conceptos disponibles
    if (currentConcepts.length === 0) {
      return (
        <div className="empty-concepts">
          <div className="empty-concepts-icon">
            <i className="fas fa-check-circle"></i>
          </div>
          <h3>¡Has completado todos los conceptos!</h3>
          <p>No hay más conceptos para estudiar en esta sesión.</p>
          <button 
            className="finish-session-button"
            onClick={() => setIsSessionComplete(true)}
          >
            Ver resumen
          </button>
        </div>
      );
    }

    // Usar el primer concepto del array actualizado
    const currentConcept = currentConcepts[0];

    return (
      <div className="study-session">
        {/* Componente de retroalimentación */}
        {showFeedback && (
          <div className={`feedback-message ${feedbackType}`}>
            {feedbackType === 'success' && <i className="fas fa-check-circle"></i>}
            {feedbackType === 'info' && <i className="fas fa-info-circle"></i>}
            {feedbackType === 'warning' && <i className="fas fa-exclamation-circle"></i>}
            <span>{feedbackMessage}</span>
          </div>
        )}

        {/* Barra de progreso mejorada */}
        <div className="study-progress">
          <div className="progress-text">
            <span>
              <strong>{conceptsCompleted}</strong> de <strong>{conceptsCompleted + conceptsRemaining}</strong> conceptos
              {showReviewMode && <span className="mode-indicator"> · Modo Repaso</span>}
            </span>
          </div>
          <div className="progress-bar">
            <div
              className={`progress-fill ${showReviewMode ? 'review-mode' : ''}`}
              style={{
                width: `${(conceptsCompleted / (conceptsCompleted + conceptsRemaining)) * 100}%`
              }}
            ></div>
          </div>
        </div>

        <div className="study-cards-container">
          <SwipeableStudyCard
            concept={currentConcept}
            onComplete={handleConceptComplete}
            onLater={handleConceptLater}
            isLast={conceptsRemaining === 1}
            key={currentConcept.id}
            reviewMode={showReviewMode}
          />
        </div>
      </div>
    );
  };

  // Renderizar pantalla de finalización mejorada
  const renderSessionComplete = () => {
    return (
      <div className="session-complete">
        <div className="completion-header">
          <i className="fas fa-trophy"></i>
          <h2>{showReviewMode ? '¡Repaso completado!' : '¡Sesión completada!'}</h2>
          <p>Has completado esta sesión de {showReviewMode ? 'repaso' : 'estudio'}.</p>
        </div>

        <div className="session-stats">
          <div className="stat-item">
            <div className="stat-icon">
              <i className="fas fa-check-circle"></i>
            </div>
            <div className="stat-value">{conceptsCompleted}</div>
            <div className="stat-label">Conceptos revisados</div>
          </div>
          
          <div className="stat-item">
            <div className="stat-icon">
              <i className="fas fa-graduation-cap"></i>
            </div>
            <div className="stat-value">{sessionStats.mastered}</div>
            <div className="stat-label">Dominados</div>
          </div>
          
          {!showReviewMode && (
            <div className="stat-item">
              <div className="stat-icon">
                <i className="fas fa-bookmark"></i>
              </div>
              <div className="stat-value">{sessionStats.toReview}</div>
              <div className="stat-label">Para repasar</div>
            </div>
          )}
        </div>

        <div className="session-actions">
          <button
            className="action-button secondary"
            onClick={handleNewSession}
          >
            <i className="fas fa-redo"></i>
            <span>{showReviewMode ? 'Nuevo repaso' : 'Nueva sesión'}</span>
          </button>

          {showReviewMode && pendingReview > 0 && (
            <div className="pending-review-info">
              <p>
                Aún tienes <strong>{pendingReview}</strong> conceptos pendientes de repaso
              </p>
            </div>
          )}

          {!showReviewMode && sessionStats.toReview > 0 && (
            <div className="pending-review-info">
              <p>
                Has marcado <strong>{sessionStats.toReview}</strong> conceptos para repasar después
              </p>
            </div>
          )}

          <button
            className="action-button primary"
            onClick={handleFinishSession}
          >
            <i className="fas fa-check"></i>
            <span>Finalizar</span>
          </button>
        </div>
        
        {pendingReview > 0 && !showReviewMode && (
          <button
            className="switch-to-review-button"
            onClick={() => {
              setShowReviewMode(true);
              handleNewSession();
            }}
          >
            <i className="fas fa-sync-alt"></i>
            <span>Cambiar a modo repaso ({pendingReview})</span>
          </button>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="study-mode-container">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`study-mode-container ${showReviewMode ? 'review-mode' : ''}`}>
      <header className="study-mode-header">
        <div className="header-content">
          <button
            className="back-button"
            onClick={() => {
              if (studyStarted) {
                setIsSessionComplete(true);
              } else {
                navigate('/notebooks');
              }
            }}
          >
            {studyStarted ? <i className="fas fa-times"></i> : <i className="fas fa-arrow-left"></i>}
          </button>

          <h1>
            {selectedNotebook ? selectedNotebook.title : 'Modo Estudio'}
            {showReviewMode && studyStarted && <span className="mode-badge">Repaso</span>}
          </h1>

          <div className="header-spacer"></div>
        </div>
      </header>

      <main className="study-mode-main">
        {!studyStarted && !isSessionComplete && renderNotebookSelection()}
        {studyStarted && !isSessionComplete && renderStudySession()}
        {isSessionComplete && renderSessionComplete()}
      </main>
    </div>
  );
};

export default StudyModePage;