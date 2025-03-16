import React from 'react';
import './Features.css'; // Estilos que crearemos a continuación

const Features: React.FC = () => {
  return (
    <section className="features">
      <div className="container">
        <h2 className="section-title">Características</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.122 2.122"
                />
              </svg>
            </div>
            <h3 className="feature-title">Mnemotecnias Personalizadas</h3>
            <p className="feature-description">
              Aprende más rápido con técnicas de memorización personalizadas: historias, canciones e imágenes creadas por IA.
            </p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z"
                />
              </svg>
            </div>
            <h3 className="feature-title">Análisis de Progreso</h3>
            <p className="feature-description">
              Visualiza tu progreso de estudio y recibe recomendaciones personalizadas para mejorar tu aprendizaje.
            </p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h3 className="feature-title">Acceso Multiplataforma</h3>
            <p className="feature-description">
              Estudia desde cualquier dispositivo y en cualquier momento. Tus cuadernos siempre sincronizados.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Features;