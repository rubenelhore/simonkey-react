// src/pages/Notebooks.tsx
import { useState } from 'react';
import { useNotebooks } from '../hooks/useNotebooks';
import NotebookList from '../components/NotebookList';
import NotebookForm from '../components/NotebookForm';
import { auth } from '../services/firebase';
import { signOut } from 'firebase/auth';

const Notebooks: React.FC = () => {
  const { notebooks, loading } = useNotebooks();
  const [notebookList, setNotebookList] = useState(notebooks);

  // Update the list when a notebook is created or deleted
  const handleCreate = () => {
    setNotebookList([...notebookList]); // Trigger a re-render (or refetch)
  };

  const handleDelete = (id: string) => {
    setNotebookList(notebookList.filter((notebook) => notebook.id !== id));
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="notebooks-page">
      <h1>Simonkey Notebooks</h1>
      <button onClick={handleLogout}>Logout</button>
      <NotebookForm onCreate={handleCreate} />
      <NotebookList notebooks={notebookList} onDelete={handleDelete} />
    </div>
  );
};

export default Notebooks;