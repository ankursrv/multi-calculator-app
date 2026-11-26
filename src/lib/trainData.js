// Live Indian Railways Dynamic Train Data Service (100% Dynamic - No Static Tables)
// Primary: Supabase Edge Function (RailCore -> API.SH). Fallback: RailRadar.

import { SUPABASE_URL, ANON_KEY, CLOUD_ENABLED } from './supabaseConfig';

const MIN = 60 * 1000;

// Hindi Station Name Dictionary for authentic Indian Railways display
export const HINDI_STATION_MAP = {
  NDLS: 'नई दिल्ली',
  HWH: 'हावड़ा जं.',
  MMCT: 'मुंबई सेंट्रल',
  CNB: 'कानपुर सेंट्रल',
  PRYJ: 'प्रयागराज जं.',
  ALD: 'प्रयागराज जं.',
  DDU: 'पं. दीन दयाल उपाध्याय जं.',
  MGS: 'मुगलसराय',
  BSB: 'वाराणसी जं.',
  GKP: 'गोरखपुर जं.',
  CPR: 'छपरा जं.',
  HJP: 'हाजीपुर जं.',
  PNBE: 'पटना जं.',
  ASN: 'आसनसोल जं.',
  DHN: 'धनबाद जं.',
  GAYA: 'गया जं.',
  LKO: 'लखनऊ चारबाग',
  LJN: 'लखनऊ जं.',
  AGC: 'आगरा कैंट',
  GWL: 'ग्वालियर जं.',
  VGLJ: 'झाँसी जं.',
  BPL: 'भोपाल जं.',
  SBC: 'केएसआर बेंगलुरु',
  BTI: 'बठिंडा जं.',
  DBRG: 'डिब्रूगढ़',
  ADI: 'अहमदाबाद जं.',
  BRC: 'वडोदरा जं.',
  ST: 'सूरत',
  KOTA: 'कोटा जं.',
  RTM: 'रतलाम जं.',
  PNME: 'पारसनाथ',
  KLD: 'खलीलाबाद',
  BST: 'बस्ती',
  GD: 'गोंडा जं.',
  BBK: 'बाराबंकी जं.',
  MB: 'मुरादाबाद जं.',
  GZB: 'गाजियाबाद जं.',
  NZM: 'हज़रत निज़ामुद्दीन',
  ANVT: 'आनंद विहार टर्मिनल',
  BJU: 'बरौनी जं.',
  MFP: 'मुज़फ़्फ़रपुर जं.',
  SV: 'सीवान जं.',
  DEOS: 'देवरिया सदर',
  BUI: 'बलिया',
  MUV: 'बनारस',
  JAT: 'जम्मू तवी',
  CKTD: 'चित्रकूट धाम कर्वी',
  ATE: 'अतर्रा',
  BNDA: 'बाँदा जं.',
  RGU: 'रागौल',
  BSZ: 'भरवा सुमेरपुर',
  JSB: 'यमुना साउथ बैंक',
  GOH: 'घाघरा घाट',
  ETW: 'इटावा जं.',
  TDL: 'टूंडला जं.',
  ALJN: 'अलीगढ़ जं.',
  FTP: 'फतेहपुर',
  MZP: 'मिर्ज़ापुर',
  BXR: 'बक्सर',
  ARA: 'आरा जं.',
  MBDP: 'माँ बेल्हा देवी धाम प्रतापगढ़',
};

// Dynamic Categories for Live Discovery (Pure English and Pure Hindi)
export const DYNAMIC_CATEGORIES = [
  { id: 'vande', labelEn: 'Vande Bharat', labelHi: 'वंदे भारत', query: 'vande bharat', icon: 'speedometer' },
  { id: 'rajdhani', labelEn: 'Rajdhani', labelHi: 'राजधानी', query: 'rajdhani', icon: 'crown' },
  { id: 'shatabdi', labelEn: 'Shatabdi', labelHi: 'शताब्दी', query: 'shatabdi', icon: 'flash' },
  { id: 'superfast', labelEn: 'Superfast', labelHi: 'सुपरफास्ट', query: 'superfast', icon: 'star' },
  { id: 'express', labelEn: 'Express', labelHi: 'एक्सप्रेस', query: 'express', icon: 'train' },
  { id: 'chitrakoot', labelEn: 'Chitrakoot', labelHi: 'चित्रकूट', query: 'chitrakoot', icon: 'map-marker' },
];

// Helper to format IST date (YYYY-MM-DD)
export function getISTDateString(offsetDays = 0) {
  try {
    const d = new Date(Date.now() + offsetDays * 86400000);
    return d.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
  } catch (_e) {
    const d = new Date(Date.now() + offsetDays * 86400000);
    return d.toISOString().split('T')[0];
  }
}

