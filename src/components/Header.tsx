import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom'; // Añadimos useLocation
import './Header.css';

const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation(); // Usamos el hook useLocation para acceder a la ubicación actual

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    if (isMenuOpen) setIsMenuOpen(false);
  };

  // Función para manejar el scroll a secciones específicas
  const scrollToSection = (sectionId: string) => {
    closeMenu();
    
    // Si estamos en la página principal
    if (location.pathname === '/') {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      // Si estamos en otra página, navegamos a la página principal y luego al elemento
      // Guardamos la sección objetivo en localStorage para usarla después de la navegación
      localStorage.setItem('scrollTo', sectionId);
      window.location.href = '/#' + sectionId;
    }
  };

  return (
    <header className="header">
      <div className="header-container">
        <nav className={`nav ${isMenuOpen ? 'menu-open' : ''}`}>
          <Link to="/" className="logo" onClick={closeMenu}>
            <img
              src="/img/favicon.svg"
              alt="Logo Simonkey"
              className="logo-img"
              width="24"
              height="24"
            />
            <span className="logo-text">
              <span style={{ color: 'black' }}>Simon</span>
              <span style={{ color: '#6147FF' }}>key</span>
            </span>
          </Link>
          <button className="hamburger-btn" aria-label="Menú" onClick={toggleMenu}>
            <span className="hamburger-line"></span>
            <span className="hamburger-line"></span>
            <span className="hamburger-line"></span>
          </button>
            <div className="nav-links">
            {/* Usando Link con onClick para mantener consistencia de estilo */}
            <Link to="/#features" className="nav-link" onClick={(e) => {
              e.preventDefault();
              scrollToSection('features');
            }}>
              Características
            </Link>
            <Link to="/#how-it-works" className="nav-link" onClick={(e) => {
              e.preventDefault(); 
              scrollToSection('how-it-works');
            }}>
              Cómo funciona
            </Link>
            <Link to="/pricing#header" className="nav-link" onClick={(e) => {
              e.preventDefault();
              // Si estamos en la página de pricing, scroll a la sección header
              if (location.pathname === '/pricing') {
              const element = document.getElementById('header');
              if (element) {
                element.scrollIntoView({ behavior: 'smooth' });
              }
              } else {
              // Si no, navega a pricing con el hash #header
              window.location.href = '/pricing#header';
              }
              closeMenu();
            }}>
              Precios
            </Link>
            </div>
          <div className="auth-buttons">
            <a href="#" className="btn btn-outline" onClick={closeMenu}>
              Iniciar Sesión
            </a>
            <a href="#" className="btn btn-primary" onClick={closeMenu}>
              Registrarse
            </a>
          </div>
        </nav>
      </div>
    </header>
  );
};

export default Header;