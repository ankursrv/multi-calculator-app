// @ts-nocheck — this file runs in Supabase's Deno runtime; app tsconfig
// deliberately excludes supabase/functions, so editors using the app config
// cannot resolve Deno globals (Deno, Response) here.
// Supabase Edge Function: live train status with full station coverage.
//
// Keys live in Supabase secrets (RAILCORE_KEY, APISH_KEY) and are NEVER sent
// to the app. Source order: RailCore -> API.SH. If neither answers, the app
// falls back to RailRadar directly.
//
// Deploy:  supabase functions deploy train-live
// Secrets: supabase secrets set RAILCORE_KEY=... APISH_KEY=...

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
};

const RAILCORE_BASE = 'https://ir.railcore.tech/v1';
const APISH_BASE = 'https://api.api.sh/indian-rail/v1';

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}

function clock(value: unknown): string | null {
  if (!value) return null;
  const raw = String(value);
  const match = raw.match(/(\d{1,2}):(\d{2})/);
  if (match) return `${match[1].padStart(2, '0')}:${match[2]}`;
  const date = new Date(raw);
  if (isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Kolkata',
  }).format(date);
}

function istDate(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

async function getJson(url: string, headers: Record<string, string>, ms = 8000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    const res = await fetch(url, { headers, signal: controller.signal });
    if (!res.ok) return null;
    const body = await res.json();
    return body && typeof body === 'object' ? body : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

// ---------------------------------------------------------------- RailCore
async function fromRailCore(number: string, date: string) {
  const key = Deno.env.get('RAILCORE_KEY');
  if (!key) return null;
  const body = await getJson(
    `${RAILCORE_BASE}/trains/${encodeURIComponent(number)}/live?date=${encodeURIComponent(date)}`,
    { 'X-RailCore-Key': key }
  );
  if (!body || body.success === false || !body.data) return null;
  const d = body.data;
  const rawStops = Array.isArray(d.stations) ? d.stations : [];
  if (rawStops.length === 0) return null;

  const route = rawStops.map((s: any, i: number) => {
    const isHalt = s.is_stopping === true || s.stop_type === 'HALT' || s.stop_type === 'ORIGIN' || s.stop_type === 'DESTINATION';
    const hasDeparted = s.has_departed === true;
    const hasArrived = s.has_arrived === true;
    const platform = s.platform_number ? String(s.platform_number) : '';
    const scheduledArrival = clock(s.scheduled_arrival);
    const scheduledDeparture = clock(s.scheduled_departure);
    return {
      sequence: s.sequence ?? i + 1,
      stationCode: s.station_code || '',
      stationName: s.station_name || s.station_code || '',
      stationHindi: s.station_name || s.station_code || '',
      isHalt,
      platform: platform ? `PF ${platform}` : null,
      platformNumber: platform || null,
      distanceKm: typeof s.distance_km === 'number' ? Math.round(s.distance_km * 10) / 10 : 0,
      scheduledArrival,
      actualArrival: clock(s.actual_arrival) || (hasArrived ? clock(s.eta) : null),
      scheduledDeparture,
      actualDeparture: clock(s.actual_departure) || (hasDeparted ? clock(s.etd) : null),
      delayArrival: typeof s.delay_arrival_minutes === 'number' ? s.delay_arrival_minutes : 0,
      delayDeparture: typeof s.delay_departure_minutes === 'number' ? s.delay_departure_minutes : 0,
      status: hasDeparted ? 'departed' : hasArrived ? 'at-station' : 'upcoming',
      haltTextEn: s.stop_type === 'ORIGIN' ? 'Origin' : s.stop_type === 'DESTINATION' ? 'Destination' : isHalt ? 'Halt' : '',
      haltTextHi: '',
      speedKmph: 0,
      coachPosition: null,
    };
  });

  return assemble({
    number,
    trainName: d.train_name || '',
    route,
    currentCode: d.current_station_code || '',
    previousCode: d.previous_station_code || '',
    nextCode: d.next_station_code || '',
    delayMin: typeof d.delay_minutes === 'number' ? d.delay_minutes : 0,
    speed: typeof d.speed_kmph === 'number' ? d.speed_kmph : 0,
    speedBasis: d.speed_basis || '',
    statusRaw: d.status || '',
    statusText: d.status_text || '',
    progress: typeof d.progress_percent === 'number' ? d.progress_percent / 100 : 0,
    lastUpdatedAt: d.last_reported_at || new Date().toISOString(),
    journeyDate: d.journey_date || d.start_date || istDate(),
    freshnessState: d.freshness?.state || '',
    dataSource: 'RailCore',
    sourceCredit: 'Data from RailCore',
  });
}

// ------------------------------------------------------------------ API.SH
async function fromApiSh(number: string, date: string) {
  const key = Deno.env.get('APISH_KEY');
  if (!key) return null;
  const body = await getJson(
    `${APISH_BASE}/live-status?number=${encodeURIComponent(number)}&date=${encodeURIComponent(date)}`,
    { 'x-api-key': key }
  );
  if (!body || body.success === false) return null;
  const rawStops = Array.isArray(body.stations) ? body.stations : [];
  if (rawStops.length === 0) return null;
  const passedStops = rawStops.filter((s: any) => s.passed).length;

  const route = rawStops.map((s: any, i: number) => {
    const isHalt = s.halt_min > 0;
    return {
      sequence: s.seq ?? i + 1,
      stationCode: s.code || '',
      stationName: s.name || s.code || '',
      stationHindi: s.name || s.code || '',
      isHalt,
      platform: s.platform && s.platform !== '-1' ? `PF ${s.platform}` : null,
      platformNumber: s.platform && s.platform !== '-1' ? String(s.platform) : null,
      distanceKm: typeof s.distance_km === 'number' ? s.distance_km : 0,
      scheduledArrival: clock(s.scheduled_arrival),
      actualArrival: clock(s.expected_arrival),
      scheduledDeparture: clock(s.scheduled_departure),
      actualDeparture: clock(s.expected_departure),
      delayArrival: typeof s.arrival_delay_min === 'number' ? s.arrival_delay_min : 0,
      delayDeparture: typeof s.departure_delay_min === 'number' ? s.departure_delay_min : 0,
      status: s.passed ? 'departed' : 'upcoming',
      haltTextEn: isHalt ? 'Halt' : '',
      haltTextHi: '',
      speedKmph: 0,
      coachPosition: null,
    };
  });

  return assemble({
    number,
    trainName: body.name || '',
    route,
    currentCode: body.status?.current_station?.code || '',
    previousCode: '',
    nextCode: body.status?.next_stop?.code || '',
    delayMin: typeof body.status?.delay_min === 'number' ? body.status.delay_min : 0,
    speed: 0,
    speedBasis: '',
    statusRaw: body.status?.state || '',
    statusText: body.status?.message || body.status?.title || '',
    progress: rawStops.length > 0 ? passedStops / rawStops.length : 0,
    lastUpdatedAt: body.fetched_at || new Date().toISOString(),
    journeyDate: body.start_date || istDate(),
    freshnessState: body.cached ? 'cached' : 'fresh',
    dataSource: 'API.SH',
    sourceCredit: 'Data from API.SH',
  });
}

// ------------------------------------------------------- shared assembly
function assemble(o: {
  number: string;
  trainName: string;
  route: any[];
  currentCode: string;
  previousCode: string;
  nextCode: string;
  delayMin: number;
  speed: number;
  speedBasis: string;
  statusRaw: string;
  statusText: string;
  progress: number;
  lastUpdatedAt: string;
  journeyDate: string;
  freshnessState: string;
  dataSource: string;
  sourceCredit: string;
}) {
  const route = o.route;
  let currentIndex = route.findIndex((s) => s.stationCode === o.currentCode);
  if (currentIndex < 0) currentIndex = route.findIndex((s) => s.status === 'at-station');
  // -1 means "position unknown" — never mark a guessed station as current.

  const current = currentIndex >= 0 ? route[currentIndex] : null;
  const next = route.find((s) => s.stationCode === o.nextCode) || route[currentIndex + 1] || null;
  const prev = route.find((s) => s.stationCode === o.previousCode) || route[currentIndex - 1] || null;
  const halts = route.filter((s) => s.isHalt);
  const summaryEn = o.statusText || (next ? `Between ${current?.stationName || ''} and ${next.stationName}` : `Running on route`);
  const summaryHi = summaryEn;
  const detailEn = next ? `Next: ${next.stationName}` : `Journey in progress`;
  const detailHi = detailEn;

  return {
    isLiveApi: true,
    isOfflineSimulation: false,
    trainNumber: o.number,
    trainName: o.trainName,
    trainNameHindi: o.trainName,
    startDate: o.journeyDate,
    lastUpdatedAt: o.lastUpdatedAt,
    statusRaw: o.statusRaw,
    summaryEn,
    detailEn,
    summaryHi,
    detailHi,
    delayMin: o.delayMin,
    speedKmh: o.speed,
    speedBasis: o.speedBasis,
    currentLocation: {
      stationCode: current?.stationCode || o.currentCode,
      stationName: current?.stationName || o.currentCode,
      status: o.statusRaw,
    },
    currentStationIndex: currentIndex,
    currentStation: current,
    nextHalt: next ? { stationCode: next.stationCode, stationName: next.stationName } : null,
    previousHalt: prev ? { stationCode: prev.stationCode, stationName: prev.stationName } : null,
    coachPosition: null,
    totalDistanceKm: route.length ? route[route.length - 1].distanceKm : 0,
    distanceCoveredKm: current ? current.distanceKm : 0,
    progressPct: Math.max(0, Math.min(100, Math.round(o.progress * 100))),
    source: route[0]?.stationName || '',
    sourceCode: route[0]?.stationCode || '',
    destination: route[route.length - 1]?.stationName || '',
    destinationCode: route[route.length - 1]?.stationCode || '',
    totalHalts: halts.length,
    allStationsCount: route.length,
    route,
    haltsOnly: halts,
    dataSource: o.dataSource,
    sourceCredit: o.sourceCredit,
    freshnessState: o.freshnessState,
    isStale: o.freshnessState === 'stale',
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  const url = new URL(req.url);
  const number = (url.searchParams.get('number') || '').trim();
  const date = url.searchParams.get('date') || istDate();

  if (!/^\d{4,6}$/.test(number)) {
    return json({ error: 'INVALID_TRAIN_NUMBER' }, 400);
  }

  // RailCore first: it returns passing stations with names, times and coords.
  const railCore = await fromRailCore(number, date);
  if (railCore) return json(railCore);

  const apiSh = await fromApiSh(number, date);
  if (apiSh) return json(apiSh);

  return json({ error: 'UPSTREAMS_UNAVAILABLE' }, 503);
});
