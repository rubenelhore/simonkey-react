import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../services/firebase';
import { doc, getDoc } from 'firebase/firestore';
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
        </div>
      </header>

      <main className="concept-detail-main">
        <div className="concept-card-detail">
          <h2 className="concept-term">{concepto.término}</h2>
          <div className="concept-definition">
            <h3>Definición:</h3>
            <p>{concepto.definición}</p>
          </div>
          <div className="concept-source">
            <h3>Fuente:</h3>
            <cite>{concepto.fuente}</cite>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ConceptDetail;