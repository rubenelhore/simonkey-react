import React, { useState } from 'react';
import '../styles/NotebookDetail.css'; // Importamos los estilos directamente del archivo CSS principal

interface ToolsMenuProps {
  notebookId?: string;
}

const ToolsMenu: React.FC<ToolsMenuProps> = ({ notebookId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
    setActiveCategory(null);
  };

  const toggleCategory = (category: string) => {
    setActiveCategory(activeCategory === category ? null : category);
  };

  return (
    <aside className="tools-menu-section">
      <h2>Herramientas de estudio</h2>
      <button 
        onClick={toggleMenu} 
        className={`tools-toggle-button ${isOpen ? 'active' : ''}`}
        style={{ fontFamily: "'Poppins', sans-serif" }}
      >
        {isOpen ? 'Cerrar herramientas' : 'Ver herramientas'} 
        <i className={`fas fa-chevron-${isOpen ? 'up' : 'down'}`}></i>
      </button>

      {isOpen && (
        <div className="tools-container">
          {/* Explicar concepto */}
          <div className="tool-category">
            <div 
              className="category-header" 
              onClick={() => toggleCategory('explanation')}
            >
              <h3>1. Explicar concepto</h3>
              <i className={`fas fa-chevron-${activeCategory === 'explanation' ? 'down' : 'right'}`}></i>
            </div>
            {activeCategory === 'explanation' && (
              <div className="category-items">
                <a href={notebookId ? `/tools/explain/simple/${notebookId}` : '#'} className="tool-link">1.1 Sencillamente</a>
                <a href={notebookId ? `/tools/explain/related/${notebookId}` : '#'} className="tool-link">1.2 Relacionado con mis conceptos</a>
                <a href={notebookId ? `/tools/explain/interests/${notebookId}` : '#'} className="tool-link">1.3 Relacionado con mis intereses</a>
              </div>
            )}
          </div>

          {/* Visuales */}
          <div className="tool-category">
            <div 
              className="category-header" 
              onClick={() => toggleCategory('visual')}
            >
              <h3>2. Visuales</h3>
              <i className={`fas fa-chevron-${activeCategory === 'visual' ? 'down' : 'right'}`}></i>
            </div>
            {activeCategory === 'visual' && (
              <div className="category-items">
                <a href={notebookId ? `/tools/visual/concept-map/${notebookId}` : '#'} className="tool-link">2.1 Mapa Conceptual</a>
                <a href={notebookId ? `/tools/visual/images/${notebookId}` : '#'} className="tool-link">2.2 Imágenes</a>
              </div>
            )}
          </div>

          {/* Auditivos */}
          <div className="tool-category">
            <div 
              className="category-header" 
              onClick={() => toggleCategory('audio')}
            >
              <h3>3. Auditivos</h3>
              <i className={`fas fa-chevron-${activeCategory === 'audio' ? 'down' : 'right'}`}></i>
            </div>
            {activeCategory === 'audio' && (
              <div className="category-items">
                <a href={notebookId ? `/tools/audio/podcast/${notebookId}` : '#'} className="tool-link">3.1 Podcast</a>
                <a href={notebookId ? `/tools/audio/song/${notebookId}` : '#'} className="tool-link">3.2 Canción</a>
              </div>
            )}
          </div>

          {/* Evaluación */}
          <div className="tool-category">
            <div 
              className="category-header" 
              onClick={() => toggleCategory('evaluation')}
            >
              <h3>4. Evaluación</h3>
              <i className={`fas fa-chevron-${activeCategory === 'evaluation' ? 'down' : 'right'}`}></i>
            </div>
            {activeCategory === 'evaluation' && (
              <div className="category-items">
                <a href={notebookId ? `/tools/evaluation/flashcards/${notebookId}` : '#'} className="tool-link">4.1 Fichas</a>
                <a href={notebookId ? `/tools/evaluation/quiz/${notebookId}` : '#'} className="tool-link">4.2 Quiz</a>
              </div>
            )}
          </div>
        </div>
      )}
    </aside>
  );
};

export default ToolsMenu;