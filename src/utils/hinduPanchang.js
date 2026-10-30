import { getDailyPanchang, computeRashiChart, IST_OFFSET_MINUTES } from 'panchang-ts';

/**
 * Offline Hindu Panchang data for the Tyohaar Calendar screen.
 *
 * Engine: `panchang-ts` — zero-dependency astronomical calculations, verified
 * against a reference North-Indian almanac (tithi / nakshatra / yoga / karana
 * names match exactly, end-times within ~1 minute). Same purnimanta convention
 * that printed Hindi calendars (Lala Ram Swarup style) follow, so dates line up
 * with the paper calendar. Nothing here needs the network.
 */

// Cities whose sunrise decides the day's tithi / muhurat windows.
// Kanpur is first — it is the default city for the calendar.
export const CITIES = [
  { id: 'kanpur', hi: 'कानपुर', en: 'Kanpur', latitude: 26.4499, longitude: 80.3319 },
  { id: 'delhi', hi: 'दिल्ली', en: 'Delhi', latitude: 28.6139, longitude: 77.209 },
  { id: 'lucknow', hi: 'लखनऊ', en: 'Lucknow', latitude: 26.8467, longitude: 80.9462 },
  { id: 'varanasi', hi: 'वाराणसी', en: 'Varanasi', latitude: 25.3176, longitude: 82.9739 },
  { id: 'agra', hi: 'आगरा', en: 'Agra', latitude: 27.1767, longitude: 78.0081 },
  { id: 'prayagraj', hi: 'प्रयागराज', en: 'Prayagraj', latitude: 25.4358, longitude: 81.8463 },
  { id: 'chandigarh', hi: 'चंडीगढ़', en: 'Chandigarh', latitude: 30.7333, longitude: 76.7794 },
  { id: 'jaipur', hi: 'जयपुर', en: 'Jaipur', latitude: 26.9124, longitude: 75.7873 },
  { id: 'mumbai', hi: 'मुंबई', en: 'Mumbai', latitude: 19.076, longitude: 72.8777 },
  { id: 'ahmedabad', hi: 'अहमदाबाद', en: 'Ahmedabad', latitude: 23.0225, longitude: 72.5714 },
  { id: 'kolkata', hi: 'कोलकाता', en: 'Kolkata', latitude: 22.5726, longitude: 88.3639 },
  { id: 'patna', hi: 'पटना', en: 'Patna', latitude: 25.5941, longitude: 85.1376 },
  { id: 'hyderabad', hi: 'हैदराबाद', en: 'Hyderabad', latitude: 17.385, longitude: 78.4867 },
  { id: 'chennai', hi: 'चेन्नई', en: 'Chennai', latitude: 13.0827, longitude: 80.2707 },
];

export const DEFAULT_CITY = CITIES[0];

// AsyncStorage key for the city whose sunrise the panchang follows
export const CITY_STORAGE_KEY = 'tyohaarCalendarCity';

export function findCity(cityId) {
  return CITIES.find((c) => c.id === cityId) || DEFAULT_CITY;
}

// Purnimanta + UP festival set = the printed Hindi calendar convention
const BASE_OPTIONS = {
  timezone: IST_OFFSET_MINUTES,
  language: 'hi',
  masaSystem: 'purnimanta',
  region: 'uttar-pradesh',
};

// India's gazetted national holidays, keyed month-day. Same every year, unlike
// everything else this file computes.
const NATIONAL_DAYS = {
  '1-26': 'गणतंत्र दिवस',
  '8-15': 'स्वतंत्रता दिवस',
  '10-2': 'गांधी जयंती',
  '4-14': 'अंबेडकर जयंती',
};

const MONTH_NAMES_EN = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const MONTH_NAMES_HI = [
  'जनवरी', 'फरवरी', 'मार्च', 'अप्रैल', 'मई', 'जून',
  'जुलाई', 'अगस्त', 'सितंबर', 'अक्टूबर', 'नवंबर', 'दिसंबर',
];

export const WEEKDAYS_HI = ['रवि', 'सोम', 'मंगल', 'बुध', 'गुरु', 'शुक्र', 'शनि'];

export const monthNameHi = (m) => MONTH_NAMES_HI[m - 1];
export const monthNameEn = (m) => MONTH_NAMES_EN[m - 1];

