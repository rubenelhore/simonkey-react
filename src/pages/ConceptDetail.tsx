import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db, auth } from '../services/firebase'; // Add auth import
import { doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import '../styles/ConceptDetail.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import TextToSpeech from '../components/TextToSpeech';
import '../styles/TextToSpeech.css';

interface Concept {
  término: string;
  definición: string;
  fuente: string;
  notasPersonales?: string;
}

// Función para cargar las configuraciones de voz del usuario
const loadVoiceSettings = async () => {
  try {
    if (!auth.currentUser) {
      throw new Error("Usuario no autenticado");
    }
    
    // Obtener las configuraciones de voz del usuario desde Firestore
    const userSettingsRef = doc(db, 'userSettings', auth.currentUser.uid);
    const settingsSnap = await getDoc(userSettingsRef);
    
    if (settingsSnap.exists() && settingsSnap.data().voiceSettings) {
      return settingsSnap.data().voiceSettings;
    }
    
    // Si no hay configuraciones, devolver valores predeterminados
    return {
      autoRead: false,
      voiceRate: 1,
      voicePitch: 1
    };
  } catch (error) {
    console.error("Error al cargar configuraciones de voz:", error);
    // Devolver configuración predeterminada en caso de error
    return {
      autoRead: false,
      voiceRate: 1,
      voicePitch: 1
    };
  }
};

const ConceptDetail = () => {
  const { notebookId, conceptoId, index } = useParams<{ 
    notebookId: string, 
    conceptoId: string, 
    index: string 
  }>();
  const navigate = useNavigate();
  const [concepto, setConcepto] = useState<Concept | null>(null);
  const [cuaderno, setCuaderno] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editedConcept, setEditedConcept] = useState<Concept | null>(null);
  
  // Estados para las notas personales
  const [notasPersonales, setNotasPersonales] = useState<string>('');
  const [isEditingNotes, setIsEditingNotes] = useState<boolean>(false);
  const [isSavingNotes, setIsSavingNotes] = useState<boolean>(false);
  
  // Navegación entre conceptos
  const [totalConcepts, setTotalConcepts] = useState<number>(0);
  const [currentIndex, setCurrentIndex] = useState<number>(0);

  useEffect(() => {
    const fetchData = async () => {
      if (!notebookId || !conceptoId || index === undefined) {
        setError("Información insuficiente para cargar el concepto");
        setLoading(false);
        return;
      }
  
      try {
        const cuadernoRef = doc(db, 'notebooks', notebookId);
        const conceptoRef = doc(db, 'conceptos', conceptoId);
        
        // Obtener los datos en paralelo
        const [cuadernoSnap, conceptoSnap] = await Promise.all([
          getDoc(cuadernoRef),
          getDoc(conceptoRef),
        ]);
        
        if (!cuadernoSnap.exists()) {
          setError("El cuaderno no existe");
          setLoading(false);
          return;
        }
        
        if (!conceptoSnap.exists()) {
          setError("El concepto no existe");
          setLoading(false);
          return;
        }
        
        setCuaderno({ id: cuadernoSnap.id, ...cuadernoSnap.data() });
        
        const conceptos = conceptoSnap.data().conceptos;
        const idx = parseInt(index);
        
        // IMPORTANTE: Actualizar el total de conceptos aquí
        setTotalConcepts(conceptos.length);
        
        if (idx < 0 || idx >= conceptos.length) {
          setError("Índice de concepto fuera de rango");
          setLoading(false);
          return;
        }
        
        const conceptoData = conceptos[idx];
        setConcepto(conceptoData);
        setCurrentIndex(idx);
        
        // Inicializar notas personales si existen
        if (conceptoData.notasPersonales) {
          setNotasPersonales(conceptoData.notasPersonales);
        }
        
        setLoading(false);

        // IMPORTANTE: Implementación mejorada de autoRead
        if (auth.currentUser) {
          try {
            // Cargar configuraciones de voz del usuario
            const voiceSettings = await loadVoiceSettings();
            
            // Verificar si autoRead está habilitado
            if (voiceSettings.autoRead) {
              // Esperar a que el componente se renderice completamente
              setTimeout(() => {
                // Obtener el botón específico de TextToSpeech para el concepto
                const ttsButton = document.querySelector('.concept-definition .text-to-speech-button');
                if (ttsButton instanceof HTMLButtonElement) {
                  console.log("Auto-reproducción activada");
                  ttsButton.click();
                } else {
                  console.warn("No se encontró el botón de reproducción automática");
                }
              }, 1000);
            }
          } catch (error) {
            console.error("Error al cargar configuraciones de voz:", error);
          }
        }
      } catch (err) {
        console.error("Error fetching concept:", err);
        setError("Error al cargar el concepto");
        setLoading(false);
      }
    };
    
    fetchData();
  }, [notebookId, conceptoId, index]);

  useEffect(() => {
    if (cuaderno && cuaderno.color) {
      // Set the notebook color CSS variable
      document.documentElement.style.setProperty('--notebook-color', cuaderno.color);
    } else {
      // Reset to default if no color
      document.documentElement.style.setProperty('--notebook-color', 'var(--primary-color)');
    }

    // Cleanup function to reset the color when component unmounts
    return () => {
      document.documentElement.style.setProperty('--notebook-color', 'var(--primary-color)');
    };
  }, [cuaderno]);

  const handleDeleteConcept = async () => {
    if (!notebookId || !conceptoId || !concepto) return;
    
    if (window.confirm('¿Estás seguro de que deseas eliminar este concepto? Esta acción no se puede deshacer.')) {
      try {
        setDeleting(true);
        
        // Obtenemos la referencia al documento de conceptos
        const conceptoRef = doc(db, 'conceptos', conceptoId);
        const conceptoSnap = await getDoc(conceptoRef);
        
        if (!conceptoSnap.exists()) {
          throw new Error("El documento de conceptos no existe");
        }
        
        // Obtenemos todos los conceptos
        const allConceptos = conceptoSnap.data().conceptos;
        const idx = parseInt(index || '0');
        
        // Verificamos si es el único concepto en el grupo
        if (allConceptos.length === 1) {
          // Si es el único, eliminamos todo el documento
          await deleteDoc(conceptoRef);
        } else {
          // Si hay más conceptos, eliminamos solo este concepto del array
          // Creamos una nueva lista sin el concepto a eliminar
          const updatedConceptos = [
            ...allConceptos.slice(0, idx),
            ...allConceptos.slice(idx + 1)
          ];
          
          // Actualizamos el documento con la nueva lista de conceptos
          await updateDoc(conceptoRef, {
            conceptos: updatedConceptos
          });
        }
        
        // Redirigir al usuario de vuelta al cuaderno
        navigate(`/notebooks/${notebookId}`);
      } catch (error) {
        console.error("Error al eliminar el concepto:", error);
        alert("Ocurrió un error al eliminar el concepto. Por favor, inténtalo de nuevo.");
        setDeleting(false);
      }
    }
  };

  const handleEditConcept = () => {
    // Iniciar el modo de edición copiando el concepto actual
    if (concepto) {
      setEditedConcept({ ...concepto } as Concept);
    }
    setIsEditing(true);
  };

  const handleSaveConcept = async () => {
    if (!editedConcept || !notebookId || !conceptoId) return;
    
    try {
      // Obtenemos la referencia y datos actuales
      const conceptoRef = doc(db, 'conceptos', conceptoId);
      const conceptoSnap = await getDoc(conceptoRef);
      
      if (!conceptoSnap.exists()) {
        throw new Error("El documento de conceptos no existe");
      }
      
      // Obtenemos la lista completa de conceptos
      const allConceptos = conceptoSnap.data().conceptos;
      const idx = parseInt(index || '0');
      
      // Creamos una nueva lista con el concepto actualizado
      const updatedConceptos = [...allConceptos];
      updatedConceptos[idx] = editedConcept;
      
      // Actualizamos el documento en Firebase
      await updateDoc(conceptoRef, {
        conceptos: updatedConceptos
      });
      
      // Actualizamos el estado local
      setConcepto(editedConcept);
      setIsEditing(false);
      
      alert("¡Concepto actualizado correctamente!");
    } catch (error) {
      console.error("Error al guardar el concepto:", error);
      alert("Ocurrió un error al guardar los cambios. Por favor, inténtalo de nuevo.");
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedConcept(null);
  };

  const handleEditNotes = () => {
    setIsEditingNotes(true);
  };

  const handleSaveNotes = async () => {
    if (!notebookId || !conceptoId || !concepto) return;
    
    try {
      setIsSavingNotes(true);
      
      // Obtenemos la referencia y datos actuales
      const conceptoRef = doc(db, 'conceptos', conceptoId);
      const conceptoSnap = await getDoc(conceptoRef);
      
      if (!conceptoSnap.exists()) {
        throw new Error("El documento de conceptos no existe");
      }
      
      // Obtenemos la lista completa de conceptos
      const allConceptos = conceptoSnap.data().conceptos;
      const idx = parseInt(index || '0');
      
      // Creamos una nueva lista con el concepto actualizado que incluye las notas
      const updatedConceptos = [...allConceptos];
      updatedConceptos[idx] = {
        ...updatedConceptos[idx],
        notasPersonales: notasPersonales
      };
      
      // Actualizamos el documento en Firebase
      await updateDoc(conceptoRef, {
        conceptos: updatedConceptos
      });
      
      // Actualizamos el estado local
      setConcepto({
        ...concepto,
        notasPersonales: notasPersonales
      });
      
      setIsEditingNotes(false);
      setIsSavingNotes(false);
      
    } catch (error) {
      console.error("Error al guardar las notas:", error);
      alert("Ocurrió un error al guardar las notas. Por favor, inténtalo de nuevo.");
      setIsSavingNotes(false);
    }
  };

  const handleCancelNotesEdit = () => {
    // Restaurar las notas originales
    if (concepto?.notasPersonales) {
      setNotasPersonales(concepto.notasPersonales);
    } else {
      setNotasPersonales('');
    }
    setIsEditingNotes(false);
  };

  // Funciones de navegación entre conceptos
  const navigateToNextConcept = () => {
    if (currentIndex < totalConcepts - 1) {
      const nextIndex = currentIndex + 1;
      // En lugar de solo navegar, actualiza también los estados
      navigate(`/notebooks/${notebookId}/concepto/${conceptoId}/${nextIndex}`);
      loadConceptAtIndex(nextIndex);
    }
  };

  const navigateToPreviousConcept = () => {
    if (currentIndex > 0) {
      const prevIndex = currentIndex - 1;
      navigate(`/notebooks/${notebookId}/concepto/${conceptoId}/${prevIndex}`);
      loadConceptAtIndex(prevIndex);
    }
  };

  const loadConceptAtIndex = async (idx: number) => {
    try {
      setLoading(true);
      
      const conceptoRef = doc(db, 'conceptos', conceptoId as string);
      const conceptoSnap = await getDoc(conceptoRef);
      
      if (conceptoSnap.exists()) {
        const conceptos = conceptoSnap.data().conceptos;
        
        // IMPORTANTE: Actualizar el total de conceptos aquí
        setTotalConcepts(conceptos.length);
        
        if (idx >= 0 && idx < conceptos.length) {
          const conceptoData = conceptos[idx];
          setConcepto(conceptoData);
          setCurrentIndex(idx);
          
          // Actualiza las notas personales
          setNotasPersonales(conceptoData.notasPersonales || '');
          
          // Resetea otros estados relacionados con la edición
          setIsEditing(false);
          setIsEditingNotes(false);
          setEditedConcept(null);
          
          // IMPORTANTE: Implementación mejorada para autoRead al navegar
          if (auth.currentUser) {
            try {
              const voiceSettings = await loadVoiceSettings();
              
              // Si autoRead está habilitado, activar la síntesis de voz
              if (voiceSettings.autoRead) {
                // Esperamos un poco para asegurarnos de que el componente se haya actualizado
                setTimeout(() => {
                  // Cancelar cualquier síntesis en curso primero
                  if (window.speechSynthesis) {
                    window.speechSynthesis.cancel();
                  }
                  
                  // Buscar específicamente el botón de TextToSpeech dentro de la definición
                  const ttsButton = document.querySelector('.concept-definition .text-to-speech-button');
                  if (ttsButton instanceof HTMLButtonElement) {
                    console.log("Auto-reproducción activada al navegar");
                    ttsButton.click();
                  } else {
                    console.warn("No se encontró el botón de reproducción automática al navegar");
                  }
                }, 500);
              }
            } catch (error) {
              console.error("Error al cargar configuraciones de voz para navegación:", error);
            }
          }
        }
      }
      
      setLoading(false);
    } catch (error) {
      console.error("Error cargando concepto:", error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Cargando concepto...</p>
      </div>
    );
  }

  if (error || !concepto || !cuaderno) {
    return (
      <div className="error-container">
        <h2>Error</h2>
        <p>{error || "No se pudo cargar el concepto"}</p>
        <button 
          onClick={() => navigate(`/notebooks/${notebookId}`)}
          className="back-button"
        >
          Volver al cuaderno
        </button>
      </div>
    );
  }

  return (
    <div className="concept-detail-container">
      <header className="concept-detail-header">
        <div className="header-content">
          <div className="breadcrumb">
            <button 
              onClick={() => navigate(`/notebooks/${notebookId}`)}
              className="back-button"
            >
              <i className="fas fa-arrow-left"></i> Volver
            </button>
            <h1 className="centered-title">{cuaderno.title} - Conceptos</h1>
          </div>
        </div>
      </header>
      <main className="concept-detail-main">
        {/* Controles de navegación entre conceptos */}
        <div className="concept-navigation">
          <button 
            onClick={navigateToPreviousConcept}
            disabled={currentIndex === 0}
            className="concept-nav-button previous"
            aria-label="Concepto anterior"
            title="Concepto anterior"
          >
            <i className="fas fa-chevron-left"></i>
          </button>
          <div className="concept-pagination">
            {currentIndex + 1} / {totalConcepts}
          </div>
          <button 
            onClick={navigateToNextConcept}
            disabled={currentIndex === totalConcepts - 1}
            className="concept-nav-button next"
            aria-label="Siguiente concepto"
            title="Siguiente concepto"
          >
            <i className="fas fa-chevron-right"></i>
          </button>
        </div>
        
        <div className="concept-container">
          <div className="concept-card-detail">
            {!isEditing ? (
              // Modo de visualización
              <>
                <h2 className="concept-term">{concepto.término}</h2>
                <div className="concept-definition">
                  <h3>Definición:</h3>
                  <p>{concepto.definición}</p>
                  <TextToSpeech text={concepto.definición} buttonClassName="concept-tts-button" />
                </div>
                <div className="concept-source">
                  <h3>Fuente:</h3>
                  <cite>{concepto.fuente}</cite>
                </div>
                
                <div className="concept-actions">
                  <button 
                    className="edit-concept-button"
                    onClick={handleEditConcept}
                  >
                    <i className="fas fa-edit"></i> Editar concepto
                  </button>
                  <button 
                    style={{ marginLeft: '10px' }}
                    className="delete-concept-button"
                    onClick={handleDeleteConcept}
                    disabled={deleting}
                  >
                    <i className="fas fa-trash-alt"></i> Eliminar concepto
                  </button>
                </div>
              </>
            ) : (
              // Modo de edición
              <>
                <div className="edit-form">
                  <div className="form-group">
                    <label htmlFor="edit-term">Término:</label>
                    <input
                      id="edit-term"
                      type="text"
                      value={editedConcept?.término || ''}
                      onChange={(e) => setEditedConcept({
                        ...editedConcept as Concept,
                        término: e.target.value
                      })}
                      className="edit-input"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="edit-definition">Definición:</label>
                    <textarea
                      id="edit-definition"
                      value={editedConcept?.definición || ''}
                      onChange={(e) => setEditedConcept({
                        ...editedConcept as Concept,
                        definición: e.target.value
                      })}
                      className="edit-textarea"
                      rows={6}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="edit-source">Fuente:</label>
                    <input
                      id="edit-source"
                      type="text"
                      value={editedConcept?.fuente || ''}
                      onChange={(e) => setEditedConcept({
                        ...editedConcept as Concept,
                        fuente: e.target.value
                      })}
                      className="edit-input"
                    />
                  </div>
                  
                  <div className="edit-actions">
                    <button 
                      className="save-button"
                      onClick={handleSaveConcept}
                    >
                      <i className="fas fa-save"></i> Guardar cambios
                    </button>
                    <button 
                      className="cancel-button"
                      onClick={handleCancelEdit}
                    >
                      <i className="fas fa-times"></i> Cancelar
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Sección de notas personales */}
          <div className="personal-notes-card">
            <div className="personal-notes-header">
              <h2>
                <i className="fas fa-sticky-note"></i>
                Mis notas personales
              </h2>
              {!isEditingNotes ? (
                <button 
                  className="edit-notes-button"
                  onClick={handleEditNotes}
                >
                  <i className="fas fa-pen"></i>
                  {notasPersonales ? 'Editar notas' : 'Añadir notas'}
                </button>
              ) : (
                <div className="notes-edit-actions">
                  <button 
                    className="save-notes-button"
                    onClick={handleSaveNotes}
                    disabled={isSavingNotes}
                  >
                    <i className="fas fa-save"></i>
                    {isSavingNotes ? 'Guardando...' : 'Guardar'}
                  </button>
                  <button 
                    className="cancel-notes-button"
                    onClick={handleCancelNotesEdit}
                    disabled={isSavingNotes}
                  >
                    <i className="fas fa-times"></i>
                    Cancelar
                  </button>
                </div>
              )}
            </div>

            <div className="personal-notes-content">
              {!isEditingNotes ? (
                // Modo de visualización de notas
                notasPersonales ? (
                  <div className="notes-text">
                    {notasPersonales.split('\n').map((line, i) => (
                      <p key={i}>{line}</p>
                    ))}
                    <TextToSpeech text={notasPersonales} buttonClassName="notes-tts-button" />
                  </div>
                ) : (
                  <div className="empty-notes">
                    <p>Aún no has añadido notas personales a este concepto.</p>
                    <p>Las notas te ayudan a personalizar tu aprendizaje y contextualizar el concepto a tu manera.</p>
                  </div>
                )
              ) : (
                // Modo de edición de notas
                <textarea
                  className="notes-textarea"
                  value={notasPersonales}
                  onChange={(e) => setNotasPersonales(e.target.value)}
                  placeholder="Escribe tus notas personales aquí. Puedes incluir ejemplos, asociaciones o cualquier cosa que te ayude a entender mejor este concepto."
                  rows={10}
                />
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ConceptDetail;