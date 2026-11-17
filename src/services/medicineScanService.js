/**
 * AI Medicine Image Scanner & Recognition Service.
 *
 * Capabilities:
 * 1. Google Gemini Flash Vision AI (if EXPO_PUBLIC_GEMINI_API_KEY is configured).
 * 2. High-precision OCR Engine fallback (OCR.space free tier - zero API keys required).
 * 3. Smart packaging regex extraction (identifies brand names, salt names, forms like capsules/tablets).
 * 4. Automatic clinical resolution via Tata 1mg / PharmEasy / OpenFDA.
 */

import { resolveMedicine } from './clinicalMedicineService.js';

// Dynamic require for expo-file-system to support web/node gracefully
let FileSystem = null;
try {
  FileSystem = require('expo-file-system');
} catch (_e) {
  // ignore
}

const REQUEST_TIMEOUT_MS = 15000;

const OCR_FALLBACK_KEYS = [
  process.env.EXPO_PUBLIC_OCR_SPACE_API_KEY,
  'K88854238788957',
  'K84564287888957',
  'K81546747288957',
  'helloworld',
].filter(Boolean);

const PACKAGING_STOPWORDS = new Set([
  'marketed', 'manufactured', 'mfg', 'mkt', 'mktg', 'biotech', 'ltd', 'pvt', 'pharma', 'pharmaceuticals',
  'laboratories', 'lab', 'labs', 'limited', 'road', 'mouza', 'ogli', 'khan', 'vill', 'majra', 'kala', 'amb', 'distt',
  'sirmour', 'bazar', 'kachiguda', 'hyderabad', 'mumbai', 'delhi', 'baddi', 'solan', 'pin', 'batch',
  'exp', 'mrp', 'rs', 'incl', 'taxes', 'store', 'cool', 'dry', 'dark', 'place', 'keep', 'reach',
  'children', 'dosage', 'physician', 'directed', 'prescription', 'schedule', 'caution', 'warning',
  'registered', 'trade', 'mark', 'contains', 'hard', 'gelatin', 'soft', 'capsute', 'capsule',
  'capsules', 'tablet', 'tablets', 'syrup', 'injection', 'suspension', 'ointment', 'cream', 'drops', 'solution',
  'excipients', 'colours', 'color', 'colour', 'brillant', 'brilliant', 'swallowed', 'crushed', 'opened', 'sealed',
  'protect', 'light', 'moisture', 'each', 'blue', 'yellow', 'supra', 'arla', 'walde', 'direck', 'phys', 'nedicine', 'medicine',
  'swallcwed', 'whilg', 'trusheda', 'dot', 'preseripti', 'witnout', 'retail', 'medical', 'practitioner',
  'composition', 'coated', 'uncoated', 'enteric', 'sustained', 'release', 'prolonged', 'dispersible',
  'sh', 'hai', 'for', 'the', 'and', 'not', 'use', 'only', 'external', 'internal', 'oral',
  'titanium', 'dioxide', 'tartrazine', 'lake', 'below', 'temperature', 'freeze', 'warning', 'packaging', 'healthcare', 'film-coated',
  'jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec',
  'siincl', 'ofalltaxes', 'taxes', 'sh preseripti', 'crusheda', 'opened', 'conta', 'bengaluru', 'bangalore', 'chennai', 'kolkata', 'pune', 'ahmedabad',
  'b.no', 'bno', 'batch no', 'mfg date', 'exp date'
]);

