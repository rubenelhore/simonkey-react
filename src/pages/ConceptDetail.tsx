import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../services/firebase';
import { doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import '../styles/ConceptDetail.css';

interface Concept {
  término: string;
  definición: string;
  fuente: string;
}

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
        
        if (idx < 0 || idx >= conceptos.length) {
          setError("Índice de concepto fuera de rango");
          setLoading(false);
          return;
        }
        
        setConcepto(conceptos[idx]);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching concept:", err);
        setError("Error al cargar el concepto");
        setLoading(false);
      }
    };
    
    fetchData();
  }, [notebookId, conceptoId, index]);

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
            <h1>{cuaderno.title} - Concepto</h1>
          </div>
          <button 
            onClick={handleDeleteConcept} 
            className="delete-concept-button"
            disabled={deleting}
          >
            <i className="fas fa-trash-alt"></i> Eliminar concepto
          </button>
        </div>
      </header>

      <main className="concept-detail-main">
        <div className="concept-card-detail">
          {!isEditing ? (
            // Modo de visualización
            <>
              <h2 className="concept-term">{concepto.término}</h2>
              <div className="concept-definition">
                <h3>Definición:</h3>
                <p>{concepto.definición}</p>
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
      </main>
    </div>
  );
};

export default ConceptDetail;