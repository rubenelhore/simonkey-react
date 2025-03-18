import React, { useState } from 'react';
import './LoginPage.css';
// Importa la imagen de la mascota (asegúrate de tener esta imagen en tu proyecto)
import simonLogo from '/img/favicon.svg';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    setError(null);
  };
  
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    setError(null);
  };
  
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('Por favor, ingresa tu correo y contraseña');
      return;
    }
    
    // Simulamos el proceso de carga
    setIsLoading(true);
    
    // Simulamos un inicio de sesión exitoso después de 1.5 segundos
    setTimeout(() => {
      setIsLoading(false);
      // Para la maqueta, simplemente mostramos un mensaje en la consola
      console.log('Inicio de sesión exitoso con:', { email, password });
      alert('Inicio de sesión exitoso (simulado)');
    }, 1500);
  };
  
  const handleGoogleLogin = () => {
    setIsLoading(true);
    
    // Simulamos un proceso de autenticación
    setTimeout(() => {
      setIsLoading(false);
      console.log('Inicio de sesión con Google');
      alert('Inicio de sesión con Google (simulado)');
    }, 1500);
  };
  
  const handleAppleLogin = () => {
    setIsLoading(true);
    
    // Simulamos un proceso de autenticación
    setTimeout(() => {
      setIsLoading(false);
      console.log('Inicio de sesión con Apple');
      alert('Inicio de sesión con Apple (simulado)');
    }, 1500);
  };
  
  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <img src={simonLogo} alt="Simio Simón" className="simon-logo"/>
              <h1><a href="/" style={{ textDecoration: 'none', color: 'inherit' }}>
              <span style={{ color: 'black' }}>Simon</span>
              <span style={{ color: '#6147FF' }}>key</span>
              </a></h1>
          <p className="tagline">Tu estudio, tu ritmo</p>
        </div>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleLogin} className="login-form">
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
          
          <button 
            type="submit" 
            className="login-button" 
            disabled={isLoading}
          >
            {isLoading ? 'Iniciando sesión...' : 'Iniciar sesión'}
          </button>
        </form>
        
        <div className="social-login">
          <p className="divider">O inicia sesión con</p>
          
          <div className="social-buttons">
            <button 
              className="google-button" 
              onClick={handleGoogleLogin}
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
              onClick={handleAppleLogin}
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
        
        <div className="login-footer">
          <p>¿No tienes cuenta? <a href="/signup">Regístrate</a></p>
          <p className="forgot-password"><a href="/">¿Olvidaste tu contraseña?</a></p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;