function cleanMedicineToken(str) {
  return (str || '')
    .replace(/[*•®™©#:,]/g, ' ')
    .replace(/\b(IP|BP|USP|I\.P\.|B\.P\.|U\.S\.P\.)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function isStopWordOrNoise(word) {
  if (!word || word.length < 2) return true;
  const lower = word.toLowerCase().trim();
  if (PACKAGING_STOPWORDS.has(lower)) return true;
  const root = lower.split(/[-/]/)[0];
  if (PACKAGING_STOPWORDS.has(root)) return true;
  if (/^(mfg|exp|batch|mrp|tax|siincl|ofalltaxes|lic|b\.?no|lot)/i.test(lower)) return true;
  if (/^\d+(\.\d+)?(mg|ml|mcg|gm|g|iu|%)?$/i.test(word)) return true;
  if (/^[A-Z]{1,3}\d{3,}$/i.test(word)) return true; // Batch codes like AZ12345
  if (/^\d{4,}$/.test(word)) return true; // Pincodes / dates
  return false;
}

async function fetchWithTimeout(url, options = {}, timeoutMs = REQUEST_TIMEOUT_MS) {
  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timer = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;
  try {
    return await fetch(url, {
      ...options,
      signal: controller ? controller.signal : undefined,
    });
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/**
 * Converts image asset to base64 string safely across Web, iOS and Android.
 */
export async function getBase64FromAsset(asset) {
  if (!asset) return null;
  if (asset.base64) {
    const b64 = String(asset.base64);
    const comma = b64.indexOf(',');
    return comma !== -1 ? b64.slice(comma + 1) : b64;
  }

  const uri = asset.uri;
  if (!uri) return null;

  try {
    // If uri is already a data URI (data:image/...)
    if (typeof uri === 'string' && uri.startsWith('data:')) {
      const comma = uri.indexOf(',');
      return comma !== -1 ? uri.slice(comma + 1) : uri;
    }

    const isWeb = typeof window !== 'undefined' && typeof document !== 'undefined';
    if (isWeb) {
      const res = await fetch(uri);
      const blob = await res.blob();
      return await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const resStr = String(reader.result || '');
          const commaIdx = resStr.indexOf(',');
          resolve(commaIdx !== -1 ? resStr.slice(commaIdx + 1) : resStr);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    }

    // Native (iOS/Android)
    if (FileSystem && typeof FileSystem.readAsStringAsync === 'function') {
      return await FileSystem.readAsStringAsync(uri, {
        encoding: 'base64',
      });
    }

    return null;
  } catch (_e) {
    return null;
  }
}

/**
 * Parses raw OCR text to extract high-confidence medicine candidates.
 */
export function extractMedicineCandidates(rawText) {
  if (!rawText || typeof rawText !== 'string') return [];
  const lines = rawText.split('\n').map((l) => l.trim()).filter(Boolean);
  const candidates = [];

  const addCandidate = (cand, toFront = false) => {
    if (!cand) return;
    let clean = cleanMedicineToken(cand);
    // remove dosage suffixes if attached like '650mg' or '650 mg' or '500'
    const withoutDosage = clean.replace(/\s+\d+(\.\d+)?\s*(mg|ml|mcg|gm|g|iu)?$/i, '').trim();

    for (const item of [withoutDosage, clean]) {
      if (!item || item.length < 3 || item.length > 55) continue;
      const lower = item.toLowerCase();
      if (PACKAGING_STOPWORDS.has(lower)) continue;

      const words = item.split(/\s+/);
      if (words.some((w) => PACKAGING_STOPWORDS.has(w.toLowerCase()))) continue;
      if (words.every((w) => isStopWordOrNoise(w))) continue;
      if (words.some((w) => isStopWordOrNoise(w.split('-')[0]))) continue;

      const existingIdx = candidates.findIndex((c) => c.toLowerCase() === lower);
      if (existingIdx !== -1) {
        if (toFront && existingIdx > 0) {
          candidates.splice(existingIdx, 1);
          candidates.unshift(item);
        }
      } else {
        if (toFront) candidates.unshift(item);
        else candidates.push(item);
      }
    }
  };

  // 1. Salt / Generic formulation ending in dosage form (Tablets, Capsules, Syrup, etc.)
  const formRegex =
    /\b([A-Z][a-zA-Z0-9-]+(?:\s+(?:and|&|\+|,)?\s+[A-Za-z0-9-]+){0,5})\s+(?:Dispersible\s+|Gastro-resistant\s+|Prolonged-release\s+|Sustained\s+Release\s+|Film-coated\s+|Uncoated\s+|Hard\s+gelatin\s+)?(?:Capsules?|Tablets?|Syrup|Injection|Suspension|Ointment|Gel|Cream|Drops|Solution)\b/gi;

  for (const line of lines) {
    let formMatch;
    while ((formMatch = formRegex.exec(line)) !== null) {
      const salt = formMatch[1].trim();
      const firstWord = salt.split(/\s+/)[0];
      if (!isStopWordOrNoise(firstWord)) {
        addCandidate(salt, false);
      }
    }
  }

  // 2. "contains:" lines
  const containsRegex = /(?:contains|contains:)\s*([A-Za-z]+(?:\s+[A-Za-z]+){0,3})/gi;
  let m;
  while ((m = containsRegex.exec(rawText)) !== null) {
    const salt = m[1].trim();
    if (!isStopWordOrNoise(salt)) {
      addCandidate(salt, false);
    }
  }

  // 3. Repeated brand tokens (e.g. TOCIL appearing multiple times across blister foil pockets)
  const tokenMatches = rawText.match(/\b[A-Za-z][A-Za-z0-9-]{2,18}\b/g) || [];
  const freqMap = {};
  for (const token of tokenMatches) {
    if (!isStopWordOrNoise(token)) {
      const key = token.toUpperCase();
      freqMap[key] = (freqMap[key] || 0) + 1;
    }
  }

  const frequentTokens = Object.entries(freqMap).sort((a, b) => b[1] - a[1]);
  // Reverse when unshifting so highest frequency ends up at the very front
  for (const [token, count] of frequentTokens.slice().reverse()) {
    if (count >= 2) {
      addCandidate(token, true);
    }
  }

  // 4. Standalone Brand Name line (1 to 4 words, e.g. "Dolo 650", "Azithral 500", "Augmentin 625 Duo", "Pan-D", "TOCIL")
  for (const line of lines) {
    if (
      /(?:Marketed|Manufactured|Biotech|Laboratories|Pharma|Road|Vill|Distt|Bazar|contains|Store|swallowed|opened|crushed|Prescription|Schedule|Batch|Expiry|Mfg|Lic|Limited|Ltd|Pvt|GlaxoSmithKline|Micro\s+Labs|Alkem|Cipla|Sun\s+Pharma|Dr\s+Reddy)/i.test(
        line
      )
    ) {
      continue;
    }

    const cleanL = cleanMedicineToken(line);
    const words = cleanL.split(/\s+/).filter(Boolean);
    if (words.length >= 1 && words.length <= 4) {
      const first = words[0];
      if (
        /^[A-Za-z][A-Za-z0-9-]{2,20}$/.test(first) &&
        !isStopWordOrNoise(first) &&
        !/^(each|hard|soft|film|tablet|tablets|capsule|capsules|syrup|excipients)$/i.test(first)
      ) {
        addCandidate(cleanL, true);
      }
    }
  }

  // 5. Registered Trade Marks or Brand Names with '®' or 'TM' (Highest Priority)
  const regRegex = /\b([A-Za-z0-9-]{3,25})\s*[®™]/g;
  let regM;
  while ((regM = regRegex.exec(rawText)) !== null) {
    if (!isStopWordOrNoise(regM[1])) {
      addCandidate(regM[1], true);
    }
  }

  return candidates;
}

/**
 * OCR.space text extraction fallback with key rotation and dual-engine fallback.
 */
async function extractTextViaOcrSpace(base64Image) {
  for (const engine of ['2', '1']) {
    for (const apiKey of OCR_FALLBACK_KEYS) {
      try {
        const formData = new URLSearchParams();
        formData.append('base64Image', `data:image/jpeg;base64,${base64Image}`);
        formData.append('language', 'eng');
        formData.append('scale', 'true');
        formData.append('isOverlayRequired', 'false');
        formData.append('OCREngine', engine);

        const res = await fetchWithTimeout(
          'https://api.ocr.space/parse/image',
          {
            method: 'POST',
            headers: {
              apikey: apiKey,
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: formData.toString(),
          },
          12000
        );

        if (!res.ok) continue;
        const data = await res.json();
        if (data?.IsErroredOnProcessing) {
          // Try next key if rate limit or error
          continue;
        }

        const text = data?.ParsedResults?.[0]?.ParsedText || '';
        if (text && text.trim().length > 10) {
          return text;
        }
      } catch (_e) {
        // Try next key
      }
    }
  }

  return null;
}

/**
 * Optional Gemini Flash Vision AI recognition if EXPO_PUBLIC_GEMINI_API_KEY is set.
 */
async function scanWithGeminiVision(base64Image, apiKey) {
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    const payload = {
      contents: [
        {
          parts: [
            {
              text:
                'You are an expert pharmacist AI assistant. Analyze this medicine strip, bottle, or packaging image. ' +
                'Identify the brand name and the active generic salt name. ' +
                'Return ONLY a valid JSON object in this format (no markdown, no backticks):\n' +
                '{"brandName": "Exact Brand Name or null", "genericName": "Exact Generic Salt Name or null", "candidates": ["primary search name", "secondary search name"]}',
            },
            {
              inlineData: {
                mimeType: 'image/jpeg',
                data: base64Image,
              },
            },
          ],
        },
      ],
      generationConfig: {
        responseMimeType: 'application/json',
      },
    };

    const res = await fetchWithTimeout(
      url,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      },
      12000
    );

    if (!res.ok) return null;
    const json = await res.json();
    const rawText = json?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) return null;

    const parsed = JSON.parse(rawText.trim());
    const candidates = [];
    if (parsed.brandName) candidates.push(parsed.brandName);
    if (parsed.genericName && !candidates.includes(parsed.genericName)) {
      candidates.push(parsed.genericName);
    }
    if (Array.isArray(parsed.candidates)) {
      for (const c of parsed.candidates) {
        if (c && !candidates.includes(c)) candidates.push(c);
      }
    }
    return candidates.length > 0 ? candidates : null;
  } catch (_e) {
    return null;
  }
}

/**
 * Main function: scans a captured/uploaded medicine image and resolves live clinical data.
 *
 * @param {Object} asset - ImagePicker asset { uri, base64 }
 * @returns {Promise<{success: boolean, medicine?: Object, searchTerm?: string, candidates?: string[], rawText?: string, error?: string}>}
 */
export async function scanMedicineImage(asset) {
  if (!asset) {
    return { success: false, error: 'कोई फोटो नहीं मिली।' };
  }

  // 1. Get Base64 image
  const base64 = await getBase64FromAsset(asset);
  if (!base64) {
    return { success: false, error: 'फोटो को प्रोसेस करने में समस्या आई।' };
  }

  let candidates = [];
  let rawText = '';

  // 2. Try Gemini Vision if API key is present
  const geminiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
  if (geminiKey) {
    const geminiCandidates = await scanWithGeminiVision(base64, geminiKey);
    if (geminiCandidates && geminiCandidates.length > 0) {
      candidates = geminiCandidates;
    }
  }

  // 3. Fallback to free OCR Engine if Gemini is not set or gave no candidates
  if (candidates.length === 0) {
    rawText = (await extractTextViaOcrSpace(base64)) || '';
    if (rawText) {
      candidates = extractMedicineCandidates(rawText);
    }
  }

  if (candidates.length === 0) {
    return {
      success: false,
      error: 'फोटो से दवा का नाम स्पष्ट नहीं पढ़ा जा सका।',
      rawText,
    };
  }

  // 4. Resolve clinical medicine details by testing candidates in order of confidence
  for (const cand of candidates.slice(0, 6)) {
    try {
      const medData = await resolveMedicine(cand);
      if (medData) {
        return {
          success: true,
          medicine: medData,
          searchTerm: cand,
          candidates,
          rawText,
        };
      }
    } catch (_e) {
      // Try next candidate
    }
  }

  // 5. If no clinical record found, still return top recognized candidate so user can view/adjust
  return {
    success: false,
    candidate: candidates[0],
    candidates,
    rawText,
    error: 'दवा का नाम पहचाना गया, लेकिन क्लिनिकल डेटाबेस में विवरण नहीं मिला।',
  };
}
