// src/components/NotebookForm.tsx
import { useState } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../services/firebase';
import { createNotebook } from '../services/notebookService';

interface NotebookFormProps {
  onCreate: () => void; // Callback to refresh the notebook list
}

const NotebookForm: React.FC<NotebookFormProps> = ({ onCreate }) => {
  const [title, setTitle] = useState('');
  const [user] = useAuthState(auth);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !title) return;
    await createNotebook(user.uid, title);
    setTitle(''); // Clear the form
    onCreate(); // Refresh the notebook list
  };

  return (
    <form onSubmit={handleSubmit} className="notebook-form">
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Ingresa el nombre"
        required
        style={{ fontFamily: "'Poppins', sans-serif" }}
      />
      <button type="submit" style={{ fontFamily: "'Poppins', sans-serif" }}>
        Crear Cuaderno
      </button>
    </form>
  );
};

export default NotebookForm;