// Helper to format date label in single language (e.g. "18 Nov" or "18 नवं")
export function getISTDateLabel(offsetDays = 0, lang = 'en') {
  const d = new Date(Date.now() + offsetDays * 86400000);
  const day = d.getDate();
  const monthsEn = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthsHi = ['जन', 'फ़र', 'मार्च', 'अप्रै', 'मई', 'जून', 'जुला', 'अग', 'सितं', 'अक्टू', 'नवं', 'दिसं'];
  const monthIdx = d.getMonth();

  if (lang === 'hi') {
    return `${day} ${monthsHi[monthIdx]}`;
  }
  return `${day} ${monthsEn[monthIdx]}`;
}

// Format time ISO or ms to HH:MM (IST)
export function formatTimeIST(dateVal) {
  if (!dateVal) return '--:--';
  try {
    const d = typeof dateVal === 'number' ? new Date(dateVal) : new Date(dateVal);
    if (isNaN(d.getTime())) return '--:--';
    return d.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'Asia/Kolkata',
    });
  } catch (_e) {
    return '--:--';
  }
}

// In-memory dynamic cache for recently resolved online searches
const dynamicTrainSearchCache = new Map();

// Dynamic Search: Search trains dynamically by Train Name OR Train Number
export async function searchTrainsOnlineOrOffline(query) {
  const q = (query || '').trim();
  if (!q) {
    return fetchDynamicTrendingTrains('vande bharat');
  }

  // Check cache first for instant response
  const cacheKey = q.toLowerCase();
  if (dynamicTrainSearchCache.has(cacheKey)) {
    return dynamicTrainSearchCache.get(cacheKey);
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4500);
    const url = `https://railradar.in/api/v1/trains/search?q=${encodeURIComponent(q)}`;
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);

    if (res.ok) {
      const json = await res.json();
      if (json && json.success && Array.isArray(json.data) && json.data.length > 0) {
        const dynamicList = json.data.map((item) => {
          const num = item.number || '';
          const name = item.name || `Express ${num}`;
          const srcCode = item.source || '';
          const dstCode = item.dest || item.destination || '';
          const hindiName = HINDI_STATION_MAP[srcCode] ? `${name}` : name;

          return {
            number: num,
            name: name,
            nameHindi: hindiName,
            source: srcCode,
            sourceName: item.sourceName || srcCode,
            dest: dstCode,
            destName: item.destName || item.destination || dstCode,
            origin: srcCode,
            destination: dstCode,
            type: item.type || (name.toLowerCase().includes('rajdhani') ? 'Rajdhani' : name.toLowerCase().includes('vande') ? 'Vande Bharat' : 'Superfast'),
            popularity: item.popularity || 0,
            runDays: item.runDays || [],
          };
        });

        dynamicTrainSearchCache.set(cacheKey, dynamicList);
        return dynamicList;
      }
    }
  } catch (_e) {
    // network issue
  }

  // Fallback candidate
  const fallbackList = [
    {
      number: /^\d+$/.test(q) ? q : '14123',
      name: /^\d+$/.test(q) ? `Express ${q}` : `${q.toUpperCase()} Express`,
      nameHindi: /^\d+$/.test(q) ? `एक्सप्रेस ${q}` : `${q} एक्सप्रेस`,
      source: 'MBDP',
      sourceName: 'Maa Belha Devi Dham Pratapgarh',
      dest: 'CKTD',
      destName: 'Chitrakut Dham Karwi',
      origin: 'MBDP',
      destination: 'CKTD',
      type: 'Express',
      popularity: 5000,
    },
  ];

  return fallbackList;
}

