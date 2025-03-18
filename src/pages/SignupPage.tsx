import React, { useState } from 'react';
import './SignupPage.css';
// Importa la imagen de la mascota
import simonLogo from '/img/favicon.svg';

const SignupPage: React.FC = () => {
  const [email, setEmail] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [birthdate, setBirthdate] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    setError(null);
  };
  
  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUsername(e.target.value);
    setError(null);
  };
  
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    setError(null);
  };
  
  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConfirmPassword(e.target.value);
    setError(null);
  };
  
  const handleBirthdateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBirthdate(e.target.value);
    setError(null);
  };
  
  const validateForm = (): boolean => {
    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Ingresa un correo electrónico válido');
      return false;
    }
    
    // Validar nombre de usuario
    if (username.length < 3) {
      setError('El nombre de usuario debe tener al menos 3 caracteres');
      return false;
    }
    
    // Validar contraseña
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return false;
    }
    
    // Validar que las contraseñas coincidan
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return false;
    }
    
    // Validar fecha de nacimiento
    if (!birthdate) {
      setError('Por favor, ingresa tu fecha de nacimiento');
      return false;
    }
    
    // Verificar que sea mayor de 13 años
    const today = new Date();
    const birthdateDate = new Date(birthdate);
    let age = today.getFullYear() - birthdateDate.getFullYear();
    const m = today.getMonth() - birthdateDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthdateDate.getDate())) {
      age--;
    }
    
    if (age < 13) {
      setError('Debes tener al menos 13 años para registrarte');
      return false;
    }
    
    return true;
  };
  
  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    // Simulamos el proceso de carga
    setIsLoading(true);
    
    // Simulamos un registro exitoso después de 1.5 segundos
    setTimeout(() => {
      setIsLoading(false);
      // Para la maqueta, simplemente mostramos un mensaje en la consola
      console.log('Registro exitoso con:', { email, username, password, birthdate });
      alert('Registro exitoso (simulado)');
    }, 1500);
  };
  
  const handleGoogleSignup = () => {
    setIsLoading(true);
    
    // Simulamos un proceso de autenticación
    setTimeout(() => {
      setIsLoading(false);
      console.log('Registro con Google');
      alert('Registro con Google (simulado)');
    }, 1500);
  };
  
  const handleAppleSignup = () => {
    setIsLoading(true);
    
    // Simulamos un proceso de autenticación
    setTimeout(() => {
      setIsLoading(false);
      console.log('Registro con Apple');
      alert('Registro con Apple (simulado)');
    }, 1500);
  };
  
  return (
    <div className="signup-container">
      <div className="signup-card">
        <div className="signup-header">
          <img src={simonLogo} alt="Simio Simón" className="simon-logo" />
          <h1><a href="/" style={{ textDecoration: 'none', color: 'inherit' }}>Simonkey</a></h1>
          <p className="tagline">Crea tu cuenta y comienza a aprender</p>
        </div>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSignup} className="signup-form">
          <div className="form-group">
            <label htmlFor="email">Correo electrónico</label>
            <input 
              type="email" 
              id="email" 
              value={email} 
              onChange={handleEmailChange} 
              placeholder="ejemplo@correo.com"
              disabled={isLoading}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="username">Nombre de usuario</label>
            <input 
              type="text" 
              id="username" 
              value={username} 
              onChange={handleUsernameChange} 
              placeholder="Tu nombre de usuario"
              disabled={isLoading}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="birthdate">Fecha de nacimiento</label>
            <input 
              type="date" 
              id="birthdate" 
              value={birthdate} 
              onChange={handleBirthdateChange} 
              max={new Date().toISOString().split('T')[0]}
              disabled={isLoading}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Contraseña</label>
            <input 
              type="password" 
              id="password" 
              value={password} 
              onChange={handlePasswordChange} 
              placeholder="Tu contraseña"
              disabled={isLoading}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="confirmPassword">Confirmar contraseña</label>
            <input 
              type="password" 
              id="confirmPassword" 
              value={confirmPassword} 
              onChange={handleConfirmPasswordChange} 
              placeholder="Confirma tu contraseña"
              disabled={isLoading}
            />
          </div>
          
          <button 
            type="submit" 
            className="signup-button" 
            disabled={isLoading}
          >
            {isLoading ? 'Registrando...' : 'Registrarse'}
          </button>
        </form>
        
        <div className="social-signup">
          <p className="divider">O regístrate con</p>
          
          <div className="social-buttons">
            <button 
              className="google-button" 
              onClick={handleGoogleSignup}
              disabled={isLoading}
            >
              <svg viewBox="0 0 24 24" width="18" height="18">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Google
            </button>
            
            <button 
              className="apple-button" 
              onClick={handleAppleSignup}
              disabled={isLoading}
            >
              <svg viewBox="0 0 24 24" width="18" height="18">
                <path d="M17.05 20.28c-.98.95-2.05.86-3.08.38-1.09-.5-2.07-.48-3.2 0-1.44.62-2.2.44-3.05-.38C2.79 15.24 3.51 7.25 8.92 7c1.36.06 2.04.5 3.01.5.97 0 1.57-.5 3.11-.5 1.25.03 2.2.39 2.98 1.11-2.34 1.52-1.96 4.94.45 6.17-.67 1.96-1.76 3.99-3.43 6" fill="#000"/>
                <path d="M12.77 4.67c.7-.83 1.17-2 1.02-3.17-1.08.09-2.38.74-3.14 1.64-.68.78-1.25 1.99-1.02 3.16 1.19.09 2.37-.65 3.14-1.63" fill="#000"/>
              </svg>
              Apple
            </button>
          </div>
        </div>
        
        <div className="signup-footer">
          <p>¿Ya tienes cuenta? <a href="/login">Iniciar sesión</a></p>
          <p className="terms">Al registrarte, aceptas nuestros <a href="/">Términos y Condiciones</a> y <a href="/">Política de Privacidad</a></p>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;