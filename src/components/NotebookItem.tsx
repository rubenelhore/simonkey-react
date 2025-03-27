// src/components/NotebookItem.tsx
import { useNavigate } from 'react-router-dom';
import { deleteNotebook } from '../services/notebookService';
import { useState } from 'react';

interface NotebookItemProps {
  id: string;
  title: string;
  onDelete: (id: string) => void;
  // Se actualiza la firma de onEdit para recibir el nuevo título
  onEdit?: (id: string, newTitle: string) => void;
}

const NotebookItem: React.FC<NotebookItemProps> = ({ id, title, onDelete, onEdit }) => {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [editableTitle, setEditableTitle] = useState(title);

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm("¿Estás seguro de que deseas eliminar este cuaderno?")) {
      await deleteNotebook(id);
      onDelete(id);
    }
  };

  const handleView = () => {
    navigate(`/notebooks/${id}`);
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditableTitle(e.target.value);
  };

  const handleSave = () => {
    setIsEditing(false);
    if (onEdit) {
      onEdit(id, editableTitle);  // Este callback ahora actualizará Firestore
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSave();
    }
  };

  return (
    <div className="notebook-card">
      <div 
        className="notebook-card-content" 
        onClick={handleView}
        style={{ cursor: 'pointer' }}
      >
        {isEditing ? (
          <input 
            type="text"
            value={editableTitle}
            onChange={handleTitleChange}
            onKeyDown={handleKeyDown}
            onBlur={handleSave}
            autoFocus
          />
        ) : (
          <h3>{editableTitle}</h3>
        )}
      </div>
      <div className="notebook-card-actions">
        <button onClick={handleView} className="action-view" title="Ver cuaderno">
          <i className="fas fa-eye"></i>
        </button>
        <button onClick={handleEditClick} className="action-edit" title="Editar nombre">
          <i className="fas fa-pencil-alt"></i>
        </button>
        <button onClick={handleDelete} className="action-delete" title="Eliminar cuaderno">
          <i className="fas fa-trash"></i>
        </button>
      </div>
    </div>
  );
};

export default NotebookItem;