/**
 * The panchang day = the civil day read at local sunrise. India has a single
 * fixed IST offset and no DST, so noon IST is always 12:00 and the civil date
 * is stable no matter what timezone the phone itself is set to.
 */
function istNoon(year, month, day) {
  return new Date(Date.UTC(year, month - 1, day, 6, 30));
}

// Weekday of a civil date, computed in UTC so the phone's own timezone can
// never shift it by a day (0 = रवि)
export const weekdayOf = (year, month, day) =>
  new Date(Date.UTC(year, month - 1, day, 12)).getUTCDay();

// "2026-11-08T06:38:06.913+05:30" -> "06:38"
const hhmm = (iso) => (typeof iso === 'string' ? iso.slice(11, 16) : null);

// Display time as "06:38 AM" from an offset-carrying *Local string
export function formatTime(localString) {
  const t = hhmm(localString);
  if (!t) return '—';
  const [h, m] = t.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const h12 = ((h + 11) % 12) + 1;
  return `${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${suffix}`;
}

function formatPeriod(period) {
  if (!period || !period.startLocal) return '—';
  return `${formatTime(period.startLocal)} - ${formatTime(period.endLocal)}`;
}

function formatMinutes(mins) {
  if (typeof mins !== 'number') return '—';
  return `${Math.floor(mins / 60)} घं ${mins % 60} मि`;
}

// "कृष्ण चतुर्दशी" -> { paksha: "कृ", tithi: "चतुर्दशी" }  (अमावस्या / पूर्णिमा have no paksha)
export function splitTithi(name) {
  const space = name.indexOf(' ');
  if (space === -1) return { paksha: '', rest: name };
  const paksha = name.slice(0, space);
  if (paksha === 'कृष्ण') return { paksha: 'कृ', rest: name.slice(space + 1) };
  if (paksha === 'शुक्ल') return { paksha: 'शु', rest: name.slice(space + 1) };
  return { paksha: '', rest: name };
}

// The four compound nakshatras are the only long names in the set, so they get
// the same पू./उ. short form a printed almanac uses — keeps one-line displays
// like the home card from ever truncating.
export function shortNakshatra(name) {
  if (!name) return '—';
  return name.replace(/^पूर्वा\s?/, 'पू.').replace(/^उत्तरा\s?/, 'उ.');
}

/**
 * A day's tithi may change mid-day (vriddhi / kshaya). Almanacs print every
 * limb with its own end time, so do the same: "चतुर्दशी 11:28 AM · प्रतिपदा 05:12 PM".
 */
function angaRow(label, list) {
  const active = list && list.length ? list[0] : null;
  if (!active) return null;
  const ends = (list || [])
    .map((a) => `${splitTithi(a.name).rest} ${formatTime(a.endTimeLocal)}`)
    .join(' · ');
  return { label, value: active.name, sub: ends ? `समाप्ति: ${ends}` : null };
}

// Festival priority for the tiny one-liner inside a grid cell
const TYPE_ORDER = {
  national: 0,
  eclipse: 0,
  major: 1,
  sankranti: 2,
  vaishnava_ekadashi: 3,
  smarta_ekadashi: 3,
  ekadashi: 3,
  pradosha: 4,
  minor: 5,
};

const COLOR_BY_TYPE = {
  national: '#FDBA74',
  eclipse: '#D8B4FE',
  major: '#F87171',
  sankranti: '#6EE7B7',
  vaishnava_ekadashi: '#7DD3FC',
  smarta_ekadashi: '#7DD3FC',
  ekadashi: '#7DD3FC',
  pradosha: '#A5B4FC',
  minor: '#FCD34D',
};

export function festivalColor(type) {
  return COLOR_BY_TYPE[type] || '#FCD34D';
}

export function festivalRank(festival) {
  const rank = TYPE_ORDER[festival.type];
  return rank === undefined ? 6 : rank;
}

// Module-level cache: revisiting a month (or a city already used) is instant
const dayCache = new Map();

// A panchang failure must degrade the UI, never blank a screen: callers
// already treat null as "no data for this day".
export function getDayPanchang(year, month, day, city) {
  try {
    return computeDayPanchang(year, month, day, city);
  } catch (err) {
    console.warn(`Panchang गणना विफल (${day}.${month}.${year})`, err);
    return null;
  }
}

