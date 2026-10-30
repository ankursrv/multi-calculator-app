import { useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  CITY_STORAGE_KEY,
  DEFAULT_CITY,
  findCity,
  getDayPanchang,
  monthNameHi,
  shortNakshatra,
  splitTithi,
} from '../utils/hinduPanchang';

// Read once at module load — the home card only ever needs "today"
const NOW = new Date();
const THIS_YEAR = NOW.getFullYear();
const THIS_MONTH = NOW.getMonth() + 1;
const THIS_DAY = NOW.getDate();

/**
 * Today's panchang for the home-screen card, as three one-line strings:
 * headLine (तिथि · नक्षत्र · चन्द्र राशि), angaLine (योग · करण) and subLine
 * (today's date + its त्योहार, or its वार when there is no event). Offline
 * calculation, cached in the util layer.
 */
export default function useTodayPanchang() {
  const [cityId, setCityId] = useState(DEFAULT_CITY.id);

  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(CITY_STORAGE_KEY);
        if (saved && saved !== DEFAULT_CITY.id) setCityId(saved);
      } catch {
        // first run — keep the default city
      }
    })();
  }, []);

  const city = useMemo(() => findCity(cityId), [cityId]);
  const day = useMemo(
    () => getDayPanchang(THIS_YEAR, THIS_MONTH, THIS_DAY, city),
    [city],
  );

  if (!day) return { city, headLine: '', angaLine: '', subLine: '' };

  // Three fixed one-line rows. Widths were measured against the card's 188dp
  // text column: a wrapped line would change the card height after first paint
  // and Android then drops the child views (see HomeScreen's ScrollView).
  const t = splitTithi(day.tithiName);
  const tithi = t.paksha ? `${t.paksha}.${t.rest}` : t.rest;
  const headLine = `${tithi} · ${shortNakshatra(day.nakshatra)} · ${day.moonRashi}`;
  const angaLine = `योग ${day.yoga} · करण ${day.karana}`;

  // The date, then what is special about it: the top-ranked त्योहार (parenthetical
  // notes stripped — they are what pushed the line over) or the वार on a day with
  // no event. Event days drop the year: measured over 2026–2035, every variant
  // that keeps it reaches 173–189px against the 188dp column, while these two
  // forms top out at 171px. The rest of the day's events stay on the Tyohaar screen.
  const dateText = `${THIS_DAY} ${monthNameHi(THIS_MONTH)} ${THIS_YEAR}`;
  const event = day.festivals[0];
  const subLine = event
    ? `${THIS_DAY} ${monthNameHi(THIS_MONTH)} · ${event.name.replace(/\s*\([^)]*\)/, '').trim()}`
    : `${dateText} · ${day.weekdayHi}`;

  return { city, headLine, angaLine, subLine };
}
