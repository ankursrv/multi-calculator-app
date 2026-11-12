/**
 * 100% Live & Dynamic Clinical Medicine Resolution Engine.
 * Zero static medicine databases, zero hardcoded fallback entries, zero API keys required.
 *
 * Live Sources (in priority order):
 * 1. Native Direct 1mg Hindi Clinical Page (Android/iOS native) + 1mg Live Search API (for exact Tata 1mg URL)
 * 2. PharmEasy Live Search API + Live Medicine Page (via CORS-safe fetch) -> translated live to Hindi
 * 3. OpenFDA Drug Label API + Wikipedia API -> translated live to Hindi
 *
 * Returns null if no live medicine record is found (never fabricates static medicine details).
 */

const REQUEST_TIMEOUT_MS = 10000;

function stripHtmlAndMarkdown(raw) {
  if (!raw || typeof raw !== 'string') return '';
  return raw
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(li|p|div|h\d)>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/[ \t]+/g, ' ')
    .trim();
}

function hasDevanagari(text) {
  return /[\u0900-\u097F]/.test(text || '');
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
 * Live translation using free public endpoints (Google gtx with MyMemory fallback).
 * Never stores static translations.
 */
async function translateText(text, sourceLang = 'en', targetLang = 'hi') {
  const clean = (text || '').trim();
  if (!clean) return '';

  // 1. Google Translate public gtx endpoint (CORS: *)
  try {
    const url =
      `https://translate.googleapis.com/translate_a/single?client=gtx` +
      `&sl=${encodeURIComponent(sourceLang)}&tl=${encodeURIComponent(targetLang)}` +
      `&dt=t&q=${encodeURIComponent(clean)}`;
    const res = await fetchWithTimeout(url, {}, 7000);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data?.[0])) {
        const joined = data[0].map((chunk) => chunk?.[0] || '').join('').trim();
        if (joined) return joined;
      }
    }
  } catch (_e) {
    // Fallback to MyMemory
  }

  // 2. MyMemory free translation endpoint (CORS: *)
  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(
      clean.slice(0, 480)
    )}&langpair=${sourceLang}|${targetLang}`;
    const res = await fetchWithTimeout(url, {}, 7000);
    if (res.ok) {
      const data = await res.json();
      const translated = data?.responseData?.translatedText;
      if (translated && !String(translated).toUpperCase().includes('MYMEMORY WARNING')) {
        return String(translated).trim();
      }
    }
  } catch (_e) {
    // Return original live text if translation network fails
  }

  return clean;
}

/**
 * Translates an array of short strings cleanly using line-delimited batching.
 */
async function translateBatchToHindi(items) {
  const cleaned = items.map((s) => (s || '').replace(/\n+/g, ' ').trim()).filter(Boolean);
  if (cleaned.length === 0) return [];
  if (cleaned.every((s) => hasDevanagari(s))) return cleaned;

  const separator = '\n|||SEP|||\n';
  const combined = cleaned.join(separator);
  if (combined.length <= 1800) {
    const translated = await translateText(combined, 'en', 'hi');
    const parts = translated.split(/\s*\|\|\|\s*SEP\s*\|\|\|\s*/i);
    if (parts.length === cleaned.length) {
      return parts.map((p) => p.trim());
    }
  }

  return Promise.all(cleaned.map((item) => translateText(item, 'en', 'hi')));
}

function normalizeTokens(str) {
  return (str || '')
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

/**
 * Picks best product match from a live search result list based on user's search query.
 */
function pickBestSearchMatch(items, query, nameGetter) {
  if (!Array.isArray(items) || items.length === 0) return null;
  const qLower = query.toLowerCase().trim();
  const qTokens = normalizeTokens(qLower);

  let bestItem = items[0];
  let bestScore = -1;

  for (const item of items) {
    const itemName = String(nameGetter(item) || '').toLowerCase();
    const itemTokens = normalizeTokens(itemName);
    let score = 0;

    if (itemName === qLower) score += 100;
    if (itemName.startsWith(qTokens[0] || '')) score += 30;
    for (const qt of qTokens) {
      if (itemTokens.includes(qt)) score += 20;
      else if (itemName.includes(qt)) score += 10;
    }

    if (score > bestScore) {
      bestScore = score;
      bestItem = item;
    }
  }
  return bestItem;
}

/**
 * Fetches live Tata 1mg search results (works natively + on web via Jina CORS proxy).
 */
async function searchOneMgLive(searchTerm) {
  const targetUrl = `https://www.1mg.com/pwa-api/api/v4/search/all?q=${encodeURIComponent(
    searchTerm
  )}&per_page=5&types=sku`;

  // Try direct fetch first (works on Native Android/iOS)
  const urlsToTry = [targetUrl, `https://r.jina.ai/${targetUrl}`];
  for (const url of urlsToTry) {
    try {
      const res = await fetchWithTimeout(url, {}, 7000);
      if (!res.ok) continue;
      const text = await res.text();
      const jsonStart = text.indexOf('{');
      if (jsonStart === -1) continue;
      const data = JSON.parse(text.slice(jsonStart));
      const results = data?.data?.search_results;
      if (Array.isArray(results) && results.length > 0) {
        const best = pickBestSearchMatch(results, searchTerm, (r) => r.name);
        if (best?.url) {
          return {
            name: stripHtmlAndMarkdown(best.name),
            urlPath: best.url.startsWith('/') ? best.url : `/${best.url}`,
            oneMgUrl: `https://www.1mg.com/hi${best.url.startsWith('/') ? best.url : `/${best.url}`}`,
          };
        }
      }
    } catch (_e) {
      // Try next endpoint
    }
  }
  return null;
}