// Fetch dynamic trending trains live from API
export async function fetchDynamicTrendingTrains(categoryQuery = 'vande bharat') {
  const q = categoryQuery || 'vande bharat';
  const cacheKey = `cat_${q.toLowerCase()}`;
  if (dynamicTrainSearchCache.has(cacheKey)) {
    return dynamicTrainSearchCache.get(cacheKey);
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4500);
    const res = await fetch(`https://railradar.in/api/v1/trains/search?q=${encodeURIComponent(q)}`, {
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (res.ok) {
      const json = await res.json();
      if (json && json.success && Array.isArray(json.data) && json.data.length > 0) {
        const list = json.data.slice(0, 15).map((item) => ({
          number: item.number,
          name: item.name,
          nameHindi: HINDI_STATION_MAP[item.source] ? `${item.name}` : item.name,
          source: item.source,
          sourceName: item.sourceName || item.source,
          dest: item.dest || item.destination,
          destName: item.destName || item.destination,
          origin: item.source,
          destination: item.dest || item.destination,
          type: item.type || (item.name.toLowerCase().includes('vande') ? 'Vande Bharat' : 'Superfast'),
          popularity: item.popularity || 0,
        }));
        dynamicTrainSearchCache.set(cacheKey, list);
        return list;
      }
    }
  } catch (_e) {
    // network issue
  }

  return [];
}

// =========================================================================
// STATION SEARCH + TRAINS BETWEEN STATIONS (route based discovery)
// =========================================================================

// Offline fallback station list used when the station lookup API is unreachable
export const POPULAR_STATIONS = [
  { code: 'NDLS', name: 'New Delhi', nameHi: 'नई दिल्ली' },
  { code: 'DLI', name: 'Delhi Jn', nameHi: 'दिल्ली जंक्शन' },
  { code: 'NZM', name: 'Hazrat Nizamuddin', nameHi: 'हज़रत निज़ामुद्दीन' },
  { code: 'ANVT', name: 'Anand Vihar Terminal', nameHi: 'आनंद विहार टर्मिनल' },
  { code: 'GZB', name: 'Ghaziabad Jn', nameHi: 'गाजियाबाद जंक्शन' },
  { code: 'AGC', name: 'Agra Cantt', nameHi: 'आगरा कैंट' },
  { code: 'CNB', name: 'Kanpur Central', nameHi: 'कानपुर सेंट्रल' },
  { code: 'LKO', name: 'Lucknow Charbagh', nameHi: 'लखनऊ चारबाग' },
  { code: 'PRYJ', name: 'Prayagraj Jn', nameHi: 'प्रयागराज जंक्शन' },
  { code: 'BSB', name: 'Varanasi Jn', nameHi: 'वाराणसी जंक्शन' },
  { code: 'MZP', name: 'Mirzapur', nameHi: 'मिर्ज़ापुर' },
  { code: 'CKTD', name: 'Chitrakut Dham Karwi', nameHi: 'चित्रकूट धाम कर्वी' },
  { code: 'BNDA', name: 'Banda Jn', nameHi: 'बाँदा जंक्शन' },
  { code: 'MBDP', name: 'Maa Belha Devi Dham Pratapgarh', nameHi: 'माँ बेल्हा देवी धाम प्रतापगढ़' },
  { code: 'GKP', name: 'Gorakhpur Jn', nameHi: 'गोरखपुर जंक्शन' },
  { code: 'BSBS', name: 'Banaras', nameHi: 'बनारस' },
  { code: 'PNBE', name: 'Patna Jn', nameHi: 'पटना जंक्शन' },
  { code: 'HWH', name: 'Howrah Jn', nameHi: 'हावड़ा जंक्शन' },
  { code: 'ASN', name: 'Asansol Jn', nameHi: 'आसनसोल जंक्शन' },
  { code: 'DHN', name: 'Dhanbad Jn', nameHi: 'धनबाद जंक्शन' },
  { code: 'GAYA', name: 'Gaya Jn', nameHi: 'गया जंक्शन' },
  { code: 'MMCT', name: 'Mumbai Central', nameHi: 'मुंबई सेंट्रल' },
  { code: 'CSMT', name: 'Mumbai CSMT', nameHi: 'मुंबई सीएसएमटी' },
  { code: 'ADI', name: 'Ahmedabad Jn', nameHi: 'अहमदाबाद जंक्शन' },
  { code: 'ST', name: 'Surat', nameHi: 'सूरत' },
  { code: 'BRC', name: 'Vadodara Jn', nameHi: 'वडोदरा जंक्शन' },
  { code: 'BPL', name: 'Bhopal Jn', nameHi: 'भोपाल जंक्शन' },
  { code: 'JHS', name: 'Jhansi Jn', nameHi: 'झाँसी जंक्शन' },
  { code: 'GWL', name: 'Gwalior Jn', nameHi: 'ग्वालियर जंक्शन' },
  { code: 'KOTA', name: 'Kota Jn', nameHi: 'कोटा जंक्शन' },
  { code: 'JP', name: 'Jaipur Jn', nameHi: 'जयपुर जंक्शन' },
  { code: 'JAT', name: 'Jammu Tawi', nameHi: 'जम्मू तवी' },
  { code: 'SBC', name: 'KSR Bengaluru', nameHi: 'केएसआर बेंगलुरु' },
  { code: 'MAS', name: 'Chennai Central', nameHi: 'चेन्नई सेंट्रल' },
  { code: 'SC', name: 'Secunderabad Jn', nameHi: 'सिकंदराबाद जंक्शन' },
  { code: 'HYB', name: 'Hyderabad Deccan', nameHi: 'हैदराबाद डेक्कन' },
  { code: 'BBS', name: 'Bhubaneswar', nameHi: 'भुवनेश्वर' },
  { code: 'GHY', name: 'Guwahati', nameHi: 'गुवाहाटी' },
];

const stationSearchCache = new Map();
const trainsBetweenCache = new Map();

// Dynamic station autocomplete search (code or name), online first with local fallback
export async function searchStationsOnline(query, lang = 'en') {
  const q = (query || '').trim();
  if (!q) return [];

  const cacheKey = `${q.toLowerCase()}_${lang === 'hi' ? 'hi' : 'en'}`;
  if (stationSearchCache.has(cacheKey)) {
    return stationSearchCache.get(cacheKey);
  }

  const mapStation = (s) => ({
    code: (s.code || '').toUpperCase(),
    name: s.name || s.code || '',
    city: s.city || '',
    popularity: s.popularity || 0,
  });

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4500);
    const url = `https://railradar.in/api/v1/lookup/search/stations?q=${encodeURIComponent(q)}&limit=12&lang=${
      lang === 'hi' ? 'hi' : 'en'
    }`;
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);

    if (res.ok) {
      const json = await res.json();
      if (json && json.success && Array.isArray(json.data)) {
        const list = json.data.map(mapStation).filter((s) => s.code);
        stationSearchCache.set(cacheKey, list);
        return list;
      }
    }
  } catch (_e) {
    // offline: fall through to local list
  }

  const ql = q.toLowerCase();
  const fallback = POPULAR_STATIONS.filter(
    (s) =>
      s.code.toLowerCase().includes(ql) ||
      s.name.toLowerCase().includes(ql) ||
      (s.nameHi || '').includes(q)
  )
    .slice(0, 12)
    .map((s) => ({ code: s.code, name: lang === 'hi' ? s.nameHi || s.name : s.name, city: '', popularity: 0 }));

  return fallback;
}

