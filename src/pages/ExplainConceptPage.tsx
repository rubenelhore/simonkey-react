import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ExplainConcept from '../components/ExplainConcept';
import '../styles/ToolPage.css';

const ExplainConceptPage: React.FC = () => {
  const params = useParams<Record<string, string>>();
  const notebookId = params.notebookId;
  const type = params.type;
  const navigate = useNavigate();
  
  // Prevenir scroll en el body cuando el overlay está activo
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleClose();
      }
    };
    
    document.addEventListener('keydown', handleEscKey);
    
    // Limpiar al desmontar
    return () => {
      document.body.style.overflow = 'auto';
      document.removeEventListener('keydown', handleEscKey);
    };
  }, []);

  const getTitle = () => {
    switch(type) {
      case 'simple': return 'Explicar Sencillamente';
      case 'related': return 'Explicar con Conceptos Relacionados';
      case 'interests': return 'Explicar con mis Intereses';
      default: return 'Explicar Concepto';
    }
  };
  
  const handleClose = () => {
    navigate(`/notebooks/${notebookId}`);
  };
  
  // Cerrar también al hacer clic fuera del contenido principal
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };
  
  return (
    <div className="tool-overlay-backdrop" onClick={handleOverlayClick}>
      <div className="tool-overlay-content">
        <div className="tool-overlay-header">
          <h2>{getTitle()}</h2>
          <button className="close-overlay" onClick={handleClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>
        <div className="tool-overlay-body">
          <ExplainConcept notebookId={notebookId} />
        </div>
      </div>
    </div>
  );
};

export default ExplainConceptPage;