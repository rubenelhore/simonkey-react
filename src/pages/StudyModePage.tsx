// src/pages/StudyModePage.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db, auth } from '../services/firebase';
import SwipeableStudyCard from '../components/Mobile/SwipeableStudyCard';
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
  const navigate = useNavigate();

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

  // Función para cargar conceptos de un cuaderno
  const fetchConcepts = async (notebookId: string) => {
    if (!notebookId) return;

    try {
      setLoading(true);

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

  // Manejar concepto completado (dominado)
  const handleConceptComplete = (conceptId: any) => {
    // Actualizar estado local
    setCurrentConcepts(prev => prev.filter(c => c.id !== conceptId));
    const newRemaining = conceptsRemaining - 1;
    setConceptsRemaining(newRemaining);
    setConceptsCompleted(prev => prev + 1);

    // Verificar si la sesión está completa
    if (newRemaining <= 0) {
      setIsSessionComplete(true);
      logStudyActivity('study_session_completed', 'Sesión completada');
    }

    // Actualizar estado en Firestore (en una implementación real)
    // En este ejemplo solo registramos la actividad
    logStudyActivity('concept_mastered',
      `Concepto dominado: ${currentConcepts.find(c => c.id === conceptId)?.término || 'Concepto'}`);
  };

  // Manejar concepto para repasar después
  const handleConceptLater = (conceptId: any) => {
    // Actualizar estado local
    setCurrentConcepts(prev => prev.filter(c => c.id !== conceptId));
    const newRemaining = conceptsRemaining - 1;
    setConceptsRemaining(newRemaining);

    // Verificar si la sesión está completa
    if (newRemaining <= 0) {
      setIsSessionComplete(true);
      logStudyActivity('study_session_completed', 'Sesión completada');
    }

    // En una implementación completa, moveríamos este concepto a una lista de "repasar después"
    logStudyActivity('concept_review_later',
      `Repasar después: ${currentConcepts.find(c => c.id === conceptId)?.término || 'Concepto'}`);
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
            <button
              className="start-study-button"
              onClick={handleStartStudy}
              disabled={currentConcepts.length === 0}
            >
              Comenzar a estudiar
            </button>
          </div>
        )}
      </div>
    );
  };

  // Renderizar sesión de estudio activa
  const renderStudySession = () => {
    const currentConcept = currentConcepts[0];

    if (!currentConcept) {
      return (
        <div className="empty-concepts">
          <p>No hay más conceptos para estudiar.</p>
        </div>
      );
    }

    return (
      <div className="study-session">
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
          />
        </div>

        <div className="study-instructions">
          <div className="instruction">
            <i className="fas fa-arrow-left"></i>
            <span>Desliza a la izquierda para repasar después</span>
          </div>
          <div className="instruction">
            <span>Toca para ver definición</span>
            <i className="fas fa-hand-point-up"></i>
          </div>
          <div className="instruction">
            <span>Desliza a la derecha si lo dominas</span>
            <i className="fas fa-arrow-right"></i>
          </div>
        </div>

        <button
          className="quit-session-button"
          onClick={() => setIsSessionComplete(true)}
        >
          Finalizar sesión
        </button>
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