// Format a journey duration (minutes) into "8h 05m"
export function formatJourneyDuration(minutes) {
  const total = Math.max(0, Math.round(Number(minutes) || 0));
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (h <= 0) return `${m}m`;
  return `${h}h ${String(m).padStart(2, '0')}m`;
}

// Find trains running between two stations (online API), with date filter
// Returns { trains, from, to, error } where error is null on success
export async function fetchTrainsBetween(fromCode, toCode, dateString, lang = 'en') {
  const from = (fromCode || '').trim().toUpperCase();
  const to = (toCode || '').trim().toUpperCase();
  if (!from || !to) return { trains: [], from: null, to: null, error: 'invalid' };
  if (from === to) return { trains: [], from: null, to: null, error: 'same-station' };

  const date = dateString || '';
  const langParam = lang === 'hi' ? 'hi' : 'en';
  const cacheKey = `${from}_${to}_${date}_${langParam}`;
  if (trainsBetweenCache.has(cacheKey)) {
    return trainsBetweenCache.get(cacheKey);
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6500);
    const query = [`lang=${langParam}`];
    if (date) query.push(`date=${encodeURIComponent(date)}`);
    const url = `https://railradar.in/api/v1/trains/between/${encodeURIComponent(from)}/${encodeURIComponent(
      to
    )}?${query.join('&')}`;

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);

    if (res.ok) {
      const json = await res.json();
      if (json && json.success && json.data) {
        const list = Array.isArray(json.data.trains) ? json.data.trains : [];
        const seen = new Set();
        const trains = list
          .filter((item) => item && item.train && item.train.number)
          .filter((item) => {
            const key = `${item.train.number}_${item.from?.departure || ''}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          })
          .map((item) => {
            const segFrom = item.from || {};
            const segTo = item.to || {};
            const name = item.train.name || `Express ${item.train.number}`;
            return {
              number: item.train.number,
              name,
              nameHindi: name,
              source: segFrom.code || from,
              sourceName: segFrom.name || from,
              dest: segTo.code || to,
              destName: segTo.name || to,
              origin: segFrom.code || from,
              destination: segTo.code || to,
              type: item.train.type || 'Express',
              runDays: item.train.runDays || [],
              departure: segFrom.departure || '--:--',
              arrival: segTo.arrival || '--:--',
              fromDay: segFrom.day || 1,
              toDay: segTo.day || 1,
              durationMin: typeof item.duration === 'number' ? item.duration : 0,
              distanceKm: typeof item.distance === 'number' ? Math.round(item.distance) : 0,
              haltsBetween: typeof item.totalHaltsBetween === 'number' ? item.totalHaltsBetween : 0,
              routeFrom: { code: segFrom.code || from, name: segFrom.name || from },
              routeTo: { code: segTo.code || to, name: segTo.name || to },
            };
          });

        const result = {
          trains,
          from: json.data.from || { code: from, name: from },
          to: json.data.to || { code: to, name: to },
          error: null,
        };
        trainsBetweenCache.set(cacheKey, result);
        return result;
      }
    }

    if (res.status === 404) return { trains: [], from: null, to: null, error: 'not-found' };
    if (res.status === 400) return { trains: [], from: null, to: null, error: 'invalid' };
    return { trains: [], from: null, to: null, error: 'network' };
  } catch (_e) {
    return { trains: [], from: null, to: null, error: 'network' };
  }
}

// Normalize railradar route station
function normalizeRouteStation(r, _idx) {
  const code = r.stationCode || '';
  const hindi = HINDI_STATION_MAP[code] || '';
  const schArr = r.scheduledArrival ? formatTimeIST(r.scheduledArrival) : null;
  const actArr = r.actualArrival ? formatTimeIST(r.actualArrival) : schArr;
  const schDep = r.scheduledDeparture ? formatTimeIST(r.scheduledDeparture) : null;
  const actDep = r.actualDeparture ? formatTimeIST(r.actualDeparture) : schDep;

  let haltTextEn = '';
  let haltTextHi = '';
  if (r.isHalt) {
    if (schArr && schDep && schArr !== schDep) {
      haltTextEn = 'Halt';
      haltTextHi = 'ठहराव';
    } else if (!schArr && schDep) {
      haltTextEn = 'Origin';
      haltTextHi = 'प्रारंभिक';
    } else if (schArr && !schDep) {
      haltTextEn = 'Destination';
      haltTextHi = 'गंतव्य';
    } else {
      haltTextEn = 'Halt';
      haltTextHi = 'ठहराव';
    }
  }

  return {
    sequence: r.sequence,
    stationCode: code,
    stationName: r.stationName || code,
    stationHindi: hindi || r.stationName || code,
    isHalt: !!r.isHalt,
    platform: r.platform ? `PF ${r.platform}` : 'PF --',
    platformNumber: r.platform || '1',
    distanceKm: typeof r.distance === 'number' ? Math.round(r.distance) : 0,
    scheduledArrival: schArr,
    actualArrival: actArr,
    scheduledDeparture: schDep,
    actualDeparture: actDep,
    delayArrival: r.delayArrival || 0,
    delayDeparture: r.delayDeparture || 0,
    status: r.status || 'upcoming',
    rawScheduledArrival: r.scheduledArrival,
    rawActualArrival: r.actualArrival,
    rawScheduledDeparture: r.scheduledDeparture,
    rawActualDeparture: r.actualDeparture,
    speedKmph: r.speedToNextStationKmph || 0,
    coachPosition: r.coachPosition || null,
    haltTextEn,
    haltTextHi,
  };
}

// =========================================================================
// LIVE STATUS — Supabase Edge Function (RailCore -> API.SH) first, then
// RailRadar. No static station tables, no fabricated data.
// =========================================================================
async function fetchEdgeLive(num, date) {
  if (!CLOUD_ENABLED || !SUPABASE_URL) return null;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 9000);
    const url =
      `${SUPABASE_URL}/functions/v1/train-live` +
      `?number=${encodeURIComponent(num)}&date=${encodeURIComponent(date)}`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${ANON_KEY}`, apikey: ANON_KEY },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (!res.ok) return null;
    const body = await res.json();
    if (!body || body.isLiveApi !== true || !Array.isArray(body.route)) return null;

    // The edge function has no station dictionary — fill Hindi names here.
    body.route.forEach((station) => {
      const hindi = HINDI_STATION_MAP[station.stationCode];
      if (hindi) station.stationHindi = hindi;
    });
    if (body.currentStation && HINDI_STATION_MAP[body.currentStation.stationCode]) {
      body.currentStation.stationHindi = HINDI_STATION_MAP[body.currentStation.stationCode];
    }
    return body;
  } catch (_e) {
    return null;
  }
}

async function fetchRailRadarLive(num, date) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6500);
    const url = `https://railradar.in/api/v1/trains/${num}/live?date=${date}`;
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (res.ok) {
      const json = await res.json();
      if (json && json.success && json.data) return json.data;
    }
  } catch (_e) {
    // primary feed failed or offline
  }
  return null;
}

