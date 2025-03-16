import React, { useState } from 'react';
import { Link } from 'react-router-dom'; // Si planeas usar React Router, de lo contrario usa <a>
import './Header.css'; // Crearemos este archivo de estilos más adelante

const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    if (isMenuOpen) setIsMenuOpen(false);
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
            <Link to="#features" className="nav-link" onClick={closeMenu}>
              Características
            </Link>
            <Link to="#how-it-works" className="nav-link" onClick={closeMenu}>
              Cómo funciona
            </Link>
            <Link to="/pricing" className="nav-link" onClick={closeMenu}>
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