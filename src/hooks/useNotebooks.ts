import { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../services/firebase';
import { collection, query, where, onSnapshot, orderBy, Timestamp } from 'firebase/firestore';

export interface Notebook {
  id: string;
  title: string;
  userId: string;
  createdAt: Date | Timestamp;
}

export const useNotebooks = () => {
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [user] = useAuthState(auth);

  useEffect(() => {
    // Si no hay usuario, no intentamos cargar cuadernos
    if (!user) {
      setNotebooks([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      // Query para obtener notebooks del usuario actual
      const notebooksQuery = query(
        collection(db, 'notebooks'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
      
      // Usar onSnapshot para escuchar cambios en tiempo real
      const unsubscribe = onSnapshot(
        notebooksQuery,
        (snapshot) => {
          try {
            const notebooksData = snapshot.docs.map(doc => {
              const data = doc.data();
              
              return {
                id: doc.id,
                title: data.title,
                userId: data.userId,
                createdAt: data.createdAt
              } as Notebook;
            });
            
            console.log("Fetched notebooks:", notebooksData);
            setNotebooks(notebooksData);
            setLoading(false);
          } catch (err: any) {
            console.error("Error processing notebooks:", err);
            setError(err);
            setLoading(false);
          }
        },
        (err) => {
          console.error("Error fetching notebooks:", err);
          setError(err);
          setLoading(false);
        }
      );
      
      // Cleanup function
      return () => unsubscribe();
    } catch (err: any) {
      console.error("Error setting up notebooks listener:", err);
      setError(err);
      setLoading(false);
      return () => {}; // Empty cleanup function
    }
  }, [user]);
  
  return { notebooks, loading, error };
};