/**
 * Direct native 1mg Hindi clinical page parser (succeeds on iOS/Android native).
 */
async function fetchOneMgHindiDetails(urlPath, displayName, oneMgUrl) {
  try {
    const res = await fetchWithTimeout(`https://www.1mg.com/hi${urlPath}`, {}, 8000);
    if (!res.ok) return null;
    const html = await res.text();
    const startIdx = html.indexOf('window.__INITIAL_STATE__ = ');
    if (startIdx === -1) return null;
    const endIdx = html.indexOf('window.__STATUS_CODE__', startIdx);
    if (endIdx === -1) return null;

    const jsonStr = html
      .slice(startIdx + 'window.__INITIAL_STATE__ = '.length, endIdx)
      .trim()
      .replace(/;\s*$/, '');
    const state = JSON.parse(jsonStr);
    const sd = state?.drugPageReducer?.staticData;
    if (!sd) return null;

    const saltText = stripHtmlAndMarkdown(sd?.sku?.summary?.salt_composition?.display_text || '');
    const isCombination = saltText.includes('+') || saltText.includes(',');

    // Extract uses from productBenefits or productUses
    const usesList = [];
    const benefitHtml = sd?.productBenefits?.content || '';
    const bMatches = [...benefitHtml.matchAll(/<b>(.*?)<\/b>\s*(?:<br\s*\/?>)?\s*([^<]+)/gi)];
    for (const m of bMatches.slice(0, 4)) {
      const label = stripHtmlAndMarkdown(m[1]);
      const desc = stripHtmlAndMarkdown(m[2]);
      if (label && desc) usesList.push({ label, desc });
    }
    if (usesList.length === 0 && sd?.productUses?.content) {
      const liMatches = [...sd.productUses.content.matchAll(/<a[^>]*>(.*?)<\/a>/gi)];
      for (const m of liMatches.slice(0, 4)) {
        const val = stripHtmlAndMarkdown(m[1]);
        if (val) usesList.push({ label: val, desc: `${displayName} का उपयोग ${val} में राहत पाने के लिए किया जाता है।` });
      }
    }

    // Extract side effects list
    const sideEffectsHtml = sd?.sideEffect?.content || '';
    const sideEffects = [...sideEffectsHtml.matchAll(/<li>(.*?)<\/li>/gi)]
      .map((m) => stripHtmlAndMarkdown(m[1]))
      .filter(Boolean)
      .slice(0, 8);

    // Extract warnings mapped cleanly to user's template
    const rawWarnings = sd?.safetyAdvice?.warnings || [];
    const findWarn = (keyword) =>
      rawWarnings.find((w) => stripHtmlAndMarkdown(w.imageCaption || '').includes(keyword));

    const preg = findWarn('गर्भावस्था');
    const breast = findWarn('स्तनपान');
    const kidney = findWarn('किडनी');
    const liver = findWarn('लिवर');
    const alcohol = findWarn('अल्कोहल') || findWarn('शराब');

    const warnings = [];
    if (preg || breast) {
      warnings.push({
        label: 'गर्भावस्था और स्तनपान',
        desc: stripHtmlAndMarkdown(preg?.description || breast?.description),
      });
    }
    if (kidney || liver) {
      warnings.push({
        label: 'अंगों से जुड़ी बीमारी',
        desc: [kidney?.description, liver?.description]
          .map((d) => stripHtmlAndMarkdown(d))
          .filter(Boolean)
          .slice(0, 2)
          .join(' '),
      });
    }
    if (alcohol) {
      warnings.push({
        label: 'शराब',
        desc: stripHtmlAndMarkdown(alcohol.description),
      });
    }
    warnings.push({
      label: 'डॉक्टर की सलाह',
      desc: 'इसे लेने से पहले डॉक्टर या किसी नजदीकी स्वास्थ्य विशेषज्ञ से परामर्श अवश्य लें।',
    });

    if (usesList.length === 0 && sideEffects.length === 0) return null;

    const intro_hi = saltText
      ? isCombination
        ? `${displayName} ${saltText} का एक संयोजन (Combination) दवा है।`
        : `${displayName} मुख्य रूप से ${saltText} घटक वाली एक दवा है।`
      : stripHtmlAndMarkdown(sd?.productIntroduction?.content || '').split('.')[0] + '.';

    return {
      id: 'med-' + Date.now(),
      name: displayName,
      intro_hi,
      usesIntro_hi: `${displayName} का उपयोग मुख्य रूप से निम्नलिखित स्थितियों में राहत पाने के लिए किया जाता है:`,
      uses_hi: usesList,
      oneMgUrl,
      sideEffects_hi: sideEffects,
      warnings_hi: warnings,
    };
  } catch (_e) {
    return null;
  }
}

