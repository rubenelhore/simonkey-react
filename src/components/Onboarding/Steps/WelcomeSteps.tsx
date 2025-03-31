// src/components/Onboarding/Steps/WelcomeStep.jsx
import React from 'react';

const WelcomeStep = () => {
  return (
    <div className="onboarding-step welcome-step">
      <div className="step-illustration">
        <img src="/img/welcome-illustration.svg" alt="Bienvenido a Simonkey" />
      </div>
      <h1>¡Bienvenido a Simonkey!</h1>
      <p className="step-description">
        Tu asistente de estudio personalizado con IA. 
        Descubre una nueva forma de aprender, más eficiente y adaptada a ti.
      </p>
      <div className="feature-highlights">
        <div className="feature">
          <i className="fas fa-brain"></i>
          <span>Estudio inteligente</span>
        </div>
        <div className="feature">
          <i className="fas fa-bolt"></i>
          <span>Aprendizaje rápido</span>
        </div>
        <div className="feature">
          <i className="fas fa-chart-line"></i>
          <span>Seguimiento de progreso</span>
        </div>
      </div>
    </div>
  );
};

export default WelcomeStep;

// src/components/Onboarding/Steps/NotebooksStep.jsx
import React from 'react';

const NotebooksStep = () => {
  return (
    <div className="onboarding-step notebooks-step">
      <div className="step-illustration">
        <img src="/img/notebooks-illustration.svg" alt="Cuadernos en Simonkey" />
      </div>
      <h2>Organiza tu conocimiento en cuadernos</h2>
      <p className="step-description">
        Los cuadernos te permiten organizar tus materias y temas de estudio. 
        Crea cuadernos para cada asignatura o proyecto.
      </p>
      <div className="step-features">
        <div className="step-feature">
          <div className="feature-icon">
            <i className="fas fa-plus-circle"></i>
          </div>
          <div className="feature-text">
            <h3>Crea cuadernos fácilmente</h3>
            <p>Organiza tu estudio por materias, temas o proyectos</p>
          </div>
        </div>
        <div className="step-feature">
          <div className="feature-icon">
            <i className="fas fa-palette"></i>
          </div>
          <div className="feature-text">
            <h3>Personalízalos con colores</h3>
            <p>Distingue tus cuadernos con diferentes colores</p>
          </div>
        </div>
        <div className="step-feature">
          <div className="feature-icon">
            <i className="fas fa-share-alt"></i>
          </div>
          <div className="feature-text">
            <h3>Comparte tu conocimiento</h3>
            <p>Colabora con otros estudiantes compartiendo tus cuadernos</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotebooksStep;

// src/components/Onboarding/Steps/ConceptsStep.jsx
import React from 'react';

const ConceptsStep = () => {
  return (
    <div className="onboarding-step concepts-step">
      <div className="step-illustration">
        <img src="/img/concepts-illustration.svg" alt="Conceptos en Simonkey" />
      </div>
      <h2>Extrae conceptos con IA</h2>
      <p className="step-description">
        Nuestra IA analiza tus documentos y extrae automáticamente los conceptos más importantes, 
        ahorrándote tiempo y esfuerzo.
      </p>
      <div className="concept-demo">
        <div className="document-preview">
          <div className="doc-icon">
            <i className="far fa-file-alt"></i>
          </div>
          <div className="doc-info">
            <span className="doc-name">historia_arte.pdf</span>
            <span className="doc-pages">12 páginas</span>
          </div>
        </div>
        <div className="extraction-arrow">
          <i className="fas fa-arrow-right"></i>
        </div>
        <div className="concepts-preview">
          <div className="concept-card">Renacimiento</div>
          <div className="concept-card">Barroco</div>
          <div className="concept-card">Impresionismo</div>
          <div className="concept-card">+12 más</div>
        </div>
      </div>
      <div className="extraction-benefits">
        <div className="benefit">
          <i className="fas fa-clock"></i>
          <span>Ahorra tiempo</span>
        </div>
        <div className="benefit">
          <i className="fas fa-check-circle"></i>
          <span>Extracción precisa</span>
        </div>
        <div className="benefit">
          <i className="fas fa-edit"></i>
          <span>Personalizable</span>
        </div>
      </div>
    </div>
  );
};

export default ConceptsStep;

// src/components/Onboarding/Steps/StudyToolsStep.jsx
import React from 'react';

const StudyToolsStep = () => {
  return (
    <div className="onboarding-step tools-step">
      <div className="step-illustration">
        <img src="/img/tools-illustration.svg" alt="Herramientas de estudio" />
      </div>
      <h2>Herramientas poderosas para aprender</h2>
      <p className="step-description">
        Simonkey ofrece diversas herramientas para ayudarte a memorizar y comprender conceptos de forma más efectiva.
      </p>
      <div className="tools-grid">
        <div className="tool-card">
          <div className="tool-icon">
            <i className="fas fa-layer-group"></i>
          </div>
          <h3>Tarjetas de estudio</h3>
          <p>Repasa concepto a concepto con tarjetas interactivas</p>
        </div>
        <div className="tool-card">
          <div className="tool-icon">
            <i className="fas fa-lightbulb"></i>
          </div>
          <h3>Mnemotecnias</h3>
          <p>Técnicas de memorización personalizadas</p>
        </div>
        <div className="tool-card">
          <div className="tool-icon">
            <i className="fas fa-brain"></i>
          </div>
          <h3>Explicaciones</h3>
          <p>IA que explica conceptos según tus intereses</p>
        </div>
        <div className="tool-card">
          <div className="tool-icon">
            <i className="fas fa-chart-line"></i>
          </div>
          <h3>Progreso</h3>
          <p>Sigue tu evolución y mejora constantemente</p>
        </div>
      </div>
      <p className="ready-text">
        ¡Estás listo para comenzar a estudiar de manera más inteligente!
      </p>
    </div>
  );
};

export default StudyToolsStep;