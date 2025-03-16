import React from 'react';
import './CTA.css'; // Estilos que crearemos a continuación

const CTA: React.FC = () => {
  return (
    <section className="cta">
      <div className="container">
        <h2 className="cta-title">Comienza a estudiar de forma más inteligente</h2>
        <p className="cta-description">
          Únete a miles de estudiantes que ya están mejorando su forma de aprender con Simonkey.
        </p>
        <a href="#" className="btn btn-white">
          Registrarse Gratis
        </a>
      </div>
    </section>
  );
};

export default CTA;