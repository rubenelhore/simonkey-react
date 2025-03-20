import React, { useEffect, useState, createContext } from 'react';
import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import './App.css';
import Header from './components/Header';
import Hero from './components/Hero';
import Features from './components/Features';
import HowItWorks from './components/HowItWorks';
import CTA from './components/CTA';
import Footer from './components/Footer';
import Pricing from './pages/Pricing';
import SimonkeyCarousel from './components/SimonkeyCarousel';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import Notebook from './pages/Notebook'; // Importamos la página de Notebooks
import { useAuthState } from 'react-firebase-hooks/auth'; // Firebase hook para el estado de autenticación
import { auth } from './services/firebase'; // Importamos auth desde el archivo firebase.ts modificado

// Definir el tipo para el usuario
interface User {
  id?: string;
  name?: string;
  email?: string;
  photoURL?: string;
  isAuthenticated: boolean;
}

// Crear el contexto para el usuario
export const UserContext = createContext<{
  user: User;
  setUser: React.Dispatch<React.SetStateAction<User>>;
}>({
  user: { isAuthenticated: false },
  setUser: () => {},
});


// Un componente wrapper que no usa hooks de React Router
const HomePage: React.FC = () => {
  return <HomePageContent />;
};

// Componente que usa los hooks de React Router
const HomePageContent: React.FC = () => {
  const location = useLocation();
  const images = [
    { id: 1, src: '/img/image1.jpg', alt: 'Image 1' },
    { id: 2, src: '/img/image2.jpg', alt: 'Image 2' },
    { id: 3, src: '/img/image3.jpg', alt: 'Image 3' },
    { id: 4, src: '/img/image4.jpg', alt: 'Image 4' },
    { id: 5, src: '/img/image5.jpg', alt: 'Image 5' },
    { id: 6, src: '/img/image6.jpg', alt: 'Image 6' },
    { id: 7, src: '/img/image7.jpg', alt: 'Image 7' },
    { id: 8, src: '/img/image8.jpg', alt: 'Image 8' },
    { id: 9, src: '/img/image9.jpg', alt: 'Image 9' },
  ];

  

  useEffect(() => {
    // Comprobar si hay un hash en la URL o un elemento guardado en localStorage
    const hash = location.hash.replace('#', '');
    const savedSection = localStorage.getItem('scrollTo');
    
    if (hash || savedSection) {
      const targetId = hash || savedSection || '';
      setTimeout(() => {
        const element = document.getElementById(targetId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
        // Limpiar localStorage después de usar
        if (savedSection) {
          localStorage.removeItem('scrollTo');
        }
      }, 100); // Pequeño retraso para asegurar que los componentes estén renderizados
    }
  }, [location]);

  return (
    <div>
      <Header />
      <Hero />
      <SimonkeyCarousel images={images} />
      <div id="features">
        <Features />
      </div>
      <div id="how-it-works">
        <HowItWorks />
      </div>
      <CTA />
      <Footer />
    </div>
  );
};

const App: React.FC = () => {
  // Estado para gestionar la información del usuario
  const [user, setUser] = useState<User>({
    isAuthenticated: false
  });
  
  // Usamos el hook de Firebase para la autenticación
  const [firebaseUser, firebaseLoading] = useAuthState(auth);
  
  // Efecto para verificar si hay un usuario en Firebase al cargar la aplicación
  useEffect(() => {
    if (!firebaseLoading) {
      if (firebaseUser) {
        // Usuario autenticado
        const userData = {
          id: firebaseUser.uid,
          email: firebaseUser.email || undefined,
          name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || undefined,
          photoURL: firebaseUser.photoURL || undefined,
          isAuthenticated: true
        };
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
      } else {
        // Usuario no autenticado
        setUser({ isAuthenticated: false });
        localStorage.removeItem('user');
      }
    }
  }, [firebaseUser, firebaseLoading]);

  if (firebaseLoading) {
    return <div>Cargando...</div>;
  }

  return (
    <UserContext.Provider value={{ user, setUser }}>
      <BrowserRouter>
        <Routes>
          {/* Ruta principal: redirige a /notebooks si está autenticado */}
          <Route 
            path="/" 
            element={user.isAuthenticated ? <Navigate to="/notebooks" /> : <HomePage />} 
          />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          
          {/* Ruta protegida para notebooks */}
          <Route
            path="/notebooks"
            element={user.isAuthenticated ? <Notebook /> : <Navigate to="/login" />}
          />
        </Routes>
      </BrowserRouter>
    </UserContext.Provider>
  );
};

export default App;