function computeDayPanchang(year, month, day, city) {
  const key = `${city.id}|${year}-${month}-${day}`;
  const hit = dayCache.get(key);
  if (hit) return hit;

  const raw = getDailyPanchang(istNoon(year, month, day), {
    latitude: city.latitude,
    longitude: city.longitude,
  }, BASE_OPTIONS);

  if (!raw) return null;

  const tithi = raw.angas.tithis[0];
  // National holidays are fixed Gregorian dates, so the lunar engine never
  // returns them — printed almanacs list both, so merge ours in here.
  const national = NATIONAL_DAYS[`${month}-${day}`];
  const list = [...(raw.festivals || [])];
  if (national) list.push({ name: national, type: 'national' });
  const festivals = list.sort(
    (a, b) => festivalRank(a) - festivalRank(b) || a.name.localeCompare(b.name),
  );

  const parsed = {
    year,
    month,
    day,
    weekday: weekdayOf(year, month, day),
    weekdayHi: raw.angas.vara.name,
    weekdayEn: raw.angas.vara.englishName,
    tithiName: tithi.name,
    tithiShort: splitTithi(tithi.name),
    masa: raw.calendar.chandramasa.name,
    isAdhikaMasa: !!raw.calendar.chandramasa.isAdhika,
    solarMasa: raw.calendar.masa.name,
    vikramSamvat: raw.calendar.samvat.vikramSamvat,
    shakaSamvat: raw.calendar.samvat.shakaSamvat,
    nakshatra: raw.angas.nakshatras[0] ? raw.angas.nakshatras[0].name : '—',
    yoga: raw.angas.yogas[0] ? raw.angas.yogas[0].name : '—',
    karana: raw.angas.karanas[0] ? raw.angas.karanas[0].name : '—',
    moonRashi: raw.moon.rashi ? raw.moon.rashi.name : '—',
    sunrise: raw.sun.riseLocal,
    sunset: raw.sun.setLocal,
    festivals,
    eclipse: raw.eclipse,
    raw,
  };

  dayCache.set(key, parsed);
  return parsed;
}

export function getMonthDays(year, month, city) {
  const total = new Date(year, month, 0).getDate();
  const list = [];
  for (let d = 1; d <= total; d++) {
    const day = getDayPanchang(year, month, d, city);
    if (day) list.push(day);
  }
  return list;
}

