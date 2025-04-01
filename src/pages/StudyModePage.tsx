// src/pages/StudyModePage.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, addDoc, doc, getDoc, deleteDoc } from 'firebase/firestore';
import { db, auth } from '../services/firebase';
import SwipeableStudyCard from '../components/Mobile/SwipeableStudyCard';
import ToolsMenu from '../components/ToolsMenu';
import '../styles/StudyModePage.css';

// Define an interface for your notebook objects
interface Notebook {
  id: string;
  title: string;
  color: string;
}

const StudyModePage = () => {
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [selectedNotebook, setSelectedNotebook] = useState<Notebook | null>(null);
  const [, setConcepts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [studyStarted, setStudyStarted] = useState(false);
  const [isSessionComplete, setIsSessionComplete] = useState(false);
  const [currentConcepts, setCurrentConcepts] = useState<any[]>([]);
  const [conceptsRemaining, setConceptsRemaining] = useState<number>(0);
  const [conceptsCompleted, setConceptsCompleted] = useState<number>(0);
  const [showReviewMode, setShowReviewMode] = useState<boolean>(false);
  const [pendingReview, setPendingReview] = useState<number>(0);
  const navigate = useNavigate();

  // Nuevos estados para el sistema de retroalimentación
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [feedbackType, setFeedbackType] = useState<'success' | 'info' | null>(null);
  const [showFeedback, setShowFeedback] = useState<boolean>(false);

  // Función para mostrar retroalimentación - colócala después de los estados 
  // y antes de los useEffect o de otras funciones
  const displayFeedback = (type: 'success' | 'info', message: string) => {
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

  // Usar useEffect para verificar si hay un cuaderno guardado en el almacenamiento local al cargar la página
  useEffect(() => {
    const storedNotebookId = localStorage.getItem('lastNotebookId');
    
    if (storedNotebookId) {
      // Buscar el cuaderno en la lista de cuadernos
      const storedNotebook = notebooks.find(notebook => notebook.id === storedNotebookId);
      
      if (storedNotebook) {
        handleSelectNotebook(storedNotebook);
      }
    }
  }, [notebooks]);

  // Añade este useEffect para cargar los conceptos pendientes de repaso cuando se selecciona un cuaderno
  useEffect(() => {
    if (selectedNotebook && auth.currentUser) {
      checkPendingReview();
    }
  }, [selectedNotebook]);

  // Añade esta función para verificar si hay conceptos pendientes de repaso
  const checkPendingReview = async () => {
    if (!selectedNotebook || !auth.currentUser) return;
    
    try {
      const reviewQuery = query(
        collection(db, 'reviewConcepts'),
        where('notebookId', '==', selectedNotebook.id),
        where('userId', '==', auth.currentUser.uid)
      );
      
      const reviewSnapshot = await getDocs(reviewQuery);
      setPendingReview(reviewSnapshot.docs.length);
    } catch (error) {
      console.error("Error al cargar conceptos para repaso:", error);
    }
  };

  // Función para cargar conceptos de un cuaderno
  const fetchConcepts = async (notebookId: string) => {
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
          setConcepts([]);
          setCurrentConcepts([]);
          setConceptsRemaining(0);
          return;
        }
        
        // Procesar conceptos guardados para repaso
        const reviewConcepts = await Promise.all(reviewSnapshot.docs.map(async (reviewDoc) => {
          const data = reviewDoc.data();
          
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
            reviewId: reviewDoc.id // Guardamos el ID del documento de repaso para eliminarlo después
          };
        }));
        
        // Filtrar nulos (conceptos que ya no existen)
        const validConcepts = reviewConcepts.filter(c => c !== null);
        
        setConcepts(validConcepts);
        setCurrentConcepts(validConcepts);
        setConceptsRemaining(validConcepts.length);
        setLoading(false);
        return;
      }

      const conceptsQuery = query(
        collection(db, 'conceptos'),
        where('cuadernoId', '==', notebookId)
      );

      const conceptsSnapshot = await getDocs(conceptsQuery);

      if (conceptsSnapshot.empty) {
        setLoading(false);
        setConcepts([]);
        return;
      }

      // Procesar documentos para obtener todos los conceptos
      let allConcepts: any[] = [];

      conceptsSnapshot.docs.forEach(doc => {
        const conceptosData = doc.data().conceptos || [];

        // Agregar ID del documento y metadatos a cada concepto
        const conceptosWithIds = conceptosData.map((concepto: any, index: any) => ({
          ...concepto,
          docId: doc.id,
          index,
          id: `${doc.id}-${index}` // ID único para cada concepto
        }));

        allConcepts = [...allConcepts, ...conceptosWithIds];
      });

      // Seleccionar conceptos aleatorios para la sesión de estudio (máx. 20)
      const shuffled = allConcepts.sort(() => 0.5 - Math.random());
      const selected = shuffled.slice(0, Math.min(20, shuffled.length));

      setConcepts(allConcepts);
      setCurrentConcepts(selected);
      setConceptsRemaining(selected.length);
      setLoading(false);
    } catch (error) {
      console.error("Error al cargar conceptos:", error);
      setLoading(false);
    }
  };

  // Manejar selección de cuaderno
  const handleSelectNotebook = (notebook: Notebook) => {
    setSelectedNotebook(notebook);
    localStorage.setItem('lastNotebookId', notebook.id); // Guardar el ID del cuaderno al seleccionarlo
    fetchConcepts(notebook.id);
  };

  // Iniciar sesión de estudio
  const handleStartStudy = () => {
    if (currentConcepts.length === 0) {
      alert("No hay conceptos disponibles para estudiar");
      return;
    }

    setStudyStarted(true);

    // Registrar inicio de sesión de estudio en actividad
    logStudyActivity('study_session_started', 'Sesión de estudio');
  };

  const handleConceptComplete = (conceptId: any) => {
    // Mostrar mensaje de retroalimentación
    displayFeedback('success', '¡Concepto dominado!');
    
    // Incrementar contador de completados
    setConceptsCompleted(prev => prev + 1);
    
    // Actualizar conceptos restantes
    const newRemaining = conceptsRemaining - 1;
    setConceptsRemaining(newRemaining);
    
    console.log("Concepto completado:", conceptId);
    console.log("Conceptos antes de actualizar:", currentConcepts);
    
    // IMPORTANTE: Obtén el nombre del concepto ANTES de eliminar el concepto
    const conceptoCompletado = currentConcepts.find(c => c.id === conceptId);
    
    // Si estamos en modo repaso y existe un reviewId, eliminamos el concepto de la colección de repaso
    if (showReviewMode && conceptoCompletado?.reviewId) {
      try {
        deleteDoc(doc(db, 'reviewConcepts', conceptoCompletado.reviewId));
      } catch (error) {
        console.error("Error al eliminar concepto de repaso:", error);
      }
    }
    
    // Quitar el concepto estudiado
    setCurrentConcepts(prevConcepts => {
      const updatedConcepts = prevConcepts.filter(c => c.id !== conceptId);
      console.log("Conceptos después de actualizar:", updatedConcepts);
      return updatedConcepts;
    });
    
    // Verificar si la sesión está completa
    if (newRemaining <= 0) {
      setIsSessionComplete(true);
      logStudyActivity('study_session_completed', 'Sesión completada');
    }
    
    // Registrar actividad
    logStudyActivity('concept_mastered',
      `Concepto dominado: ${conceptoCompletado?.término || 'Concepto'}`);
  };

  const handleConceptLater = async (conceptId: any) => {
    // Mostrar mensaje de retroalimentación
    displayFeedback('info', 'Repasar más tarde');
    
    // Actualizar conceptos restantes
    const newRemaining = conceptsRemaining - 1;
    setConceptsRemaining(newRemaining);
    
    console.log("Concepto para repasar después:", conceptId);
    console.log("Conceptos antes de actualizar:", currentConcepts);
    
    // Obtén el concepto ANTES de eliminar el concepto
    const conceptoARepasar = currentConcepts.find(c => c.id === conceptId);
    
    if (conceptoARepasar && !showReviewMode) {
      try {
        // Guardar en la colección de conceptos para repaso (solo si no estamos ya en modo repaso)
        await addDoc(collection(db, 'reviewConcepts'), {
          userId: auth.currentUser?.uid,
          notebookId: selectedNotebook?.id,
          conceptDocId: conceptoARepasar.docId,
          conceptIndex: conceptoARepasar.index,
          createdAt: new Date()
        });
        
        // Actualizar contador de pendientes
        setPendingReview(prev => prev + 1);
        
      } catch (error) {
        console.error("Error al guardar concepto para repaso:", error);
      }
    } else if (showReviewMode && conceptoARepasar?.reviewId) {
      // Si estamos en modo repaso, eliminamos el concepto de la colección de repaso
      try {
        await deleteDoc(doc(db, 'reviewConcepts', conceptoARepasar.reviewId));
      } catch (error) {
        console.error("Error al eliminar concepto de repaso:", error);
      }
    }
    
    // Quitar el concepto de la lista actual
    setCurrentConcepts(prevConcepts => {
      const updatedConcepts = prevConcepts.filter(c => c.id !== conceptId);
      console.log("Conceptos después de actualizar:", updatedConcepts);
      return updatedConcepts;
    });
    
    // Verificar si la sesión está completa
    if (newRemaining <= 0) {
      setIsSessionComplete(true);
      logStudyActivity('study_session_completed', 'Sesión completada');
    }
    
    // Registrar actividad
    logStudyActivity('concept_review_later',
      `Repasar después: ${conceptoARepasar?.término || 'Concepto'}`);
  };

  // Registrar actividad de estudio
  const logStudyActivity = async (type: string, title: string) => {
    if (!auth.currentUser || !selectedNotebook) return;

    try {
      // Crear nuevo documento de actividad
      // Este es un ejemplo simplificado, en una implementación real
      // usarías una colección de actividad dedicada
      const newActivity = {
        userId: auth.currentUser.uid,
        type,
        title,
        timestamp: new Date(),
        notebookId: selectedNotebook.id
      };

      // En esta demo no lo guardamos en Firestore para evitar crear colecciones,
      // pero aquí es donde lo harías:
      // await addDoc(activityRef, newActivity);

      console.log("Actividad registrada:", newActivity);
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
    
    setSelectedNotebook(null);
  };

  // Iniciar nueva sesión con el mismo cuaderno
  const handleNewSession = () => {
    if (selectedNotebook) {
      fetchConcepts(selectedNotebook.id);
      setIsSessionComplete(false);
      setStudyStarted(false);
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
                <label className="toggle-switch">
                  <input 
                    type="checkbox" 
                    checked={showReviewMode}
                    onChange={() => {
                      setShowReviewMode(!showReviewMode);
                      fetchConcepts(selectedNotebook.id);
                    }}
                  />
                  <span className="switch-slider"></span>
                </label>
                <span className="review-label">
                  Solo repasar conceptos pendientes ({pendingReview})
                </span>
              </div>
            )}
            
            <button
              className="start-study-button"
              onClick={handleStartStudy}
              disabled={currentConcepts.length === 0}
            >
              {showReviewMode ? 'Comenzar repaso' : 'Comenzar a estudiar'}
            </button>
            
            {/* Nuevo botón de Aprendizaje */}
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
    // Log para depuración
    console.log("Renderizando sesión de estudio. Conceptos actuales:", currentConcepts);
    
    // Verificamos si hay conceptos disponibles
    if (currentConcepts.length === 0) {
      console.log("No hay más conceptos para mostrar");
      return (
        <div className="empty-concepts">
          <p>No hay más conceptos para estudiar.</p>
        </div>
      );
    }

    // Usar el primer concepto del array actualizado
    const currentConcept = currentConcepts[0];  
    console.log("Mostrando concepto:", currentConcept);

    return (
      <div className="study-session">
        {/* Componente de retroalimentación */}
        {showFeedback && (
          <div className={`feedback-message ${feedbackType}`}>
            {feedbackType === 'success' && <i className="fas fa-check-circle"></i>}
            {feedbackType === 'info' && <i className="fas fa-info-circle"></i>}
            <span>{feedbackMessage}</span>
          </div>
        )}

        {/* Resto del código sin cambios */}
        <div className="study-progress">
          <div className="progress-text">
            <span>{conceptsCompleted} de {conceptsCompleted + conceptsRemaining} conceptos</span>
          </div>
          <div className="progress-bar">
            <div
              className="progress-fill"
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
            key={currentConcept.id} /* AÑADIDO: key única para forzar renderizado */
          />
        </div>
      </div>
    );
  };

  // Renderizar pantalla de finalización
  const renderSessionComplete = () => {
    return (
      <div className="session-complete">
        <div className="completion-header">
          <i className="fas fa-trophy"></i>
          <h2>¡Sesión completada!</h2>
        </div>

        <div className="session-stats">
          <div className="stat-item">
            <div className="stat-value">{conceptsCompleted}</div>
            <div className="stat-label">Conceptos estudiados</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{Math.round((conceptsCompleted / (conceptsCompleted + conceptsRemaining)) * 100)}%</div>
            <div className="stat-label">Completado</div>
          </div>
        </div>

        <div className="session-actions">
          <button
            className="action-button"
            onClick={handleNewSession}
          >
            <i className="fas fa-redo"></i>
            <span>Nueva sesión</span>
          </button>

          <button
            className="action-button primary"
            onClick={handleFinishSession}
          >
            <i className="fas fa-check"></i>
            <span>Finalizar</span>
          </button>
        </div>
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
    <div className="study-mode-container">
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

          <h1>{selectedNotebook ? selectedNotebook.title : 'Modo Estudio'}</h1>

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