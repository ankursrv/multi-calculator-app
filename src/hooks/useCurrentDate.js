import { useState, useEffect, useCallback } from 'react';
import { AppState } from 'react-native';

/**
 * Live date hook that automatically updates when midnight passes (11:59 PM -> 12:00 AM)
 * and whenever the app returns from background/lock screen.
 */
export default function useCurrentDate() {
  const [currentDate, setCurrentDate] = useState(() => new Date());

  useEffect(() => {
    let timerId = null;

    const checkDate = () => {
      const now = new Date();
      setCurrentDate((prev) => {
        if (
          prev.getFullYear() !== now.getFullYear() ||
          prev.getMonth() !== now.getMonth() ||
          prev.getDate() !== now.getDate()
        ) {
          return now;
        }
        return prev;
      });
    };

    const scheduleMidnight = () => {
      if (timerId) clearTimeout(timerId);
      const now = new Date();
      // Schedule trigger just after midnight (00:00:00.500)
      const nextMidnight = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 1,
        0,
        0,
        0,
        500,
      );
      const delay = Math.max(nextMidnight.getTime() - now.getTime(), 500);
      timerId = setTimeout(() => {
        checkDate();
        scheduleMidnight();
      }, delay);
    };

    scheduleMidnight();

    // Periodic safety check every 30 seconds
    const intervalId = setInterval(checkDate, 30000);

    // Immediate check whenever user returns to the app
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        checkDate();
        scheduleMidnight();
      }
    });

    return () => {
      if (timerId) clearTimeout(timerId);
      clearInterval(intervalId);
      sub.remove();
    };
  }, []);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1; // 1-indexed (1-12)
  const day = currentDate.getDate();

  const isToday = useCallback(
    (d) => Boolean(d && d.year === year && d.month === month && d.day === day),
    [year, month, day],
  );

  return { currentDate, year, month, day, isToday };
}

