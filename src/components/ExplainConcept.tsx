import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../services/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import '../styles/ExplainConcept.css';

// Definimos las interfaces para los tipos
interface Concept {
  id: string;
  term: string;
  definition: string;
}

// Interfaz para el formato de conceptos en Firebase
interface ConceptDoc {
  id: string;
  cuadernoId: string;
  usuarioId: string;
  conceptos: {
    término: string;
    definición: string;
    fuente: string;
    notasPersonales?: string;
  }[];
  creadoEn: Date;
}

interface ExplainConceptProps {
  notebookId?: string;
}

const ExplainConcept: React.FC<ExplainConceptProps> = ({ notebookId: propNotebookId }) => {
  // Estados
  const [concepts, setConcepts] = useState<Concept[]>([]);
  const [selectedConcept, setSelectedConcept] = useState<string>('');
  const [explanation, setExplanation] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [activeButton, setActiveButton] = useState<string | null>(null);

  // Usa el notebookId de props o de parámetros de URL
  const params = useParams<Record<string, string>>();
  const paramNotebookId = params.notebookId;
  const notebookId = propNotebookId || paramNotebookId;

  // Cargar los conceptos cuando el componente se monta
  useEffect(() => {
    const fetchConcepts = async () => {
      if (!notebookId) return;
      
      setIsLoading(true);
      try {
        // Consultar conceptos asociados a este cuaderno desde Firebase
        const q = query(
          collection(db, 'conceptos'),
          where('cuadernoId', '==', notebookId)
        );
        
        const querySnapshot = await getDocs(q);
        const conceptDocs = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as ConceptDoc[];
        
        // Transformar los documentos de conceptos al formato requerido por el componente
        let transformedConcepts: Concept[] = [];
        
        conceptDocs.forEach(doc => {
          // Cada documento puede contener múltiples conceptos
          doc.conceptos.forEach((concepto, index) => {
            transformedConcepts.push({
              id: `${doc.id}-${index}`, // Crear un ID único combinando el ID del documento y el índice
              term: concepto.término,
              definition: concepto.definición
            });
          });
        });
        
        setConcepts(transformedConcepts);
      } catch (error) {
        console.error('Error al cargar los conceptos:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchConcepts();
  }, [notebookId]);

  // Función para generar explicaciones
  const generateExplanation = async (type: string) => {
    if (!selectedConcept) {
      alert('Por favor, selecciona un concepto primero');
      return;
    }

    setIsLoading(true);
    setActiveButton(type);
    
    const concept = concepts.find(c => c.id === selectedConcept);
    
    try {
      // Aquí iría la llamada a tu API de IA
      // Ejemplo:
      // const response = await aiService.explainConcept({
      //   conceptTerm: concept?.term,
      //   conceptDefinition: concept?.definition,
      //   explanationType: type,
      //   notebookId
      // });
      // setExplanation(response.explanation);
      
      // Simulación para el ejemplo
      let simulatedResponse = '';
      
      switch (type) {
        case 'simple':
          simulatedResponse = `${concept?.term} es, en términos simples, ${concept?.definition.toLowerCase()}. Imagina que ${concept?.term} es como un lego para construir páginas web.`;
          break;
        case 'related':
          simulatedResponse = `${concept?.term} se relaciona con otros conceptos de tu cuaderno. Por ejemplo, si estás estudiando desarrollo web, ${concept?.term} trabaja junto con HTML y CSS para crear aplicaciones web completas.`;
          break;
        case 'interests':
          simulatedResponse = `Basado en tus intereses, ${concept?.term} puede ser útil cuando quieras ${concept?.term === 'React' ? 'desarrollar aplicaciones web interactivas' : 'crear aplicaciones más robustas y seguras'}.`;
          break;
        default:
          simulatedResponse = 'No se pudo generar una explicación.';
      }
      
      // Simula retraso de red
      setTimeout(() => {
        setExplanation(simulatedResponse);
        setIsLoading(false);
      }, 1000);
      
    } catch (error) {
      console.error('Error al generar la explicación:', error);
      setExplanation('Ocurrió un error al generar la explicación. Por favor, intenta de nuevo.');
      setIsLoading(false);
    }
  };

  return (
    <div className="explain-concept-container">
      <h2>Explicar concepto</h2>
      
      <div className="concept-selector">
        <label htmlFor="concept-select">Selecciona un concepto:</label>
        <select 
          id="concept-select"
          value={selectedConcept}
          onChange={(e) => setSelectedConcept(e.target.value)}
          disabled={isLoading}
        >
          <option value="">Selecciona un concepto</option>
          {concepts.map((concept) => (
            <option key={concept.id} value={concept.id}>
              {concept.term}
            </option>
          ))}
        </select>
      </div>

      <div className="explanation-buttons">
        <button 
          onClick={() => generateExplanation('simple')}
          disabled={isLoading || !selectedConcept}
          className={activeButton === 'simple' ? 'active' : ''}
        >
          <i className="fas fa-child"></i> Sencillamente
        </button>
        <button 
          onClick={() => generateExplanation('related')}
          disabled={isLoading || !selectedConcept}
          className={activeButton === 'related' ? 'active' : ''}
        >
          <i className="fas fa-project-diagram"></i> Relacionado con mis conceptos
        </button>
        <button 
          onClick={() => generateExplanation('interests')}
          disabled={isLoading || !selectedConcept}
          className={activeButton === 'interests' ? 'active' : ''}
        >
          <i className="fas fa-heart"></i> Relacionado con mis intereses
        </button>
      </div>

      <div className="explanation-container">
        {isLoading ? (
          <div className="loading-container">
            <div className="loading-animation">
              <i className="fas fa-spinner fa-spin"></i>
            </div>
            <p>Simón está pensando...</p>
          </div>
        ) : explanation ? (
          <div className="explanation-content">
            <h3>
              {activeButton === 'simple' && 'Explicación sencilla'}
              {activeButton === 'related' && 'Relacionado con tus conceptos'}
              {activeButton === 'interests' && 'Relacionado con tus intereses'}
            </h3>
            <p>{explanation}</p>
          </div>
        ) : (
          <div className="empty-explanation">
            <p>Selecciona un concepto y haz clic en uno de los botones para generar una explicación.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExplainConcept;