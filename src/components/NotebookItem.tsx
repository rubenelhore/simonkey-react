// src/components/NotebookItem.tsx
import { deleteNotebook } from '../services/notebookService';

interface NotebookItemProps {
  id: string;
  title: string;
  onDelete: (id: string) => void;
}

const NotebookItem: React.FC<NotebookItemProps> = ({ id, title, onDelete }) => {
  const handleDelete = async () => {
    await deleteNotebook(id);
    onDelete(id); // Update the UI by removing the notebook
  };

  return (
    <div className="notebook-item">
      <span>{title}</span>
      <button onClick={handleDelete}>Delete</button>
    </div>
  );
};

export default NotebookItem;