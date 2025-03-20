// src/components/NotebookList.tsx
import NotebookItem from './NotebookItem';

interface Notebook {
  id: string;
  title: string;
  userId: string;
  createdAt: Date;
}

interface NotebookListProps {
  notebooks: Notebook[];
  onDelete: (id: string) => void;
}

const NotebookList: React.FC<NotebookListProps> = ({ notebooks, onDelete }) => {
  return (
    <div className="notebook-list">
      {notebooks.length === 0 ? (
        <p>No notebooks yet. Create one to get started!</p>
      ) : (
        notebooks.map((notebook) => (
          <NotebookItem
            key={notebook.id}
            id={notebook.id}
            title={notebook.title}
            onDelete={onDelete}
          />
        ))
      )}
    </div>
  );
};

export default NotebookList;