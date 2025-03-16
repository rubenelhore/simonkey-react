import React from 'react';
import './HowItWorks.css'; // Estilos que crearemos a continuación

const HowItWorks: React.FC = () => {
  return (
    <section className="how-it-works" id="how-it-works">
      <div className="container">
        <h2 className="section-title">Cómo funciona Simonkey</h2>
        <div className="steps">
          <div className="step">
            <div className="step-number">1</div>
            <div className="step-content">
              <h3 className="step-title">Crea tu cuaderno digital</h3>
              <p className="step-description">
                Crea un nuevo cuaderno para la materia o tema que deseas estudiar. Simonkey te permite organizar tus estudios por áreas específicas.
              </p>
            </div>
          </div>
          <div className="step">
            <div className="step-number">2</div>
            <div className="step-content">
              <h3 className="step-title">Importa tus materiales</h3>
              <p className="step-description">
                Sube documentos, comparte enlaces o incluso pide a Simonkey que investigue en internet. La IA extraerá automáticamente los conceptos más importantes.
              </p>
            </div>
          </div>
          <div className="step">
            <div className="step-number">3</div>
            <div className="step-content">
              <h3 className="step-title">Genera herramientas de estudio</h3>
              <p className="step-description">
                Selecciona los conceptos que quieres aprender y crea herramientas de estudio personalizadas: tarjetas, historias, canciones y mnemotecnias.
              </p>
            </div>
          </div>
          <div className="step">
            <div className="step-number">4</div>
            <div className="step-content">
              <h3 className="step-title">Estudia a tu ritmo</h3>
              <p className="step-description">
                Utiliza las herramientas creadas para estudiar a tu propio ritmo. Practica con exámenes y cuestionarios para reforzar tu aprendizaje.
              </p>
            </div>
          </div>
          <div className="step">
            <div className="step-number">5</div>
            <div className="step-content">
              <h3 className="step-title">Haz seguimiento de tu progreso</h3>
              <p className="step-description">
                Visualiza tu avance en cada concepto y recibe recomendaciones personalizadas sobre qué repasar según tu nivel de dominio.
              </p>
            </div>
          </div>
          <div className="step">
            <div className="step-number">6</div>
            <div className="step-content">
              <h3 className="step-title">Conecta con la comunidad</h3>
              <p className="step-description">
                Comparte cuadernos con otros estudiantes y accede a material compartido por la comunidad para ampliar tus recursos de estudio.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;