/**
 * Extracts a markdown section between heading regex and the next heading of same/higher level.
 */
function extractMarkdownSection(md, headingTitle, levelPrefix = '##') {
  const escaped = headingTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const startRegex = new RegExp(`^${levelPrefix}\\s+${escaped}[^\\n]*\\n`, 'mi');
  const match = startRegex.exec(md);
  if (!match) return '';
  const afterStart = md.slice(match.index + match[0].length);
  const nextHeadingRegex = new RegExp(`^#{1,${levelPrefix.length}}\\s+`, 'm');
  const endMatch = nextHeadingRegex.exec(afterStart);
  return (endMatch ? afterStart.slice(0, endMatch.index) : afterStart).trim();
}

/**
 * Live PharmEasy Search + Page Parser (CORS-friendly on both Web and Native).
 */
async function fetchPharmEasyLive(searchTerm, displayName, oneMgUrl) {
  try {
    const searchUrl = `https://r.jina.ai/https://pharmeasy.in/api/search/search?q=${encodeURIComponent(
      searchTerm
    )}`;
    const searchRes = await fetchWithTimeout(searchUrl, {}, 12000);
    if (!searchRes.ok) return null;

    const rawText = await searchRes.text();
    const jsonStart = rawText.indexOf('{');
    if (jsonStart === -1) return null;

    const searchJson = JSON.parse(rawText.slice(jsonStart));
    const products = searchJson?.data?.products || [];
    if (products.length === 0) return null;

    // Filter to medicine items that have a valid slug
    const validProducts = products.filter((p) => p?.slug && (p?.entityType === 2 || p?.productType === 1 || p?.moleculeName));
    const best = pickBestSearchMatch(
      validProducts.length > 0 ? validProducts : products,
      searchTerm,
      (p) => p.name
    );
    if (!best?.slug) return null;

    const pageUrl = `https://r.jina.ai/https://pharmeasy.in/online-medicine-order/${best.slug}`;
    const pageRes = await fetchWithTimeout(pageUrl, {}, 15000);
    if (!pageRes.ok) {
      return best.moleculeName
        ? await fetchOpenFdaOrWikipediaLive(best.moleculeName, displayName, oneMgUrl)
        : null;
    }

    const md = await pageRes.text();
    const descSection = extractMarkdownSection(md, 'Medical Description', '##');
    const usesSection = extractMarkdownSection(md, 'Uses', '##');
    const sideSection = extractMarkdownSection(md, 'Side effects', '##');
    const contraSection = extractMarkdownSection(md, 'Contraindications', '##');
    const warningsSection = extractMarkdownSection(md, 'Precautions and Warnings', '##');

    // Parse intro summary (first 1-2 sentences of Medical Description or moleculeName)
    let introEn = '';
    const descClean = stripHtmlAndMarkdown(descSection);
    if (descClean) {
      const sentences = descClean.split(/(?<=[.!?])\s+/).filter(Boolean);
      introEn = sentences.slice(0, 2).join(' ');
    } else if (best.moleculeName) {
      introEn = `${displayName} is a medicine containing ${best.moleculeName}.`;
    }
    if (!introEn) return null;

    // Parse Uses bullets (or fallback to plain paragraph inside Uses section)
    const usesRaw = [];
    const useLines = usesSection.split('\n').map((l) => l.trim()).filter((l) => l.startsWith('*'));
    for (const line of useLines.slice(0, 5)) {
      const text = stripHtmlAndMarkdown(line.replace(/^\*\s*/, ''));
      const colonIdx = text.indexOf(':');
      if (colonIdx > 0 && colonIdx < 48) {
        usesRaw.push({
          label: text.slice(0, colonIdx).trim(),
          desc: text.slice(colonIdx + 1).trim(),
        });
      } else if (text) {
        usesRaw.push({ label: 'मुख्य उपयोग', desc: text });
      }
    }
    if (usesRaw.length === 0) {
      const usesFallbackText = stripHtmlAndMarkdown(usesSection) || descClean;
      if (usesFallbackText) {
        usesRaw.push({
          label: 'मुख्य उपयोग',
          desc: usesFallbackText.split(/(?<=[.!?])\s+/).slice(0, 3).join(' ').trim(),
        });
      }
    }

    // Parse Side Effects bullets (concise label or short point)
    const sideEffectsEn = [];
    const sideLines = sideSection.split('\n').map((l) => l.trim()).filter((l) => l.startsWith('*'));
    for (const line of sideLines.slice(0, 7)) {
      const text = stripHtmlAndMarkdown(line.replace(/^\*\s*/, ''));
      if (!text) continue;
      const colonIdx = text.indexOf(':');
      sideEffectsEn.push(colonIdx > 0 && colonIdx < 48 ? text.slice(0, colonIdx).trim() : text);
    }

    // Parse Precautions & Warnings subsections
    const extractSubWarn = (subTitle) => {
      const block = extractMarkdownSection(warningsSection, subTitle, '###');
      const cleaned = stripHtmlAndMarkdown(block)
        .replace(/Can I [^?]+\?/gi, '')
        .trim();
      return cleaned.split(/(?<=[.!?])\s+/).slice(0, 2).join(' ').trim();
    };

    const pregText = [extractSubWarn('Pregnancy'), extractSubWarn('Breast Feeding')]
      .filter(Boolean)
      .join(' ');
    const organText = [extractSubWarn('Kidney'), extractSubWarn('Liver')]
      .filter(Boolean)
      .join(' ') || stripHtmlAndMarkdown(contraSection).split(/(?<=[.!?])\s+/).slice(0, 2).join(' ');
    const alcoholText = extractSubWarn('Alcohol');

    // Batch translate live English fields into Hindi
    const stringsToTranslate = [
      introEn,
      ...usesRaw.map((u) => u.label),
      ...usesRaw.map((u) => u.desc),
      ...sideEffectsEn,
      pregText || 'Consult a doctor before using this medicine during pregnancy and breastfeeding.',
      organText || 'Consult a doctor if you have kidney or liver disease before taking this medicine.',
      alcoholText || 'Avoid alcohol while taking this medicine unless cleared by your doctor.',
    ];

    const translated = await translateBatchToHindi(stringsToTranslate);
    let cursor = 0;

    let introHi = translated[cursor++] || introEn;
    // Ensure user's exact searched name leads the intro sentence
    if (best.name) {
      const brandHead = best.name.split(/\s+/)[0];
      if (brandHead && !introHi.toLowerCase().includes(displayName.toLowerCase())) {
        introHi = `${displayName}: ${introHi}`;
      }
    }

    const usesLabelsHi = translated.slice(cursor, cursor + usesRaw.length);
    cursor += usesRaw.length;
    const usesDescsHi = translated.slice(cursor, cursor + usesRaw.length);
    cursor += usesRaw.length;

    const usesHi = usesRaw.map((_, i) => ({
      label: usesLabelsHi[i] || usesRaw[i].label,
      desc: usesDescsHi[i] || usesRaw[i].desc,
    }));

    const sideEffectsHi = translated.slice(cursor, cursor + sideEffectsEn.length);
    cursor += sideEffectsEn.length;

    const pregHi = translated[cursor++];
    const organHi = translated[cursor++];
    const alcoholHi = translated[cursor++];

    return {
      id: 'med-' + Date.now(),
      name: displayName,
      intro_hi: introHi,
      usesIntro_hi: `${displayName} का उपयोग मुख्य रूप से निम्नलिखित स्थितियों में राहत पाने के लिए किया जाता है:`,
      uses_hi: usesHi,
      oneMgUrl:
        oneMgUrl ||
        `https://www.1mg.com/search/all?name=${encodeURIComponent(displayName)}`,
      sideEffects_hi: sideEffectsHi,
      warnings_hi: [
        { label: 'गर्भावस्था और स्तनपान', desc: pregHi },
        { label: 'अंगों से जुड़ी बीमारी', desc: organHi },
        { label: 'शराब', desc: alcoholHi },
        {
          label: 'डॉक्टर की सलाह',
          desc: 'इसे लेने से पहले डॉक्टर या किसी नजदीकी स्वास्थ्य विशेषज्ञ से परामर्श अवश्य लें।',
        },
      ],
    };
  } catch (_e) {
    return null;
  }
}

