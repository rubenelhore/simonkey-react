// src/pages/Notebooks.tsx
import { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useNavigate } from 'react-router-dom';
import { useNotebooks } from '../hooks/useNotebooks';
import NotebookList from '../components/NotebookList';
import NotebookForm from '../components/NotebookForm';
import { auth } from '../services/firebase';
import { signOut } from 'firebase/auth';
import '../styles/Notebooks.css';
import StreakTracker from '../components/StreakTracker';

const Notebooks: React.FC = () => {
  const [user] = useAuthState(auth);
  const { notebooks, loading, error } = useNotebooks();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      setUserEmail(user.email);
    }
  }, [user]);

  const handleCreate = async () => {
    console.log("Notebook created successfully");
  };

  const handleDelete = (id: string) => {
    console.log(`Notebook with id ${id} deleted successfully`);
  };

  const handleLogout = async () => {
    await signOut(auth);
    // Añadir un pequeño delay antes de navegar
    setTimeout(() => {
      navigate('/');
    }, 100);
  };
  const toggleMenu = () => {
    setMenuOpen(prevState => !prevState);
    // Prevenir scroll cuando el menú está abierto
    if (!menuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Cargando tus cuadernos...</p>
      </div>
    );
  }

  if (error) {
    console.error("Error loading notebooks:", error);
    return (
      <div className="error-container">
        <p>Ocurrió un error al cargar los cuadernos. Por favor, intenta de nuevo.</p>
      </div>
    );
  }

  return (
    <div className={`notebooks-container ${menuOpen ? 'menu-open' : ''}`}>
      <header className="notebooks-header">
        <div className="header-content">
          <div className="logo-title-group">
            <img
              src="/img/favicon.svg"
              alt="Logo Simonkey"
              className="logo-img"
              width="24"
              height="24"
            />
            <h1>
              <span style={{ color: 'black' }}>Simon</span>
              <span style={{ color: '#6147FF' }}>key</span>
            </h1>
          </div>
          
          <button className="notebooks-hamburger-btn" aria-label="Menú" onClick={toggleMenu}>
            <span className="notebooks-hamburger-line"></span>
            <span className="notebooks-hamburger-line"></span>
            <span className="notebooks-hamburger-line"></span>
          </button>
          
          <div className={`user-section ${menuOpen ? 'mobile-menu' : ''}`} style={{ fontFamily: 'Poppins, sans-serif' }}>
            {userEmail && <p className="user-email hide-on-mobile">{userEmail}</p>}
            <button className="logout-button hide-on-mobile" onClick={handleLogout} style={{ fontFamily: 'Poppins, sans-serif' }}>
              <i className="fas fa-sign-out-alt"></i> Cerrar sesión
            </button>
          </div>
        </div>
      </header>
      
      <main className="notebooks-main">
        <div className="left-column">
          <div className={`create-section ${menuOpen ? 'mobile-menu' : ''}`}>
            <h2>Crear nuevo cuaderno</h2>
            <NotebookForm onCreate={handleCreate} />
          </div>
          
          {/* Nuevo componente de racha */}
          <StreakTracker />
        </div>
        
        <div className="notebooks-list-section">
          <h2>Mis cuadernos</h2>
          {notebooks && notebooks.length === 0 ? (
            <div className="empty-state">
              <p>No tienes cuadernos aún. ¡Crea uno para comenzar!</p>
            </div>
          ) : (
            <NotebookList 
              notebooks={(notebooks || []).map(notebook => ({
                ...notebook,
                createdAt: notebook.createdAt instanceof Date ? 
                  notebook.createdAt : 
                  (notebook.createdAt && typeof notebook.createdAt.toDate === 'function' ? 
                    notebook.createdAt.toDate() : 
                    new Date())
              }))} 
              onDelete={handleDelete} 
            />
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
