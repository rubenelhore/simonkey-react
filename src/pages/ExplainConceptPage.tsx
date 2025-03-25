import React from 'react';
import { useParams, Link } from 'react-router-dom';
import ExplainConcept from '../components/ExplainConcept';
import '../styles/ToolPage.css';

type ExplainType = 'simple' | 'related' | 'interests';

const ExplainConceptPage: React.FC = () => {
  const { notebookId, type } = useParams<{ notebookId: string; type: ExplainType }>();
  
  const getTitle = () => {
    switch(type) {
      case 'simple': return 'Explicar Sencillamente';
      case 'related': return 'Explicar con Conceptos Relacionados';
      case 'interests': return 'Explicar con mis Intereses';
      default: return 'Explicar Concepto';
    }
  };
  
  return (
    <div className="tool-page-container">
      <header className="tool-page-header">
        <div className="header-content">
          <div className="breadcrumb">
            <Link to={`/notebooks/${notebookId}`} className="back-button">
              <i className="fas fa-arrow-left"></i> Volver al cuaderno
            </Link>
            <h1>{getTitle()}</h1>
          </div>
        </div>
      </header>
      
      <main className="tool-page-content">
        <ExplainConcept notebookId={notebookId} />
      </main>
    </div>
  );
};

export default ExplainConceptPage;