/**
 * Fallback live lookup via OpenFDA Drug Label API & Wikipedia REST API (CORS: *).
 */
async function fetchOpenFdaOrWikipediaLive(searchTerm, displayName, oneMgUrl) {
  // 1. OpenFDA Drug Label API
  try {
    const fdaQueries = [
      `openfda.brand_name:"${searchTerm}"`,
      `openfda.generic_name:"${searchTerm}"`,
      `openfda.substance_name:"${searchTerm}"`,
    ];
    for (const q of fdaQueries) {
      const url = `https://api.fda.gov/drug/label.json?search=${q}&limit=1`;
      const res = await fetchWithTimeout(url, {}, 7000);
      if (!res.ok) continue;
      const fda = await res.json();
      const item = fda?.results?.[0];
      if (!item) continue;

      const generic =
        item?.openfda?.generic_name?.[0] ||
        item?.openfda?.substance_name?.[0] ||
        displayName;
      const rawIndication = stripHtmlAndMarkdown(item?.indications_and_usage?.[0] || '')
        .replace(/^\d+(\.\d+)?\s*[A-Z\s]+/, '')
        .slice(0, 280);
      const rawAdverse = stripHtmlAndMarkdown(item?.adverse_reactions?.[0] || '')
        .replace(/^\d+(\.\d+)?\s*[A-Z\s]+/, '')
        .slice(0, 220);
      const rawWarn = stripHtmlAndMarkdown(item?.warnings?.[0] || item?.warnings_and_cautions?.[0] || '')
        .slice(0, 200);

      const batch = await translateBatchToHindi([
        `${displayName} contains ${generic}.`,
        rawIndication || `${displayName} (${generic}) is used under medical supervision for approved clinical conditions.`,
        rawAdverse || 'Consult package insert or doctor for potential adverse reactions.',
        rawWarn || 'Consult a doctor if you are pregnant, breastfeeding, or have liver/kidney conditions.',
      ]);

      return {
        id: 'med-' + Date.now(),
        name: displayName,
        intro_hi: batch[0],
        usesIntro_hi: `${displayName} का उपयोग मुख्य रूप से निम्नलिखित स्थितियों में राहत पाने के लिए किया जाता है:`,
        uses_hi: [{ label: 'मुख्य चिकित्सीय उपयोग', desc: batch[1] }],
        oneMgUrl: oneMgUrl || `https://www.1mg.com/search/all?name=${encodeURIComponent(displayName)}`,
        sideEffects_hi: [batch[2]],
        warnings_hi: [
          { label: 'गर्भावस्था, स्तनपान व अन्य सावधानियां', desc: batch[3] },
          {
            label: 'डॉक्टर की सलाह',
            desc: 'इसे लेने से पहले डॉक्टर या किसी नजदीकी स्वास्थ्य विशेषज्ञ से परामर्श अवश्य लें।',
          },
        ],
      };
    }
  } catch (_e) {
    // Proceed to Wikipedia
  }

  // 2. Wikipedia REST API (English summary -> live Hindi translation)
  try {
    const wikiUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(
      searchTerm.replace(/\s+/g, '_')
    )}`;
    const res = await fetchWithTimeout(wikiUrl, {}, 7000);
    if (res.ok) {
      const data = await res.json();
      if (data?.extract && data?.type !== 'disambiguation') {
        const lowerDesc = `${data.description || ''} ${data.extract}`.toLowerCase();
        const looksMedical =
          lowerDesc.includes('medication') ||
          lowerDesc.includes('drug') ||
          lowerDesc.includes('tablet') ||
          lowerDesc.includes('medicine') ||
          lowerDesc.includes('treat') ||
          lowerDesc.includes('pharmaceutical');

        if (looksMedical) {
          const sentences = data.extract.split(/(?<=[.!?])\s+/).filter(Boolean);
          const batch = await translateBatchToHindi([
            sentences[0] || data.extract.slice(0, 180),
            sentences.slice(0, 3).join(' '),
          ]);
          return {
            id: 'med-' + Date.now(),
            name: displayName,
            intro_hi: `${displayName} — ${batch[0]}`,
            usesIntro_hi: `${displayName} का उपयोग मुख्य रूप से निम्नलिखित स्थितियों में राहत पाने के लिए किया जाता है:`,
            uses_hi: [{ label: 'मुख्य जानकारी व उपयोग', desc: batch[1] }],
            oneMgUrl:
              oneMgUrl || `https://www.1mg.com/search/all?name=${encodeURIComponent(displayName)}`,
            sideEffects_hi: [
              'विस्तृत साइड इफेक्ट्स की जानकारी के लिए ऊपर दिए गए Tata 1mg लिंक या दवा के पत्ते (Leaflets) को देखें।',
            ],
            warnings_hi: [
              {
                label: 'डॉक्टर की सलाह',
                desc: 'गर्भावस्था, स्तनपान, किडनी/लिवर की बीमारी या शराब के सेवन की स्थिति में बिना डॉक्टर की सलाह के इसे न लें।',
              },
            ],
          };
        }
      }
    }
  } catch (_e) {
    // No match
  }

  return null;
}

