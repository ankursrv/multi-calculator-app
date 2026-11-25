/**
 * Helper for screens whose labels were originally written as
 * "हिंदी (English)" or "English (हिंदी)".
 * English mode keeps only the English part; Hindi mode keeps only the Hindi part.
 * Strings already translated by LanguageContext are left untouched.
 */

// Common Hindi words used in the older mixed labels (English mode only).
const TO_ENGLISH = [
  ['मैच्योरिटी', 'maturity'],
  ['सदस्य', 'Members'],
  ['अक्षर', 'characters'],
  ['कोड', 'code'],
  ['त्योहारों', 'festivals'],
  ['त्योहार', 'festival'],
  ['नक्षत्र', 'Nakshatra'],
  ['मुहूर्त', 'muhurat'],
  ['पंचांग', 'Panchang'],
  ['इकाइयाँ', 'units'],
  ['इकाई', 'unit'],
  ['शुद्धता', 'Purity'],
  ['खर्चे', 'expenses'],
  ['खर्चा', 'expense'],
  ['निवेश', 'investment'],
  ['भुगतान', 'payment'],
  ['महत्वपूर्ण', 'Important'],
  ['महीने', 'months'],
  ['महीना', 'month'],
  ['किलोग्राम', 'kg'],
  ['ग्रामों', 'grams'],
  ['किलो', 'kg'],
  ['ग्राम', 'gram'],
  ['लीटर', 'litre'],
  ['वजन', 'weight'],
  ['मात्रा', 'quantity'],
  ['कीमत', 'price'],
  ['मूल्य', 'price'],
  ['रुपये', 'rupees'],
  ['रुपया', 'rupee'],
  ['प्रति', 'per'],
  ['ब्याज', 'interest'],
  ['अवधि', 'tenure'],
  ['जमा', 'deposit'],
  ['सोना', 'Gold'],
  ['चांदी', 'Silver'],
  ['शुभ', 'auspicious'],
  ['भाव', 'rate'],
  ['दर', 'rate'],
  ['राशि', 'amount'],
  ['कुल', 'Total'],
  ['वर्ष', 'year'],
  ['साल', 'years'],
  ['दिन', 'days'],
  ['तिथि', 'Tithi'],
  ['योग', 'Yoga'],
  ['करण', 'Karana'],
  ['बिल', 'Bill'],
  ['आइटम्स', 'items'],
  ['आइटम', 'item'],
  ['लिस्ट', 'list'],
  ['सूचना', 'info'],
  ['नाम', 'Name'],
  ['फोन', 'Phone'],
  ['त्रुटि', 'error'],
];

const boundary = (word) =>
  new RegExp(`(?<![\\u0900-\\u097F])${word}(?![\\u0900-\\u097F])`, 'g');

function toEnglishWords(text) {
  let result = text;
  TO_ENGLISH.forEach(([hindi, english]) => {
    result = result.replace(boundary(hindi), english);
  });
  return result;
}

export function localizeMixed(text, language, t) {
  if (typeof text !== 'string') return text;

  const leading = (text.match(/^\s*/) || [''])[0];
  const trailing = (text.match(/\s*$/) || [''])[0];
  const core = text.slice(leading.length, text.length - trailing.length);
  if (!core) return text;

  const translated = t ? t(core) : core;
  if (translated !== core) return `${leading}${translated}${trailing}`;

  const hasDevanagari = /[\u0900-\u097F]/.test(core);
  const match = core.match(/^(.*?)\s*[（(]([^()]*)[)）]\s*(.*)$/);

  if (match) {
    const before = match[1];
    const inside = match[2];
    const after = match[3] || '';
    const devBefore = /[\u0900-\u097F]/.test(before);
    const devInside = /[\u0900-\u097F]/.test(inside);
    const suffix = after ? ` ${after}` : '';

    // "कुल ब्याज (Interest)" -> Interest / कुल ब्याज
    if (devBefore && !devInside && /[A-Za-z]/.test(inside)) {
      return `${leading}${language === 'hi' ? before : inside}${suffix}${trailing}`;
    }
    // "Purity (शुद्धता)" -> Purity / शुद्धता
    if (!devBefore && devInside) {
      return `${leading}${language === 'en' ? before : inside}${suffix}${trailing}`;
    }
  }

  return language === 'en' && hasDevanagari
    ? `${leading}${toEnglishWords(core)}${trailing}`
    : text;
}

export function localizeChildren(children, language, t) {
  if (Array.isArray(children)) {
    return children.map((child) => localizeChildren(child, language, t));
  }
  if (typeof children === 'string' || typeof children === 'number') {
    return localizeMixed(children, language, t);
  }
  return children;
}
