// src/components/Onboarding/Onboarding.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db, auth } from '../../services/firebase';
import './Onboarding.css';

// Componentes para cada paso
import WelcomeStep from './Steps/WelcomeStep';
import NotebooksStep from './Steps/NotebooksStep';
import ConceptsStep from './Steps/ConceptsStep';
import StudyToolsStep from './Steps/StudyToolsStep';

interface OnboardingProps {
  // Add any props your component needs
  // For example:
  // step?: number;
  // onComplete?: () => void;
}

const Onboarding: React.FC<OnboardingProps> = (props) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Verificar si el usuario ya ha visto el onboarding
    const checkOnboardingStatus = async () => {
      try {
        if (auth.currentUser) {
          const userDocRef = doc(db, 'users', auth.currentUser.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists() && userDoc.data().hasCompletedOnboarding) {
            setHasSeenOnboarding(true);
            // Redirigir a notebooks si ya completó el onboarding
            navigate('/notebooks');
          }
        }
        setIsLoading(false);
      } catch (error) {
        console.error("Error al verificar estado de onboarding:", error);
        setIsLoading(false);
      }
    };

    checkOnboardingStatus();
  }, [navigate]);

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    } else {
      completeOnboarding();
    }
  };

  const handleSkip = () => {
    completeOnboarding();
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const completeOnboarding = async () => {
    try {
      if (auth.currentUser) {
        const userDocRef = doc(db, 'users', auth.currentUser.uid);
        await setDoc(userDocRef, { hasCompletedOnboarding: true }, { merge: true });
      }
      // Redirigir a la página de notebooks
      navigate('/notebooks');
    } catch (error) {
      console.error("Error al completar onboarding:", error);
    }
  };

  // Si está cargando o el usuario ya ha visto el onboarding, no mostrar nada
  if (isLoading) {
    return (
      <div className="onboarding-loading">
        <div className="spinner"></div>
        <p>Cargando...</p>
      </div>
    );
  }

  if (hasSeenOnboarding) {
    return null;
  }

  // Renderiza el paso actual
  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return <WelcomeStep />;
      case 1:
        return <NotebooksStep />;
      case 2:
        return <ConceptsStep />;
      case 3:
        return <StudyToolsStep />;
      default:
        return <WelcomeStep />;
    }
  };

  return (
    <div className="onboarding-container">
      <div className="onboarding-content">
        <div className="step-indicator">
          {[0, 1, 2, 3].map((step) => (
            <div 
              key={step} 
              className={`step-dot ${currentStep === step ? 'active' : ''} ${currentStep > step ? 'completed' : ''}`}
            />
          ))}
        </div>
        
        <div className="step-content">
          {renderStep()}
        </div>
        
        <div className="onboarding-actions">
          {currentStep > 0 && (
            <button onClick={handleBack} className="back-button">
              <i className="fas fa-arrow-left"></i> Atrás
            </button>
          )}
          
          <div className="right-actions">
            <button onClick={handleSkip} className="skip-button">
              Saltar
            </button>
            
            <button onClick={handleNext} className="next-button">
              {currentStep === 3 ? 'Comenzar' : 'Siguiente'} 
              {currentStep < 3 && <i className="fas fa-arrow-right"></i>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;