/** Full almanac breakdown for the selected-day sheet. */
export function buildDayDetail(day) {
  const r = day.raw;

  const sunMoon = [
    { label: 'सूर्योदय', value: formatTime(r.sun.riseLocal) },
    { label: 'सूर्यास्त', value: formatTime(r.sun.setLocal) },
    { label: 'दिवमान (दिन)', value: formatMinutes(r.sun.dayDurationMinutes) },
    { label: 'रात्रिमान (रात)', value: formatMinutes(r.sun.nightDurationMinutes) },
    { label: 'चन्द्रोदय', value: r.moon.riseLocal ? formatTime(r.moon.riseLocal) : '—' },
    { label: 'चन्द्रास्त', value: r.moon.setLocal ? formatTime(r.moon.setLocal) : '—' },
    { label: 'चन्द्र राशि', value: r.moon.rashi.name },
    { label: 'सूर्य नक्षत्र', value: r.sun.nakshatra.name },
  ];

  const panchangAngas = [
    angaRow('तिथि', r.angas.tithis),
    angaRow('नक्षत्र', r.angas.nakshatras),
    angaRow('योग', r.angas.yogas),
    angaRow('करण', r.angas.karanas),
    { label: 'वार', value: r.angas.vara.name, sub: r.angas.vara.englishName },
  ].filter(Boolean);

  const m = r.muhurtas;
  const amrit = (m.amritKala || []).map(formatPeriod).join('  |  ');
  const shubh = [
    { label: 'ब्रह्म मुहूर्त', value: formatPeriod(m.brahma) },
    { label: 'अभिजित मुहूर्त', value: m.abhijit ? formatPeriod(m.abhijit) : 'आज नहीं' },
    { label: 'विजय मुहूर्त', value: formatPeriod(m.vijaya) },
    { label: 'अमृत काल', value: amrit || 'आज नहीं' },
    { label: 'मध्याह्न', value: formatPeriod(m.madhyahna) },
    { label: 'निशीथ', value: formatPeriod(m.nishita) },
    { label: 'गोधूलि', value: formatPeriod(m.godhuli) },
    { label: 'प्रताः संध्या', value: formatPeriod(m.pratahSandhya) },
    { label: 'सायं संध्या', value: formatPeriod(m.sayahnaSandhya) },
  ];

  const inp = r.inauspicious;
  const varjyam = (inp.varjyam || []).map(formatPeriod).join('  |  ');
  const dur = (inp.durMuhurta || []).map(formatPeriod).join('  |  ');
  const ashubh = [
    { label: 'राहु काल', value: formatPeriod(inp.rahuKalam) },
    { label: 'गुलिक काल', value: formatPeriod(inp.gulikaKalam) },
    { label: 'यमघण्ट', value: formatPeriod(inp.yamaganda) },
    { label: 'विज्जो (वरज्य)', value: varjyam || '—' },
    { label: 'दुर्मुहूर्त', value: dur || '—' },
    { label: 'भद्र', value: inp.bhadra ? formatPeriod(inp.bhadra) : '—' },
  ];
  if (inp.panchakaInfo && inp.panchakaInfo.active) {
    ashubh.push({
      label: 'पंचक',
      value: inp.panchakaInfo.name || 'पंचकनाश',
      sub: 'दाह-कर्म वर्ज्य',
    });
  }
  if (inp.gandaMula && inp.gandaMula.active) {
    ashubh.push({
      label: 'गण्डमूल',
      value: inp.gandaMula.nakshatraName || 'नक्षत्र',
      sub: inp.gandaMula.severity === 'severe' ? 'तीव्र' : 'हल्का',
    });
  }

  const special = (r.specialYogas || []).map((y) => y.name);
  if (r.anandadiYoga && r.anandadiYoga.name) {
    special.push(`आनन्दादि: ${r.anandadiYoga.name}`);
  }
  const vishesh = [
    { label: 'चन्द्रमास', value: `${day.isAdhikaMasa ? 'अधिक ' : ''}${day.masa}` },
    { label: 'सौर मास', value: day.solarMasa },
    { label: 'विक्रम संवत', value: String(day.vikramSamvat) },
    { label: 'शक संवत', value: String(day.shakaSamvat) },
    { label: 'विशेष योग', value: special.length ? special.join(', ') : '—' },
  ];

  if (r.eclipse) {
    vishesh.unshift({ label: 'ग्रहण', value: r.eclipse.description });
  }

  return [
    { title: 'सूर्य - चन्द्र', icon: 'sunny', tone: 'gold', rows: sunMoon },
    { title: 'पंचांग (पाँच अंग)', icon: 'book-outline', tone: 'sky', rows: panchangAngas },
    { title: 'शुभ मुहूर्त', icon: 'sparkles', tone: 'emerald', rows: shubh },
    { title: 'वर्ज्य / अशुभ काल', icon: 'alarm-outline', tone: 'rose', rows: ashubh },
    { title: 'मास - संवत - विशेष', icon: 'calendar-outline', tone: 'violet', rows: vishesh },
  ];
}

/* ─ ─ ─  ग्रह राशि-चक्र (grah sthiti / rashifal data)  ─ ─ ─ */

const GRAHA_HI = {
  Sun: 'सूर्य',
  Moon: 'चन्द्र',
  Mars: 'मंगल',
  Mercury: 'बुध',
  Jupiter: 'गुरु',
  Venus: 'शुक्र',
  Saturn: 'शनि',
  Rahu: 'राहु',
  Ketu: 'केतु',
};

// Display order — the same nine grahas a printed panchang lists
const GRAHA_ORDER = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu'];

const chartCache = new Map();

/**
 * Sidereal position of the nine grahas at midday IST of the given day.
 * Purely astronomical (same chart a printed panchang prints as ग्रह-राशि चक्र);
 * no invented phal predictions are derived here.
 */
export function getGrahaRashiChakra(year, month, day, city) {
  try {
    return computeGrahaRashiChakra(year, month, day, city);
  } catch (err) {
    console.warn('ग्रह चक्र गणना विफल', err);
    return { lagna: null, nakshatra: null, grahas: [] };
  }
}

