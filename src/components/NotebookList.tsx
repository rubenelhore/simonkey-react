// src/components/NotebookList.tsx
import React from 'react';
import NotebookItem from './NotebookItem';

interface Notebook {
  id: string;
  title: string;
  createdAt: Date;
  userId: string;
}

interface NotebookListProps {
  notebooks: Notebook[];
  onDelete: (id: string) => void;
  onEdit?: (id: string, newTitle: string) => void;
}

const NotebookList: React.FC<NotebookListProps> = ({ notebooks, onDelete, onEdit }) => {
  return (
    <div className="notebook-grid">
      {notebooks.map(notebook => (
        <NotebookItem 
          key={notebook.id} 
          id={notebook.id} 
          title={notebook.title} 
          onDelete={onDelete} 
          onEdit={onEdit} 
        />
      ))}
    </div>
  );
};

export default NotebookList;