import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import '../styles/NotebookDetail.css';

interface ToolsMenuProps {
  notebookId?: string;
}

const ToolsMenu: React.FC<ToolsMenuProps> = ({ notebookId }) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <aside className="tools-menu-section">
      <h2 style={{ color: 'var(--notebook-color)' }}>Herramientas de estudio</h2>
      <button 
        onClick={toggleMenu} 
        className={`tools-toggle-button ${isOpen ? 'active' : ''}`}
        style={{ fontFamily: "'Poppins', sans-serif" }}
      >
        {isOpen ? 'Cerrar' : 'Ver herramientas'} 
        <i className={`fas fa-chevron-${isOpen ? 'up' : 'down'}`}></i>
      </button>

      {isOpen && (
        <div className="tools-container">
          <div className="category-items">
            {/* Explicar concepto */}
            <Link to={notebookId ? `/tools/explain/simple/${notebookId}` : '#'} className="tool-link">Explicar Concepto</Link>
  
            {/* Visuales */}
            <Link to={notebookId ? `/tools/visual/concept-map/${notebookId}` : '#'} className="tool-link">Visuales</Link>
            
            {/* Auditivos */}
            <Link to={notebookId ? `/tools/audio/podcast/${notebookId}` : '#'} className="tool-link">Auditivos</Link>
          </div>
        </div>
      )}
    </aside>
  );
};

export default ToolsMenu;