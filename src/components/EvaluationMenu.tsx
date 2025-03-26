import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import '../styles/ToolsMenu.css'; // Reutilizamos los mismos estilos

interface EvaluationMenuProps {
  notebookId?: string;
}

const EvaluationMenu: React.FC<EvaluationMenuProps> = ({ notebookId }) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <aside className="tools-menu-section evaluation-menu-section">
      <h2>Evaluación</h2>
      <button 
        onClick={toggleMenu} 
        className={`tools-toggle-button ${isOpen ? 'active' : ''}`}
        style={{ fontFamily: "'Poppins', sans-serif" }}
      >
        {isOpen ? 'Cerrar evaluación' : 'Ver evaluación'} 
        <i className={`fas fa-chevron-${isOpen ? 'up' : 'down'}`}></i>
      </button>

      {isOpen && (
        <div className="tools-container">
          <div className="category-items">
            <Link to={notebookId ? `/tools/evaluation/flashcards/${notebookId}` : '#'} className="tool-link">Fichas</Link>
            <Link to={notebookId ? `/tools/evaluation/quiz/${notebookId}` : '#'} className="tool-link">Quiz</Link>
          </div>
        </div>
      )}
    </aside>
  );
};

export default EvaluationMenu;