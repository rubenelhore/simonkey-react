import React, { useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import './Pricing.css'; // Estilos existentes

const Pricing: React.FC = () => {
  const [showAnnual, setShowAnnual] = useState(false);
  const [activeQuestion, setActiveQuestion] = useState<number | null>(null);

  const togglePricing = () => {
    setShowAnnual(!showAnnual);
  };

  const toggleFAQ = (index: number) => {
    setActiveQuestion(activeQuestion === index ? null : index);
  };

  return (
    <div>
      <Header />
      {/* Pricing Hero Section */}
      <section className="pricing-hero">
        <div className="container">
          <h1 className="pricing-title">Planes simples, transparentes y a tu medida</h1>
          <p className="pricing-subtitle">
            Elige el plan que mejor se adapte a tus necesidades de estudio. Sin sorpresas, sin complicaciones.
          </p>
          <div className="pricing-toggle">
            <span className={`toggle-label toggle-monthly ${!showAnnual ? 'active' : ''}`}>
              Mensual
            </span>
            <label className="toggle-switch">
              <input type="checkbox" id="billing-toggle" onChange={togglePricing} />
              <span className="toggle-slider"></span>
            </label>
            <span className={`toggle-label toggle-annually ${showAnnual ? 'active' : ''}`}>
              Anual
            </span>
            <span className="savings-badge">Ahorra 20%</span>
          </div>
        </div>
      </section>

      {/* Pricing Plans Section */}
      <section className="pricing-plans">
        <div className="container">
          <div className="plans-container">
            <div className="plan-card">
              <div className="plan-header">
                <h3 className="plan-name">Gratis</h3>
                <div className="plan-price">
                  <span className="plan-price-currency">$</span>
                  0
                  <span className="plan-price-period">/mes</span>
                </div>
                <p className="plan-description">Ideal para probar Simonkey y sus herramientas básicas.</p>
              </div>
              <div className="plan-features">
                <ul className="feature-list">
                  <li className="feature-item">
                    <span className="feature-icon">✔</span>
                    <span className="feature-text prominent">Acceso a 4 cuadernos</span>
                  </li>
                  <li className="feature-item">
                    <span className="feature-icon">✔</span>
                    <span className="feature-text">100,000 tokens de IA</span>
                  </li>
                  <li className="feature-item">
                    <span className="feature-icon">✔</span>
                    <span className="feature-text">Extracción de  contenido con IA</span>
                  </li>
                  <li className="feature-item">
                    <span className="feature-icon">✔</span>
                    <span className="feature-text">Mnemotecnias básicas</span>
                  </li>
                </ul>
              </div>
              <div className="plan-footer">
                <a href="#" className="btn btn-outline btn-block">
                  Comenzar Gratis
                </a>
              </div>
            </div>
            <div className="plan-card popular">
              <div className="popular-badge">Más Popular</div>
              <div className="plan-header">
                <h3 className="plan-name">Pro</h3>
                <div className="plan-price">
                  <span className="plan-price-currency">$</span>
                  <span className={showAnnual ? 'annual-price' : 'monthly-price'}>
                    {showAnnual ? '7.99' : '9.99'}
                  </span>
                  <span className="plan-price-period">{showAnnual ? '/año' : '/mes'}</span>
                </div>
                <p className="plan-description">Perfecto para estudiantes que buscan herramientas avanzadas.</p>
              </div>
              <div className="plan-features">
                <ul className="feature-list">
                  <li className="feature-item">
                    <span className="feature-icon">✔</span>
                    <span className="feature-text prominent">Cuadernos ilimitados</span>
                  </li>
                  <li className="feature-item">
                    <span className="feature-icon">✔</span>
                    <span className="feature-text">Todo del plan Gratis</span>
                  </li>
                  <li className="feature-item">
                    <span className="feature-icon">✔</span>
                    <span className="feature-text">1 millón de tokens de IA al mes</span>
                  </li>
                  <li className="feature-item">
                    <span className="feature-icon">✔</span>
                    <span className="feature-text">Mnemotecnias avanzadas con IA</span>
                  </li>
                  <li className="feature-item">
                    <span className="feature-icon">✔</span>
                    <span className="feature-text">Soporte prioritario</span>
                  </li>
                </ul>
              </div>
              <div className="plan-footer">
                <a href="#" className="btn btn-primary btn-block">
                  Elegir Pro
                </a>
              </div>
            </div>
            <div className="plan-card">
              <div className="plan-header">
                <h3 className="plan-name">Escolar</h3>
                <div className="plan-price">
                  <span className="plan-price-currency">$</span>
                  <span className={showAnnual ? 'annual-price' : 'monthly-price'}>
                    {showAnnual ? '5.99' : '7.99'}
                  </span>
                  <span className="plan-price-period">{showAnnual ? '/año' : '/mes'}</span>
                </div>
                <p className="plan-description">Ideal para Instituciones. Precios a partir de 20 alumnos.</p>
              </div>
              <div className="plan-features">
                <ul className="feature-list">
                  <li className="feature-item">
                    <span className="feature-icon">✔</span>
                    <span className="feature-text prominent">Analítica avanzada para Instituciones</span>
                  </li>
                  <li className="feature-item">
                    <span className="feature-icon">✔</span>
                    <span className="feature-text">Todo del plan Pro</span>
                  </li>
                  <li className="feature-item">
                    <span className="feature-icon">✔</span>
                    <span className="feature-text">Contenido exclusivo de la comunidad</span>
                  </li>
                  <li className="feature-item">
                    <span className="feature-icon">✔</span>
                    <span className="feature-text">Soporte 24/7</span>
                  </li>
                </ul>
              </div>
              <div className="plan-footer">
                <a href="#" className="btn btn-primary btn-block">
                  Elegir Escolar
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison Section */}
      <section className="comparison">
        <div className="container">
          <h2 className="comparison-title">Compara nuestros planes</h2>
          <table className="comparison-table">
            <thead>
              <tr>
                <th></th>
                <th>Gratis</th>
                <th>Pro</th>
                <th>Escolar</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Cuadernos digitales</td>
                <td>4</td>
                <td>Ilimitados</td>
                <td>Ilimitados</td>
              </tr>
              <tr>
                <td>Tokens de IA</td>
                <td>100,000</td>
                <td>1,000,000 mensuales</td>
                <td>1,000,000 mensuales</td>
              </tr>
              <tr>
                <td>Mnemotecnias</td>
                <td>Limitadas</td>
                <td>Avanzadas con IA</td>
                <td>Avanzadas con IA</td>
              </tr>
              <tr>
                <td>Herramientas de Estudio</td>
                <td>Limitadas</td>
                <td>Avanzadas con IA</td>
                <td>Avanzadas con IA</td>
              </tr>
              <tr>
                <td>Análisis de progreso</td>
                <td>-</td>
                <td>Detallado</td>
                <td>Detallado</td>
              </tr>
              <tr>
                <td>Acceso multiplataforma</td>
                <td>-</td>
                <td>✔</td>
                <td>✔</td>
              </tr>
              <tr>
                <td>Contenido comunitario</td>
                <td>-</td>
                <td>-</td>
                <td>✔</td>
              </tr>
              <tr>
                <td>Analítica avanzada para Instituciones</td>
                <td>-</td>
                <td>-</td>
                <td>✔</td>
              </tr>
              <tr>
                <td>Soporte</td>
                <td>Prioritario</td>
                <td>Prioritario</td>
                <td>24/7</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="faq">
        <div className="container">
          <h2 className="faq-title">Preguntas Frecuentes</h2>
          <div className="faq-list">
            <div className="faq-item">
              <div
                className="faq-question"
                onClick={() => toggleFAQ(0)}
              >
                <span className="faq-question-text">
                  ¿Puedo cambiar de plan en cualquier momento?
                </span>
              </div>
              <div
                className="faq-answer"
                style={{ display: activeQuestion === 0 ? 'block' : 'none' }}
              >
                Sí, puedes actualizar o cambiar tu plan en cualquier momento. Si actualizas a un plan superior, se te cobrará la diferencia prorrateada por el tiempo restante de tu suscripción actual. Si cambias a un plan inferior, el nuevo plan entrará en vigor al final de tu ciclo de facturación actual.
              </div>
            </div>
            
            <div className="faq-item">
              <div
                className="faq-question"
                onClick={() => toggleFAQ(1)}
              >
                <span className="faq-question-text">
                  ¿Cómo funciona el período de prueba?
                </span>
              </div>
              <div
                className="faq-answer"
                style={{ display: activeQuestion === 1 ? 'block' : 'none' }}
              >
                Todos los planes de pago incluyen un período de prueba gratuito de 14 días. No se te cobrará hasta que finalice el período de prueba, y puedes cancelar en cualquier momento antes de que termine sin ningún cargo.
              </div>
            </div>
            
            <div className="faq-item">
              <div
                className="faq-question"
                onClick={() => toggleFAQ(2)}
              >
                <span className="faq-question-text">
                  ¿Qué métodos de pago aceptan?
                </span>
              </div>
              <div
                className="faq-answer"
                style={{ display: activeQuestion === 2 ? 'block' : 'none' }}
              >
                Aceptamos tarjetas de crédito y débito (Visa, Mastercard, American Express), PayPal y, en algunos países, opciones de pago locales como transferencia bancaria.
              </div>
            </div>

            <div className="faq-item">
              <div
                className="faq-question"
                onClick={() => toggleFAQ(3)}
              >
                <span className="faq-question-text">
                  ¿Puedo cancelar mi suscripción en cualquier momento?
                </span>
              </div>
              <div
                className="faq-answer"
                style={{ display: activeQuestion === 3 ? 'block' : 'none' }}
              >
                Sí, puedes cancelar tu suscripción en cualquier momento desde la configuración de tu cuenta. Si cancelas, mantendrás el acceso a las características de tu plan hasta el final del período de facturación actual.
              </div>
            </div>

            <div className="faq-item">
              <div
                className="faq-question"
                onClick={() => toggleFAQ(4)}
              >
                <span className="faq-question-text">
                  ¿Qué pasa con mis datos si cancelo mi suscripción?
                </span>
              </div>
              <div
                className="faq-answer"
                style={{ display: activeQuestion === 4 ? 'block' : 'none' }}
              >
                Si cancelas tu suscripción de pago, tu cuenta se convertirá automáticamente al plan Básico gratuito. Podrás seguir accediendo a tus datos, aunque algunas funciones premium ya no estarán disponibles. Si deseas eliminar completamente tu cuenta y todos tus datos, puedes hacerlo desde la configuración de tu cuenta.
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Pricing;