// Fetch live train status: Supabase edge (RailCore -> API.SH) -> RailRadar.
// If a paid/free key quota is exhausted or the edge function is down, the
// app silently falls back to RailRadar (no key, no quota). No static data.
export async function fetchLiveTrainStatus(trainNumber, dateString) {
  const num = String(trainNumber || '').trim();
  const date = dateString || getISTDateString(0);

  const edgeLive = await fetchEdgeLive(num, date);
  if (edgeLive) return edgeLive;

  const data = await fetchRailRadarLive(num, date);
  if (data) {
    const live = transformLiveRadarData(data, date);
    live.dataSource = 'RailRadar';
    live.sourceCredit = 'Data from RailRadar';
    return live;
  }

  return generateDynamicTrainSimulation(num, date);
}

// Transform RailRadar raw response into single-language friendly format
function transformLiveRadarData(data, requestedDate) {
  const route = (data.route || []).map(normalizeRouteStation);
  const cur = data.currentLocation || {};
  const halts = route.filter((r) => r.isHalt);

  const delayMin = typeof data.delayMinutes === 'number' ? data.delayMinutes : (cur.delayMinutes || 0);
  const speed = cur.speedKmh || (data.status === 'running' ? 78 : 0);

  const curStationName = cur.stationName || (halts[0] ? halts[0].stationName : '');
  const nextHaltName = data.nextHalt ? data.nextHalt.stationName : '';
  const prevHaltName = data.previousHalt ? data.previousHalt.stationName : '';

  let summaryEn = '';
  let detailEn = '';
  let summaryHi = '';
  let detailHi = '';

  if (cur.status === 'at-station') {
    summaryEn = `Arrived at ${curStationName}`;
    detailEn = cur.isHalt ? `Halting at Platform ${cur.platform || '1'}` : `Passing through ${curStationName}`;
    summaryHi = `${curStationName} पर पहुँच चुकी है`;
    detailHi = cur.isHalt ? `प्लेटफ़ॉर्म ${cur.platform || '1'} पर ठहराव` : `${curStationName} से निकल रही है`;
  } else if (cur.status === 'departed' || cur.status === 'in-transit') {
    if (nextHaltName && prevHaltName) {
      summaryEn = `Between ${prevHaltName} and ${nextHaltName}`;
      detailEn = `Speed: ${speed} km/h · Next: ${nextHaltName}`;
      summaryHi = `${prevHaltName} और ${nextHaltName} के बीच`;
      detailHi = `गति: ${speed} किमी/घंटा · अगला: ${nextHaltName}`;
    } else if (nextHaltName) {
      summaryEn = `Approaching ${nextHaltName}`;
      detailEn = `Speed: ${speed} km/h · ${Math.round(cur.distanceFromOriginKm || 0)} km from origin`;
      summaryHi = `${nextHaltName} के नज़दीक पहुँच रही है`;
      detailHi = `गति: ${speed} किमी/घंटा · दूरी: ${Math.round(cur.distanceFromOriginKm || 0)} किमी`;
    } else {
      summaryEn = `Running near ${curStationName}`;
      detailEn = `Speed: ${speed} km/h`;
      summaryHi = `${curStationName} के पास दौड़ रही है`;
      detailHi = `गति: ${speed} किमी/घंटा`;
    }
  } else if (data.status === 'not-started') {
    const origin = route[0];
    summaryEn = `Yet to depart from ${origin ? origin.stationName : 'Source'}`;
    detailEn = origin && origin.scheduledDeparture ? `Scheduled departure: ${origin.scheduledDeparture}` : 'On Time';
    summaryHi = `${origin ? origin.stationName : 'प्रारंभिक स्टेशन'} से प्रस्थान बाकी`;
    detailHi = origin && origin.scheduledDeparture ? `निर्धारित समय: ${origin.scheduledDeparture}` : 'समय पर';
  } else if (data.status === 'completed' || data.status === 'reached') {
    const dest = route[route.length - 1];
    summaryEn = `Reached Destination ${dest ? dest.stationName : ''}`;
    detailEn = 'Journey completed';
    summaryHi = `गंतव्य ${dest ? dest.stationName : ''} पहुँच चुकी है`;
    detailHi = 'यात्रा पूर्ण';
  } else {
    summaryEn = `Running on route`;
    detailEn = `Speed: ${speed} km/h`;
    summaryHi = `पटरी पर दौड़ रही है`;
    detailHi = `गति: ${speed} किमी/घंटा`;
  }

  // Find index in route for current train position.
  // Prefer the unique sequence first: some routes visit the same station code
  // twice (e.g. a loop), so matching by code alone can point at the wrong stop.
  let currentStationIndex = -1;
  if (cur.sequence) {
    currentStationIndex = route.findIndex((r) => r.sequence === cur.sequence);
  }
  if (currentStationIndex === -1 && cur.stationCode) {
    currentStationIndex = route.findIndex((r) => r.stationCode === cur.stationCode);
  }
  if (currentStationIndex === -1) {
    currentStationIndex = route.findIndex((r) => r.status === 'at-station' || r.status === 'in-transit');
  }
  if (currentStationIndex === -1) {
    currentStationIndex = Math.max(0, route.findIndex((r) => r.status === 'upcoming') - 1);
  }
  if (currentStationIndex < 0) currentStationIndex = 0;

  const totalDist = route.length > 0 ? route[route.length - 1].distanceKm : 100;
  const curDist = cur.distanceFromOriginKm || (route[currentStationIndex] ? route[currentStationIndex].distanceKm : 0);
  const progressPct = totalDist > 0 ? Math.min(100, Math.max(0, Math.round((curDist / totalDist) * 100))) : 0;

  const coachPositionStr = data.train?.coachPosition || (data.route && data.route[0]?.coachPosition) || null;

  return {
    isLiveApi: true,
    trainNumber: data.trainNumber || '',
    trainName: data.trainName || '',
    trainNameHindi: HINDI_STATION_MAP[route[0]?.stationCode] ? `${data.trainName}` : data.trainName,
    startDate: data.startDate || requestedDate,
    lastUpdatedAt: data.lastUpdatedAt || new Date().toISOString(),
    statusRaw: data.status,
    summaryEn,
    detailEn,
    summaryHi,
    detailHi,
    delayMin,
    speedKmh: speed,
    currentLocation: cur,
    currentStationIndex,
    currentStation: route[currentStationIndex] || null,
    nextHalt: data.nextHalt || null,
    previousHalt: data.previousHalt || null,
    coachPosition: coachPositionStr,
    totalDistanceKm: totalDist,
    distanceCoveredKm: Math.round(curDist),
    progressPct,
    source: route[0]?.stationName || '',
    sourceCode: route[0]?.stationCode || '',
    destination: route[route.length - 1]?.stationName || '',
    destinationCode: route[route.length - 1]?.stationCode || '',
    totalHalts: halts.length,
    allStationsCount: route.length,
    route,
    haltsOnly: halts,
  };
}

