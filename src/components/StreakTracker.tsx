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
  consecutiveDays: number; // Nueva propiedad para rastrear días consecutivos
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
    lastVisit: null,
    consecutiveDays: 0
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

  // Función auxiliar para obtener el número de semana
  const getWeekNumber = (date: Date): number => {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  };

  // Función para comprobar si dos fechas son días consecutivos o el mismo día
  const isConsecutiveOrSameDay = (date1: Date, date2: Date): boolean => {
    const diffTime = Math.abs(date2.getTime() - date1.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 1;
  };

  const fetchAndUpdateStreak = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Obtener la racha del usuario
      const streakRef = doc(db, 'users', user.uid, 'stats', 'streak');
      const streakDoc = await getDoc(streakRef);
      
      const today = new Date();
      const dayMapping: { [key: string]: string } = {
        'lunes': 'monday',
        'martes': 'tuesday',
        'miércoles': 'wednesday',
        'jueves': 'thursday',
        'viernes': 'friday',
        'sábado': 'saturday',
        'domingo': 'sunday'
      };
      
      const dayInSpanish = today.toLocaleDateString('es-ES', { weekday: 'long' }).toLowerCase();
      const dayOfWeek = dayMapping[dayInSpanish] || 'monday';
      
      // LÓGICA MODIFICADA PARA MANTENER RACHAS ILIMITADAS
      
      let currentData: StreakData;
      let shouldResetWeek = false;
      
      if (streakDoc.exists()) {
        const data = streakDoc.data();
        
        // Si hay datos existentes, los convertimos al formato correcto
        const days = data?.days || {};
        const lastVisit = data?.lastVisit ? new Date(data.lastVisit.toDate()) : null;
        const currentStreak = data?.currentStreak || 0;
        const consecutiveDays = data?.consecutiveDays || currentStreak || 0; // Usar valor existente o inicializar
        
        currentData = {
          days: {
            monday: days.monday || false,
            tuesday: days.tuesday || false,
            wednesday: days.wednesday || false,
            thursday: days.thursday || false,
            friday: days.friday || false,
            saturday: days.saturday || false,
            sunday: days.sunday || false
          },
          currentStreak: currentStreak,
          lastVisit: lastVisit,
          consecutiveDays: consecutiveDays
        };
        
        // Verificar si necesitamos reiniciar la semana para el calendario semanal
        if (currentData.lastVisit) {
          const lastVisitDate = currentData.lastVisit;
          
          const currentWeek = getWeekNumber(today);
          const lastVisitWeek = lastVisitDate ? getWeekNumber(lastVisitDate) : -1;
          const currentYear = today.getFullYear();
          const lastVisitYear = lastVisitDate ? lastVisitDate.getFullYear() : -1;
          
          // Calcular días transcurridos desde la última visita
          const diffTime = Math.abs(today.getTime() - lastVisitDate.getTime());
          const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
          
          // Resetear semana si estamos en nueva semana o han pasado 7+ días
          if (currentWeek !== lastVisitWeek || currentYear !== lastVisitYear || diffDays >= 7) {
            console.log("Reseteando semana: nueva semana detectada o han pasado 7+ días");
            shouldResetWeek = true;
          }
          
          // Lógica para racha de días consecutivos
          if (lastVisitDate) {
            // Si es el mismo día, no incrementamos la racha
            if (today.toDateString() === lastVisitDate.toDateString()) {
              console.log("Mismo día, manteniendo racha actual");
            } 
            // Si es el siguiente día, incrementamos la racha
            else if (isConsecutiveOrSameDay(lastVisitDate, today)) {
              console.log("Día consecutivo, incrementando racha");
              currentData.consecutiveDays += 1;
            }
            // Si no es un día consecutivo, reiniciamos la racha
            else {
              console.log("No es día consecutivo, reiniciando racha");
              currentData.consecutiveDays = 1; // Reinicia a 1 porque hoy cuenta como día
            }
          } else {
            // Primera visita registrada
            currentData.consecutiveDays = 1;
          }
        }
        
        // Resetear días de la visualización semanal si es necesario
        if (shouldResetWeek) {
          console.log("Reseteando días de la semana para visualización");
          currentData.days = {
            monday: false,
            tuesday: false,
            wednesday: false,
            thursday: false,
            friday: false,
            saturday: false,
            sunday: false
          };
        }
        
        // Marcar el día de hoy en la visualización semanal
        currentData.days[dayOfWeek] = true;
        
        // Actualizar la fecha de última visita solo si es un día diferente
        const todayString = today.toDateString();
        if (!currentData.lastVisit || currentData.lastVisit.toDateString() !== todayString) {
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
          currentStreak: 0,
          lastVisit: today,
          consecutiveDays: 1 // Primer día
        };
        currentData.days[dayOfWeek] = true;
      }
      
      // Contar los días activos esta semana para la visualización
      let daysWithFire = 0;
      Object.values(currentData.days).forEach(isActive => {
        if (isActive) daysWithFire++;
      });
      
      // Actualizar la racha de días activos esta semana
      currentData.currentStreak = daysWithFire;

      // Guardar los datos actualizados
      await setDoc(streakRef, {
        days: currentData.days,
        currentStreak: currentData.currentStreak,
        lastVisit: serverTimestamp(),
        consecutiveDays: currentData.consecutiveDays
      });
      
      setStreakData(currentData);
      
    } catch (error) {
      console.error("Error al actualizar la racha:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
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
        <span className="streak-days">
          {streakData.consecutiveDays} {streakData.consecutiveDays === 1 ? 'día' : 'días'} consecutivos
        </span>
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