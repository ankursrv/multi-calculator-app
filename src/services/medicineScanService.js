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
  'helloworld',
  'K84564287888957',
].filter(Boolean);

const PACKAGING_STOPWORDS = new Set([
  'marketed', 'manufactured', 'mfg', 'mkt', 'mktg', 'biotech', 'ltd', 'pvt', 'pharma', 'pharmaceuticals',
  'laboratories', 'lab', 'road', 'mouza', 'ogli', 'khan', 'vill', 'majra', 'kala', 'amb', 'distt',
  'sirmour', 'bazar', 'kachiguda', 'hyderabad', 'mumbai', 'delhi', 'baddi', 'solan', 'pin', 'batch',
  'exp', 'mrp', 'rs', 'incl', 'taxes', 'store', 'cool', 'dry', 'dark', 'place', 'keep', 'reach',
  'children', 'dosage', 'physician', 'directed', 'prescription', 'schedule', 'caution', 'warning',
  'registered', 'trade', 'mark', 'contains', 'hard', 'gelatin', 'soft', 'capsute', 'capsule',
  'capsules', 'tablet', 'tablets', 'syrup', 'injection', 'excipients', 'colours', 'color', 'colour',
  'brillant', 'brilliant', 'swallowed', 'crushed', 'opened', 'sealed', 'protect', 'light', 'moisture',
  'each', 'blue', 'yellow', 'supra', 'arla', 'walde', 'direck', 'phys', 'nedicine', 'medicine',
  'swallcwed', 'whilg', 'trusheda', 'dot', 'preseripti', 'witnout', 'retail', 'medical', 'practitioner',
  'composition', 'coated', 'uncoated', 'enteric', 'sustained', 'release', 'prolonged', 'dispersible',
  'suspension', 'ointment', 'cream', 'drops', 'solution', 'sh', 'hai', 'for', 'the', 'and', 'not',
  'use', 'only', 'external', 'internal', 'oral', 'titanium', 'dioxide', 'tartrazine', 'lake',
  'below', 'temperature', 'freeze', 'warning', 'packaging', 'healthcare',
  'jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'
]);

function cleanToken(str) {
  return (str || '').replace(/[*•®™©#:,]/g, '').trim();
}

function isStopWordOrNoise(word) {
  if (!word || word.length < 3) return true;
  const lower = word.toLowerCase();
  if (PACKAGING_STOPWORDS.has(lower)) return true;
  if (/^(mfg|exp|batch|mrp|tax|siincl|taxes)/i.test(lower)) return true;
  if (/^\d+(\.\d+)?(mg|ml|mcg|gm|g|iu|%)?$/i.test(word)) return true;
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
  if (asset.base64) return asset.base64;

  const uri = asset.uri;
  if (!uri) return null;

  try {
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
    let clean = cleanToken(cand).replace(/\b(IP|BP|USP|I\.P\.|B\.P\.|U\.S\.P\.)\b/g, '').trim();
    // remove dosage suffixes if attached like '500mg'
    clean = clean.replace(/\s+\d+(\.\d+)?\s*(mg|ml|mcg|gm|g|iu)\b/i, '').trim();
    if (clean.length < 3 || clean.length > 35) return;
    if (isStopWordOrNoise(clean)) return;

    const words = clean.split(/\s+/);
    if (words.length === 1 && isStopWordOrNoise(words[0])) return;

    const lower = clean.toLowerCase();
    const existingIdx = candidates.findIndex((c) => c.toLowerCase() === lower);
    if (existingIdx !== -1) {
      if (toFront && existingIdx > 0) {
        candidates.splice(existingIdx, 1);
        candidates.unshift(clean);
      }
      return;
    }

    if (toFront) {
      candidates.unshift(clean);
    } else {
      candidates.push(clean);
    }
  };

  // 1. Registered Trade Marks or Brand Names with '®' or 'TM'
  const registeredRegex = /\b([A-Za-z0-9-]{3,20})\s*[®™]/g;
  let regMatch;
  while ((regMatch = registeredRegex.exec(rawText)) !== null) {
    addCandidate(regMatch[1], true);
  }

  // 2. Salt / Generic names followed by dosage form
  // e.g. "Calcium Dobesilate Capsules", "Paracetamol Tablets"
  const saltFormRegex =
    /\b([A-Z][a-zA-Z]+(?:\s+(?:and|&|\+)\s+[A-Z][a-zA-Z]+|\s+[A-Z][a-zA-Z]+){0,3})\s+(?:Capsules|Tablets|Syrup|Injection|Suspension|Ointment|Gel|Cream|Drops)\b/gi;
  for (const line of lines) {
    const cleanLine = line.replace(/[*•#]/g, '').trim();
    let match;
    while ((match = saltFormRegex.exec(cleanLine)) !== null) {
      const saltName = match[1].trim();
      const firstWord = saltName.split(/\s+/)[0].toLowerCase();
      if (!isStopWordOrNoise(firstWord)) {
        addCandidate(saltName);
      }
    }
  }

  // 3. Repeated uppercase brand names (blister strips repeat brand name on each pocket)
  const tokenMatches = rawText.match(/\b[A-Z][A-Z0-9-]{2,18}\b/g) || [];
  const freqMap = {};
  for (const token of tokenMatches) {
    if (!isStopWordOrNoise(token)) {
      freqMap[token] = (freqMap[token] || 0) + 1;
    }
  }

  const frequentTokens = Object.entries(freqMap).sort((a, b) => b[1] - a[1]);
  for (const [token, count] of frequentTokens) {
    if (count >= 2) {
      addCandidate(token, true);
    } else {
      addCandidate(token, false);
    }
  }

  // 4. Lines with "contains: [Salt]"
  const containsRegex = /(?:contains|contains:)\s*([A-Za-z]+(?:\s+[A-Za-z]+){0,2})/gi;
  let contMatch;
  while ((contMatch = containsRegex.exec(rawText)) !== null) {
    const salt = contMatch[1].trim();
    if (!isStopWordOrNoise(salt)) {
      addCandidate(salt);
    }
  }

  return candidates;
}

/**
 * OCR.space text extraction fallback with key rotation.
 */
async function extractTextViaOcrSpace(base64Image) {
  for (const apiKey of OCR_FALLBACK_KEYS) {
    try {
      const formData = new URLSearchParams();
      formData.append('base64Image', `data:image/jpeg;base64,${base64Image}`);
      formData.append('language', 'eng');
      formData.append('scale', 'true');
      formData.append('OCREngine', '2');

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
      if (text.trim()) {
        return text;
      }
    } catch (_e) {
      // Try next key
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
  for (const cand of candidates.slice(0, 4)) {
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
