import React, { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../services/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

interface StreakData {
  days: {
    [key: string]: boolean; // 'monday', 'tuesday', etc.
  };
  currentStreak: number;
  lastVisit: Date | null;
}

const StreakTracker: React.FC = () => {
  const [user] = useAuthState(auth);
  const [streakData, setStreakData] = useState<StreakData>({
    days: {
      monday: false,
      tuesday: false,
      wednesday: false,
      thursday: false,
      friday: false,
      saturday: false,
      sunday: false
    },
    currentStreak: 0,
    lastVisit: null
  });
  const [loading, setLoading] = useState(true);

  // Días de la semana en español, abreviados
  const weekDays = [
    { key: 'monday', label: 'L' },
    { key: 'tuesday', label: 'M' },
    { key: 'wednesday', label: 'X' },
    { key: 'thursday', label: 'J' },
    { key: 'friday', label: 'V' },
    { key: 'saturday', label: 'S' },
    { key: 'sunday', label: 'D' }
  ];

  useEffect(() => {
    const fetchAndUpdateStreak = async () => {
      if (!user) return;

      try {
        setLoading(true);
        
        // Obtener la racha del usuario
        const streakRef = doc(db, 'users', user.uid, 'stats', 'streak');
        const streakDoc = await getDoc(streakRef);
        
        const today = new Date();
        const dayOfWeek = today.toLocaleDateString('es-ES', { weekday: 'long' }).toLowerCase();
        
        let currentData: StreakData;
        
        if (streakDoc.exists()) {
          const data = streakDoc.data();
          currentData = {
            days: data.days || {},
            currentStreak: data.currentStreak || 0,
            lastVisit: data.lastVisit ? new Date(data.lastVisit.toDate()) : null
          };
          
          // Marcar el día de hoy
          currentData.days[dayOfWeek] = true;
          
          // Actualizar racha
          const lastVisitDate = currentData.lastVisit ? currentData.lastVisit.toDateString() : null;
          const todayString = today.toDateString();
          
          if (lastVisitDate !== todayString) {
            // Es una visita nueva para hoy
            currentData.currentStreak += 1;
            currentData.lastVisit = today;
          }
        } else {
          // Primera vez que el usuario visita
          currentData = {
            days: {
              monday: false,
              tuesday: false,
              wednesday: false,
              thursday: false,
              friday: false,
              saturday: false,
              sunday: false
            },
            currentStreak: 1,
            lastVisit: today
          };
          currentData.days[dayOfWeek] = true;
        }
        
        // Guardar los datos actualizados
        await setDoc(streakRef, {
          days: currentData.days,
          currentStreak: currentData.currentStreak,
          lastVisit: serverTimestamp()
        });
        
        setStreakData(currentData);
        
      } catch (error) {
        console.error("Error al actualizar la racha:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAndUpdateStreak();
  }, [user]);

  if (loading) {
    return (
      <div className="streak-tracker-loading">
        Cargando racha...
      </div>
    );
  }

  return (
    <div className="streak-tracker">
      <h2>Tu racha actual</h2>
      <div className="streak-counter">
        <span className="streak-fire">🔥</span>
        <span className="streak-days">{streakData.currentStreak} {streakData.currentStreak === 1 ? 'día' : 'días'}</span>
      </div>
      <div className="streak-calendar">
        {weekDays.map((day) => (
          <div 
            key={day.key} 
            className={`day-indicator ${streakData.days[day.key] ? 'active' : ''}`}
          >
            <span className="day-label">{day.label}</span>
            {streakData.days[day.key] && (
              <span className="day-fire">🔥</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default StreakTracker;