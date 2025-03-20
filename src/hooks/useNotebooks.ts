// src/hooks/useNotebooks.ts
import { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../services/firebase';
import { getNotebooks } from '../services/notebookService';

export interface Notebook {
  id: string;
  title: string;
  userId: string;
  createdAt: Date;
}

export const useNotebooks = () => {
  const [user] = useAuthState(auth);
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotebooks = async () => {
      if (user) {
        setLoading(true);
        try {
          const userNotebooks = await getNotebooks(user.uid);
          // Filter out any notebooks that don't have an id
          const validNotebooks = userNotebooks.filter(
            (notebook): notebook is Notebook => 
              typeof notebook.id === 'string' && notebook.id !== ''
          );
          setNotebooks(validNotebooks);
        } catch (error) {
          console.error("Error fetching notebooks:", error);
        } finally {
          setLoading(false);
        }
      } else {
        setNotebooks([]);
        setLoading(false);
      }
    };
    
    fetchNotebooks();
  }, [user]);

  return { notebooks, loading };
};