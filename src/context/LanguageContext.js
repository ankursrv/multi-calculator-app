import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import screenTranslations from '../i18n';

const STORAGE_KEY = '@multi-calc/app-language';

/**
 * English string -> { en, hi } translation.
 * ScreenHeader / bottom nav / drawer pass their English literal to t(),
 * so a screen only needs to send one string and gets the right language back.
 */
export const TRANSLATIONS = {
  // ── Drawer ─────────────────────────────────────────────
  Language: { en: 'Language', hi: 'भाषा' },

  // ── Kirana Calculator ──────────────────────────────────
  'Money to Weight': { en: 'Money to Weight', hi: 'रुपये से वजन' },
  'Enter rupees, get weight': { en: 'Enter rupees, get weight', hi: 'रुपये डालें, वजन पाएं' },
  'Weight to Money': { en: 'Weight to Money', hi: 'वजन से रुपये' },
  'Enter weight, get rupees': { en: 'Enter weight, get rupees', hi: 'वजन डालें, रुपये पाएं' },
  'Market Rate': { en: 'Market Rate', hi: 'बाज़ार भाव (दर)' },
  'Per Unit': { en: 'Per Unit', hi: 'प्रति इकाई' },
  'Target Budget': { en: 'Target Budget', hi: 'कितने रुपये का सामान चाहिए?' },
  'Quantity Required': { en: 'Quantity Required', hi: 'कितना सामान चाहिए (वजन)' },
  'Enter rate': { en: 'Enter rate', hi: 'दर दर्ज करें' },
  'Enter amount': { en: 'Enter amount', hi: 'रकम दर्ज करें' },
  'Enter weight': { en: 'Enter weight', hi: 'वजन दर्ज करें' },
  'Gram (g)': { en: 'Gram (g)', hi: 'ग्राम (g)' },
  Kg: { en: 'Kg', hi: 'किलो' },
  Gram: { en: 'Gram', hi: 'ग्राम' },
  Kilogram: { en: 'Kilogram', hi: 'किलो' },
  'Total Quantity Received': { en: 'Total Quantity Received', hi: 'कुल सामान मिलेगा' },
  'Total Price to Pay': { en: 'Total Price to Pay', hi: 'कुल भुगतान राशि' },
  'Select Unit': { en: 'Select Unit', hi: 'इकाई चुनें' },
  'Kilogram (1000 g)': { en: 'Kilogram (1000 g)', hi: 'किलो (1000 ग्राम)' },
  '100 Gram': { en: '100 Gram', hi: '100 ग्राम' },
  '500 Gram (half kg)': { en: '500 Gram (half kg)', hi: '500 ग्राम (आधा किलो)' },
  'Litre (1000 ml)': { en: 'Litre (1000 ml)', hi: 'लीटर (1000 मिली)' },

  // ── Daily Expenses / Smart Khata / Calculator ──────────
  'Daily Expenses': { en: 'Daily Expenses', hi: 'रोज़ का खर्चा' },
  Calculator: { en: 'Calculator', hi: 'कैलकुलेटर' },
  'FD Calculator': { en: 'FD Calculator', hi: 'एफडी कैलकुलेटर' },
  'Smart Khata': { en: 'Smart Khata', hi: 'स्मार्ट खाता' },

  // ── Screen titles ──────────────────────────────────────
  'Kirana Calculator': { en: 'Kirana Calculator', hi: 'किराना कैलकुलेटर' },
  'Live Gold-Silver Rates': { en: 'Live Gold-Silver Rates', hi: 'सोना-चांदी के लाइव भाव' },
  Calendar: { en: 'Calendar', hi: 'कैलेंडर' },
  'Loan & EMI': { en: 'Loan & EMI', hi: 'लोन और ईएमआई' },
  'Discount & GST': { en: 'Discount & GST', hi: 'छूट और जीएसटी' },
  'Unit Converter': { en: 'Unit Converter', hi: 'यूनिट कन्वर्टर' },

  // ── Screen subtitles ───────────────────────────────────
  'Quick & Accurate Maths': { en: 'Quick & Accurate Maths', hi: 'तेज़ और सटीक गणित' },
  'सामान का भाव - वजन और मूल्य कैलकुलेटर':
    { en: 'Item price · weight & value calculator', hi: 'सामान का भाव - वजन और मूल्य कैलकुलेटर' },
  'सामान की लिस्ट, कुल बिल एवं स्प्लिट हिसाब':
    { en: 'Item list, total bill & split calculation', hi: 'सामान की लिस्ट, कुल बिल एवं स्प्लिट हिसाब' },
  'सोना-चांदी का लाइव भाव · प्रति ग्राम दाम':
    { en: 'Live gold-silver rates · price per gram', hi: 'सोना-चांदी का लाइव भाव · प्रति ग्राम दाम' },
  'पंचांग · त्योहार व शुभ मुहूर्त':
    { en: 'Panchang · festivals & auspicious muhurat', hi: 'पंचांग · त्योहार व शुभ मुहूर्त' },
  'मासिक किस्त एवं ब्याज हिसाब':
    { en: 'Monthly instalment & interest breakdown', hi: 'मासिक किस्त एवं ब्याज हिसाब' },
  'अवधि एफडी · ब्याज और मैच्योरिटी हिसाब':
    { en: 'Fixed deposit · interest & maturity', hi: 'अवधि एफडी · ब्याज और मैच्योरिटी हिसाब' },
  'छूट और टैक्स की त्वरित गणना':
    { en: 'Quick discount & tax calculation', hi: 'छूट और टैक्स की त्वरित गणना' },
  'इकाइयों का सटीक रूपांतरण':
    { en: 'Precise unit conversions', hi: 'इकाइयों का सटीक रूपांतरण' },
  'Track Month-by-Month Expenses':
    { en: 'Track Month-by-Month Expenses', hi: 'महीने-दर-महीने खर्चा ट्रैक करें' },
};

// Screen dictionaries are merged in, but the common entries above win
// (headers / bottom nav / drawer labels stay consistent).
const ALL_TRANSLATIONS = { ...screenTranslations, ...TRANSLATIONS };

const LanguageContext = createContext({
  language: 'hi',
  setLanguage: () => {},
  t: (text) => text,
});

export function LanguageProvider({ children }) {
  // Hindi default — isliye sub-screen headers dual-language nahi dikhte
  const [language, setLanguageState] = useState('hi');

  // Restore saved preference once on mount
  useEffect(() => {
    let alive = true;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((saved) => {
        if (!alive) return;
        if (saved === 'en' || saved === 'hi') setLanguageState(saved);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const setLanguage = useCallback((next) => {
    if (next !== 'en' && next !== 'hi') return;
    setLanguageState(next);
    AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {});
  }, []);

  const t = useCallback(
    (text) => {
      if (typeof text !== 'string' || !text) return text;

      const entry = ALL_TRANSLATIONS[text];
      if (entry) return entry[language] || text;

      // Dynamic personal-expense subtitle, e.g. "Ankur's Personal Expenses"
      if (language === 'hi' && /'s Personal Expenses$/.test(text)) {
        return text.replace(/'s Personal Expenses$/, ' के निजी खर्चे');
      }
      if (language === 'en' && / के निजी खर्चे$/.test(text)) {
        return text.replace(/ के निजी खर्चे$/, "'s Personal Expenses");
      }

      return text;
    },
    [language]
  );

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      t,
    }),
    [language, setLanguage, t]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  return useContext(LanguageContext);
}
