// src/components/NotebookItem.tsx
import { useNavigate } from 'react-router-dom';
import { deleteNotebook } from '../services/notebookService';

interface NotebookItemProps {
  id: string;
  title: string;
  onDelete: (id: string) => void;
}

const NotebookItem: React.FC<NotebookItemProps> = ({ id, title, onDelete }) => {
  const navigate = useNavigate();

  const handleDelete = async (e: React.MouseEvent) => {
    // Stop propagation to prevent navigation when clicking delete
    e.stopPropagation();
    if (window.confirm("¿Estás seguro de que deseas eliminar este cuaderno?")) {
      await deleteNotebook(id);
      onDelete(id); // Update the UI by removing the notebook
    }
  };

  const handleView = () => {
    navigate(`/notebooks/${id}`);
  };

  return (
    <div className="notebook-card">
      <div 
        className="notebook-card-content" 
        onClick={handleView}
        style={{ cursor: 'pointer' }}
      >
        <h3>{title}</h3>
      </div>
      <div className="notebook-card-actions">
        <button onClick={handleView} className="action-view" title="Ver cuaderno">
          <i className="fas fa-eye"></i>
        </button>
        <button 
          onClick={handleDelete} 
          className="action-delete" 
          title="Eliminar cuaderno"
        >
          <i className="fas fa-trash"></i>
        </button>
      </div>
    </div>
  );
};

export default NotebookItem;