// src/pages/Notebooks.tsx
import { useState, useEffect } from 'react';
import { useNotebooks } from '../hooks/useNotebooks';
import NotebookList from '../components/NotebookList';
import NotebookForm from '../components/NotebookForm';
import { auth } from '../services/firebase';
import { signOut } from 'firebase/auth';
import '../styles/Notebooks.css';

const Notebooks: React.FC = () => {
  const { notebooks, loading } = useNotebooks();
  const [notebookList, setNotebookList] = useState(notebooks);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    // Set user email when auth state changes
    const user = auth.currentUser;
    if (user) {
      setUserEmail(user.email);
    }
  }, []);

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
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Cargando tus cuadernos...</p>
      </div>
    );
  }

  return (
    <div className="notebooks-container">
      <header className="notebooks-header">
        <div className="header-content">
          <h1>Simonkey <span className="accent">Notebooks</span></h1>
          <div className="user-section">
            {userEmail && <p className="user-email">{userEmail}</p>}
            <button className="logout-button" onClick={handleLogout}>
              <i className="fas fa-sign-out-alt"></i> Cerrar sesión
            </button>
          </div>
        </div>
      </header>
      
      <main className="notebooks-main">
        <div className="create-section">
          <h2>Crear nuevo cuaderno</h2>
          <NotebookForm onCreate={handleCreate} />
        </div>
        
        <div className="notebooks-list-section">
          <h2>Mis cuadernos</h2>
          {notebookList.length === 0 ? (
            <div className="empty-state">
              <p>No tienes cuadernos aún. ¡Crea uno para comenzar!</p>
            </div>
          ) : (
            <NotebookList notebooks={notebookList} onDelete={handleDelete} />
          )}
        </div>
      </main>
      
      <footer className="notebooks-footer">
        <p>&copy; {new Date().getFullYear()} Simonkey - Todos los derechos reservados</p>
      </footer>
    </div>
  );
};

export default Notebooks;