function computeGrahaRashiChakra(year, month, day, city) {
  const key = `chart|${city.id}|${year}-${month}-${day}`;
  const hit = chartCache.get(key);
  if (hit) return hit;

  const chart = computeRashiChart(istNoon(year, month, day), {
    latitude: city.latitude,
    longitude: city.longitude,
  }, BASE_OPTIONS);

  const byPlanet = chart.byPlanet || {};
  const parsed = {
    lagna: chart.lagna ? chart.lagna.rashi.name : null,
    nakshatra: chart.lagna && chart.lagna.nakshatra ? chart.lagna.nakshatra.name : null,
    grahas: GRAHA_ORDER.filter((p) => byPlanet[p]).map((p) => {
      const g = byPlanet[p];
      return {
        id: p,
        name: GRAHA_HI[p] || p,
        rashi: g.rashi ? g.rashi.name : '—',
        degrees: `${Math.floor(g.degreeInRashi)}°`,
        house: g.house,
        retrograde: !!g.isRetrograde,
      };
    }),
  };

  chartCache.set(key, parsed);
  return parsed;
}

/* ─ ─ ─  मुहूर्त खोज (muhurat search across a month)  ─ ─ ─ */

export const MUHURT_TYPES = [
  { id: 'amritKala', hi: 'अमृत काल', good: true },
  { id: 'abhijit', hi: 'अभिजित', good: true },
  { id: 'vijaya', hi: 'विजय', good: true },
  { id: 'brahma', hi: 'ब्रह्म', good: true },
  { id: 'godhuli', hi: 'गोधूलि', good: true },
  { id: 'nishita', hi: 'निशीथ', good: true },
  { id: 'madhyahna', hi: 'मध्याह्न', good: true },
  { id: 'rahuKalam', hi: 'राहु काल', good: false },
  { id: 'gulikaKalam', hi: 'गुलिक', good: false },
  { id: 'yamaganda', hi: 'यमघण्ट', good: false },
  { id: 'varjyam', hi: 'वरज्य', good: false },
  { id: 'durMuhurta', hi: 'दुर्मुहूर्त', good: false },
];

/**
 * Every window of one muhurat across the month, read from the already computed
 * days — so the times are exactly the ones the day sheet shows.
 */
export function findMuhurtasInMonth(days, muhuratId) {
  const type = MUHURT_TYPES.find((t) => t.id === muhuratId);
  if (!type) return [];

  const rows = [];
  days.forEach((d) => {
    const group = type.good ? d.raw.muhurtas : d.raw.inauspicious;
    const value = group ? group[muhuratId] : null;
    const windows = Array.isArray(value) ? value : (value ? [value] : []);
    windows.forEach((w) => {
      if (w && w.startLocal && w.endLocal) {
        rows.push({ day: d, start: w.startLocal, end: w.endLocal });
      }
    });
  });
  return rows;
}

/* ─ ─ ─  Month PDF / share  ─ ─ ─ */

const PRINT_COLORS = {
  national: '#C2410C',
  eclipse: '#6D28D9',
  major: '#B91C1C',
  sankranti: '#047857',
  vaishnava_ekadashi: '#0369A1',
  smarta_ekadashi: '#0369A1',
  ekadashi: '#0369A1',
  pradosha: '#4338CA',
  minor: '#B45309',
};

const escapeHtml = (value) =>
  String(value == null ? '' : value).replace(/[&<>"]/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]
  ));

/**
 * A4-ish printable month sheet in the printed-almanac layout (light paper,
 * Devanagari), rendered to PDF by expo-print.
 */