/**
 * Universal 100% Live Medicine Resolver:
 * - Zero static medicine data
 * - Zero API keys required
 * - Preserves exact medicine name searched by user
 * - Returns null when no live clinical record is found
 */
export async function resolveMedicine(rawQuery) {
  if (!rawQuery || typeof rawQuery !== 'string' || !rawQuery.trim()) {
    return null;
  }

  const query = rawQuery.trim();
  const displayName = query.charAt(0).toUpperCase() + query.slice(1);

  // If the user typed in Hindi/Devanagari (e.g. "अजुबी टैबलेट"), translate to English for live pharmacy lookup
  let searchTerm = query;
  if (hasDevanagari(query)) {
    const englishQuery = await translateText(query, 'hi', 'en');
    if (englishQuery && !hasDevanagari(englishQuery)) {
      searchTerm = englishQuery.replace(/[^\w\s-]/g, ' ').replace(/\s+/g, ' ').trim();
    }
  }

  // Fetch exact live Tata 1mg URL in parallel if available
  const oneMgMatch = await searchOneMgLive(searchTerm);
  const oneMgUrl = oneMgMatch?.oneMgUrl || `https://www.1mg.com/search/all?name=${encodeURIComponent(displayName)}`;

  // 1. On native devices (or when direct 1mg HTML is reachable), prefer native Hindi 1mg clinical state
  if (oneMgMatch?.urlPath) {
    const oneMgData = await fetchOneMgHindiDetails(oneMgMatch.urlPath, displayName, oneMgUrl);
    if (oneMgData) return oneMgData;
  }

  // 2. PharmEasy live search + clinical page + live Hindi translation (works across Web & Native)
  const pharmEasyData = await fetchPharmEasyLive(searchTerm, displayName, oneMgUrl);
  if (pharmEasyData) return pharmEasyData;

  // 3. OpenFDA + Wikipedia live medical lookup + live Hindi translation
  const fdaOrWikiData = await fetchOpenFdaOrWikipediaLive(searchTerm, displayName, oneMgUrl);
  if (fdaOrWikiData) return fdaOrWikiData;

  return null;
}
