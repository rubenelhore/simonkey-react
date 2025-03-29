import { useContext } from 'react';
import { UserContext } from '../App';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  GoogleAuthProvider,
  signInWithRedirect
} from 'firebase/auth';

export const useUser = () => {
  const context = useContext(UserContext);
  
  if (!context) {
    throw new Error('useUser must be used within a UserContext.Provider');
  }
  
  return context;
};

export const loginWithEmail = async (email: string, password: string, setUser: any) => {
  try {
    const auth = getAuth();
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    const userData = {
      id: user.uid,
      email: user.email,
      name: user.displayName || user.email?.split('@')[0],
      isAuthenticated: true
    };
    
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    return { success: true, user: userData };
  } catch (error: any) {
    console.error('Error signing in:', error);
    return { success: false, error: error.message };
  }
};

export const loginWithGoogle = async () => {
  try {
    const auth = getAuth();
    const provider = new GoogleAuthProvider();
    
    // Usar redirección en lugar de popup
    await signInWithRedirect(auth, provider);
    
    // No se necesita más código aquí, ya que la redirección
    // llevará al usuario fuera de la página actual
    
    return { success: true };
  } catch (error: any) {
    console.error('Error signing in with Google:', error);
    return { success: false, error: error.message };
  }
};

export const signup = async (email: string, password: string, name: string, setUser: any) => {
  try {
    const auth = getAuth();
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    const userData = {
      id: user.uid,
      email: user.email,
      name: name || user.email?.split('@')[0],
      isAuthenticated: true
    };
    
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    return { success: true, user: userData };
  } catch (error: any) {
    console.error('Error signing up:', error);
    return { success: false, error: error.message };
  }
};

export const logout = async (setUser: any) => {
  try {
    const auth = getAuth();
    await signOut(auth);
    localStorage.removeItem('user');
    setUser({ isAuthenticated: false });
    return { success: true };
  } catch (error: any) {
    console.error('Error signing out:', error);
    return { success: false, error: error.message };
  }
};