export function buildMonthPrintHtml(year, month, city, days) {
  const first = days[0];
  const lead = weekdayOf(year, month, 1);

  const cells = [];
  for (let i = 0; i < lead; i++) cells.push('');
  days.forEach((d) => cells.push(d));
  while (cells.length % 7 !== 0) cells.push('');

  const rowsHtml = [];
  for (let i = 0; i < cells.length; i += 7) {
    const tds = cells.slice(i, i + 7).map((d) => {
      if (!d) return '<td class="empty"></td>';
      const fests = d.festivals
        .map((f) => `<div class="f" style="color:${PRINT_COLORS[f.type] || '#B45309'}">${escapeHtml(f.name)}</div>`)
        .join('');
      const tithi = d.tithiShort.paksha
        ? `${escapeHtml(d.tithiShort.paksha)} ${escapeHtml(d.tithiShort.rest)}`
        : escapeHtml(d.tithiShort.rest);
      return (
        `<td class="${isPrintableToday(d, year, month) ? 'today' : ''}">` +
        `<div class="num">${d.day}</div>` +
        `<div class="ti">${tithi}</div>` +
        fests +
        '</td>'
      );
    }).join('');
    rowsHtml.push(`<tr>${tds}</tr>`);
  }

  const festList = [];
  days.forEach((d) => {
    d.festivals.forEach((f) => {
      festList.push(
        `<li><b style="color:${PRINT_COLORS[f.type] || '#B45309'}">${escapeHtml(f.name)}</b>` +
        ` — ${d.day} ${escapeHtml(monthNameHi(month))}, ${escapeHtml(d.weekdayHi)} · ${escapeHtml(d.tithiName)}</li>`
      );
    });
  });

  return `<!DOCTYPE html>
<html lang="hi"><head><meta charset="utf-8" />
<style>
  * { box-sizing: border-box; }
  body { font-family: sans-serif; margin: 18px; color: #1F2937; }
  h1 { margin: 0; font-size: 26px; color: #7F1D1D; }
  .sub { font-size: 12px; color: #6B7280; margin: 2px 0 10px; }
  .meta { font-size: 13px; margin-bottom: 10px; }
  .meta b { color: #7F1D1D; }
  table { width: 100%; border-collapse: collapse; table-layout: fixed; }
  th { font-size: 12px; padding: 5px 0; background: #FDE68A; color: #78350F; border: 1px solid #E5E7EB; }
  th.sun { color: #B91C1C; }
  td { border: 1px solid #E5E7EB; vertical-align: top; padding: 4px; height: 74px; font-size: 10px; }
  td.empty { background: #F9FAFB; }
  td.today { background: #FEF3C7; }
  .num { font-size: 15px; font-weight: bold; color: #111827; }
  .ti { color: #4B5563; margin-bottom: 2px; }
  .f { line-height: 1.25; font-weight: bold; }
  h2 { font-size: 15px; color: #7F1D1D; margin: 16px 0 6px; }
  ul { margin: 0; padding-left: 16px; font-size: 11px; line-height: 1.7; columns: 2; }
  .foot { font-size: 10px; color: #6B7280; margin-top: 12px; }
</style></head>
<body>
  <h1>${escapeHtml(monthNameHi(month))} ${year}</h1>
  <div class="sub">${escapeHtml(monthNameEn(month))} ${year} · पौर्णिमान्त पंचांग</div>
  <div class="meta">
    <b>${escapeHtml(first ? first.masa : '')} मास</b> ·
    विक्रम संवत ${first ? first.vikramSamvat : ''} ·
    शहर: <b>${escapeHtml(city.hi)}</b> (${escapeHtml(city.en)}) — तिथियाँ यहीं के सूर्योदय पर
  </div>
  <table>
    <tr>${['रवि', 'सोम', 'मंगल', 'बुध', 'गुरु', 'शुक्र', 'शनि']
      .map((w, i) => `<th class="${i === 0 ? 'sun' : ''}">${w}</th>`).join('')}</tr>
    ${rowsHtml.join('')}
  </table>
  <h2>त्योहार व व्रत</h2>
  <ul>${festList.join('') || '<li>इस महीने कोई त्योहार नहीं</li>'}</ul>
  <div class="foot">
    तिथि, नक्षत्र, योग व करण चुने हुए शहर के सूर्योदय पर बनाई गई हैं (पौर्णिमान्त मान्यता)।
    एक तिथि दो सूर्योदय में आए तो पहला दिन माना जाता है। शुभ मुहूर्त व राहुकाल के समय
    ऐप में हर दिन पर टैप करके देख सकते हैं।
  </div>
</body></html>`;
}

// "आज" highlight only when the printed month really is the current month
function isPrintableToday(d, year, month) {
  const now = new Date();
  return (
    d.year === now.getFullYear() &&
    d.month === now.getMonth() + 1 &&
    d.day === now.getDate() &&
    year === now.getFullYear() &&
    month === now.getMonth() + 1
  );
}
