// src/services/notebookService.ts
import { db } from './firebase';
import { collection, addDoc, getDocs, deleteDoc, doc, query, where } from 'firebase/firestore';

interface Notebook {
  id?: string;
  title: string;
  userId: string;
  createdAt: Date;
}

// Create a new notebook
export const createNotebook = async (userId: string, title: string) => {
  const notebookData = {
    title,
    userId,
    createdAt: new Date(),
  };
  const docRef = await addDoc(collection(db, 'notebooks'), notebookData);
  return { id: docRef.id, ...notebookData };
};

// Fetch all notebooks for a user
export const getNotebooks = async (userId: string) => {
  const q = query(collection(db, 'notebooks'), where('userId', '==', userId));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notebook));
};

// Delete a notebook
export const deleteNotebook = async (notebookId: string) => {
  await deleteDoc(doc(db, 'notebooks', notebookId));
};