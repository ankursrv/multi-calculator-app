/**
 * Per-screen translation dictionaries.
 * Har screen ka apna file hai taaki parallel work/merge conflicts na hon.
 * Key = English display string, value = { en, hi }.
 * common (headers/nav/drawer) entries LanguageContext me hain aur unka
 * priority upar rehta hai.
 */
import standardCalculator from './standardCalculator';
import smartKhata from './smartKhata';
import kharcha from './kharcha';
import fd from './fd';
import gold from './gold';
import tyohaar from './tyohaar';
import emi from './emi';
import discount from './discount';
import unit from './unit';

const screenTranslations = {
  ...standardCalculator,
  ...smartKhata,
  ...kharcha,
  ...fd,
  ...gold,
  ...tyohaar,
  ...emi,
  ...discount,
  ...unit,
};

export default screenTranslations;
