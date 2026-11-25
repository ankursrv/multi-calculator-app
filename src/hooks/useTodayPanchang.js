import { useMemo } from 'react';
import useCurrentDate from './useCurrentDate';
import {
  DEFAULT_CITY,
  getDayPanchang,
  monthNameHi,
  shortNakshatra,
  splitTithi,
} from '../utils/hinduPanchang';

/**
 * Today's panchang for the home-screen card, as three one-line strings:
 * headLine (तिथि · नक्षत्र · चन्द्र राशि), angaLine (योग · करण) and subLine
 * (today's date + its त्योहार, or its वार when there is no event). Offline
 * calculation, cached in the util layer.
 */
export default function useTodayPanchang() {
  const { year, month, day: currentDay } = useCurrentDate();
  // No city selector in the UI — panchang always follows the default city.
  const city = DEFAULT_CITY;
  const day = useMemo(
    () => getDayPanchang(year, month, currentDay, city),
    [year, month, currentDay, city],
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
  const dateText = `${currentDay} ${monthNameHi(month)} ${year}`;
  const event = day.festivals[0];
  const subLine = event
    ? `${currentDay} ${monthNameHi(month)} · ${event.name.replace(/\s*\([^)]*\)/, '').trim()}`
    : `${dateText} · ${day.weekdayHi}`;

  return { city, headLine, angaLine, subLine };
}