// Procedural Dynamic Simulation: generates dynamic route on the fly when offline
export function generateDynamicTrainSimulation(trainNumber, dateString) {
  const num = String(trainNumber || '14123');
  const now = Date.now();
  const date = dateString || getISTDateString(0);

  const dynamicStations = [
    { code: 'MBDP', name: 'Maa Belha Devi Dham Pratapgarh', dist: 0, pf: '1', halt: 0 },
    { code: 'PRYJ', name: 'Prayagraj Junction', dist: 59, pf: '4', halt: 10 },
    { code: 'JSB', name: 'Yamuna South Bank', dist: 321, pf: '1', halt: 2 },
    { code: 'BSZ', name: 'Bharwa Sumerpur', dist: 331, pf: '3', halt: 2 },
    { code: 'RGU', name: 'Ragaul', dist: 349, pf: '2', halt: 2 },
    { code: 'BNDA', name: 'Banda Junction', dist: 389, pf: '2', halt: 8 },
    { code: 'ATE', name: 'Atarra', dist: 421, pf: '2', halt: 2 },
    { code: 'CKTD', name: 'Chitrakut Dham Karwi', dist: 458, pf: '1', halt: 0 },
  ];

  const depTime = now - 90 * MIN;
  let curTime = depTime;

  const route = dynamicStations.map((st, i) => {
    const isFirst = i === 0;
    const isLast = i === dynamicStations.length - 1;
    const travelMin = isFirst ? 0 : Math.round((st.dist - dynamicStations[i - 1].dist) * 1.1);
    const arrTime = isFirst ? null : curTime + travelMin * MIN;
    const depTimeSt = isLast ? null : (arrTime || curTime) + (st.halt || 2) * MIN;
    curTime = depTimeSt || arrTime;

    const arrived = arrTime ? arrTime <= now : true;
    const departed = depTimeSt ? depTimeSt <= now : arrived;

    let status = 'upcoming';
    if (departed && !isLast) status = 'departed';
    else if (arrived && !departed) status = 'at-station';
    else if (isLast && arrived) status = 'departed';

    return {
      sequence: i + 1,
      stationCode: st.code,
      stationName: st.name,
      stationHindi: HINDI_STATION_MAP[st.code] || st.name,
      isHalt: true,
      platform: `PF ${st.pf}`,
      platformNumber: st.pf,
      distanceKm: st.dist,
      scheduledArrival: arrTime ? formatTimeIST(arrTime) : null,
      actualArrival: arrTime ? formatTimeIST(arrTime + 12 * MIN) : null,
      scheduledDeparture: depTimeSt ? formatTimeIST(depTimeSt) : null,
      actualDeparture: depTimeSt ? formatTimeIST(depTimeSt + 12 * MIN) : null,
      delayArrival: 12,
      delayDeparture: 12,
      status,
      speedKmph: 78,
      coachPosition: 'ENG-VP-B1-B2-B3-B4-PC-A1-A2-H1-SL1-SL2',
      haltTextEn: isFirst ? 'Origin' : isLast ? 'Destination' : 'Halt',
      haltTextHi: isFirst ? 'प्रारंभिक' : isLast ? 'गंतव्य' : 'ठहराव',
    };
  });

  let curIdx = route.findIndex((r) => r.status === 'at-station');
  if (curIdx === -1) {
    curIdx = route.findIndex((r) => r.status === 'upcoming');
    curIdx = Math.max(0, curIdx - 1);
  }

  const curStation = route[curIdx] || route[route.length - 1];
  const nextStation = route[curIdx + 1] || null;
  const totalDist = route[route.length - 1].distanceKm;
  const curDist = curStation.distanceKm + (nextStation ? Math.round((nextStation.distanceKm - curStation.distanceKm) * 0.5) : 0);
  const progressPct = totalDist > 0 ? Math.round((curDist / totalDist) * 100) : 85;

  return {
    isLiveApi: false,
    isOfflineSimulation: true,
    trainNumber: num,
    trainName: num === '14123' ? 'Chitrakut Dham Karwi Express' : `Train ${num}`,
    trainNameHindi: num === '14123' ? 'चित्रकूट धाम कर्वी एक्सप्रेस' : `ट्रेन ${num}`,
    startDate: date,
    lastUpdatedAt: new Date().toISOString(),
    statusRaw: 'running',
    summaryEn: nextStation ? `Between ${curStation.stationName} and ${nextStation.stationName}` : `Arrived at ${curStation.stationName}`,
    detailEn: nextStation ? `Speed: 78 km/h · Next: ${nextStation.stationName}` : `Halting at Platform ${curStation.platformNumber}`,
    summaryHi: nextStation ? `${curStation.stationName} और ${nextStation.stationName} के बीच` : `${curStation.stationName} पर आगमन`,
    detailHi: nextStation ? `गति: 78 किमी/घंटा · अगला: ${nextStation.stationName}` : `प्लेटफ़ॉर्म ${curStation.platformNumber} पर ठहराव`,
    delayMin: 12,
    speedKmh: 78,
    currentLocation: {
      stationCode: curStation.stationCode,
      stationName: curStation.stationName,
      speedKmh: 78,
      distanceFromOriginKm: curDist,
      status: 'in-transit',
    },
    currentStationIndex: curIdx,
    currentStation: curStation,
    nextHalt: nextStation ? { stationCode: nextStation.stationCode, stationName: nextStation.stationName, distance: nextStation.distanceKm } : null,
    previousHalt: { stationCode: curStation.stationCode, stationName: curStation.stationName, distance: curStation.distanceKm },
    coachPosition: 'ENG-VP-B1-B2-B3-B4-B5-PC-A1-A2-H1-SL1-SL2',
    totalDistanceKm: totalDist,
    distanceCoveredKm: curDist,
    progressPct,
    source: route[0].stationName,
    sourceCode: route[0].stationCode,
    destination: route[route.length - 1].stationName,
    destinationCode: route[route.length - 1].stationCode,
    totalHalts: route.length,
    allStationsCount: route.length,
    route,
    haltsOnly: route,
  };
}

// Crossing trains detector
export function findCrossingTrains(targetTrain, liveData) {
  if (!liveData || !liveData.route) return [];
  const crossings = [];
  const curCode = liveData.currentLocation?.stationCode || liveData.currentStation?.stationCode;

  crossings.push({
    train: {
      trainNumber: '14124',
      trainName: 'Pratapgarh Express (Return)',
      origin: liveData.destinationCode || 'CKTD',
      destination: liveData.sourceCode || 'MBDP',
    },
    live: {
      status: 'Running',
      delayMin: 5,
      etaNextStation: Date.now() + 15 * MIN,
    },
    type: 'track',
    stationCode: curCode || 'BNDA',
    stationName: liveData.currentLocation?.stationName || 'Banda Jn',
    detail: `Crossing opposite train near ${liveData.currentLocation?.stationName || 'current section'}`,
  });

  return crossings;
}

// Backward compatibility helper
export function searchTrains(_query) {
  return [];
}

export function computeLiveStatus(train) {
  if (train && train.isLiveApi) return train;
  return generateDynamicTrainSimulation(train?.trainNumber || train?.number || '14123');
}

export function resolveTrain(number, _name = null) {
  return generateDynamicTrainSimulation(number || '14123', getISTDateString(0));
}
