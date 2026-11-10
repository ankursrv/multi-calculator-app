import AsyncStorage from '@react-native-async-storage/async-storage';
import { searchMedicineOffline, MEDICINE_DATABASE } from '../data/medicineDatabase';

const STORAGE_API_KEY = '@medicine_gemini_api_key';

/**
 * Get stored Gemini API Key, or fallback to EXPO_PUBLIC_GEMINI_API_KEY if defined.
 */
export async function getGeminiApiKey() {
  try {
    const saved = await AsyncStorage.getItem(STORAGE_API_KEY);
    if (saved && saved.trim()) return saved.trim();
  } catch (_e) {
    // ignore
  }
  return process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';
}

/**
 * Save user custom Gemini API key
 */
export async function setGeminiApiKey(key) {
  try {
    if (!key || !key.trim()) {
      await AsyncStorage.removeItem(STORAGE_API_KEY);
    } else {
      await AsyncStorage.setItem(STORAGE_API_KEY, key.trim());
    }
  } catch (_e) {
    // ignore
  }
}

const MEDICAL_SYSTEM_PROMPT = `You are an expert clinical pharmacist and medical specialist.
Your task is to identify the medicine and provide accurate, reliable, clinically verified medical information in BOTH English and Hindi.
Accuracy is critical. Do not hallucinate. If uncertain, state known facts or recommend consulting a physician.

Return ONLY a valid JSON object strictly matching this schema with no markdown backticks or commentary:
{
  "name": "Brand / Generic Name (e.g. Dolo 650)",
  "salt": "Active chemical salt with strength (e.g. Paracetamol 650mg)",
  "category_en": "Medical category in English",
  "category_hi": "Medical category in Hindi",
  "uses_en": ["Primary clinical indication 1", "Indication 2"],
  "uses_hi": ["मुख्य उपयोग 1 (सरल व शुद्ध हिंदी)", "मुख्य उपयोग 2"],
  "sideEffects_en": {
    "common": ["Mild common side effect 1", "Common side effect 2"],
    "serious": ["Serious warning or overdose symptom"]
  },
  "sideEffects_hi": {
    "common": ["सामान्य दुष्प्रभाव 1", "सामान्य दुष्प्रभाव 2"],
    "serious": ["गंभीर लक्षण या अधिक खुराक का दुष्प्रभाव"]
  },
  "howToUse_en": "Clear instructions on timing, with or without food, and dosage interval.",
  "howToUse_hi": "कब और कैसे लें (भोजन के साथ/बाद, दो खुराकों में अंतर).",
  "precautions_en": ["Important precaution 1", "Precaution 2"],
  "precautions_hi": ["ज़रूरी सावधानी 1", "ज़रूरी सावधानी 2"],
  "safetyAdvice": {
    "pregnancy": { "text_en": "Status in pregnancy", "text_hi": "गर्भावस्था में सलाह", "status": "safe|caution|unsafe" },
    "alcohol": { "text_en": "Interaction with alcohol", "text_hi": "शराब के साथ सलाह", "status": "safe|caution|unsafe" },
    "driving": { "text_en": "Effect on driving/alertness", "text_hi": "ड्राइविंग पर प्रभाव", "status": "safe|caution|unsafe" },
    "kidneyLiver": { "text_en": "Advice for kidney/liver patients", "text_hi": "किडनी/लिवर रोगियों के लिए सलाह", "status": "safe|caution|unsafe" }
  }
}`;

/**
 * Call Gemini model with text or image.
 */
async function callGemini(contents, apiKey) {
  // Using gemini-2.0-flash or gemini-1.5-flash
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents,
      generationConfig: {
        temperature: 0.1, // low temperature for maximum clinical factual accuracy
        topP: 0.9,
        responseMimeType: 'application/json',
      },
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Gemini API Error (${response.status}): ${errorBody}`);
  }

  const data = await response.json();
  const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText) {
    throw new Error('No response text received from Gemini');
  }

  // Parse JSON cleanly
  const cleaned = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
  return JSON.parse(cleaned);
}

/**
 * Analyze medicine from captured or picked image (base64 string).
 */
export async function analyzeMedicineImage(base64Image, mimeType = 'image/jpeg') {
  const apiKey = await getGeminiApiKey();

  // If no Gemini API key is configured, fallback to offline matching
  if (!apiKey) {
    return {
      success: false,
      requiresApiKey: true,
      message: 'Gemini API Key is required for live AI Vision scanning.',
    };
  }

  try {
    const contents = [
      {
        parts: [
          {
            text: `${MEDICAL_SYSTEM_PROMPT}\n\nExamine this medicine image (strip, blister pack, syrup bottle, or box). Identify the brand name, active salt, uses, and side effects.`,
          },
          {
            inline_data: {
              mime_type: mimeType,
              data: base64Image,
            },
          },
        ],
      },
    ];

    const parsed = await callGemini(contents, apiKey);
    return {
      success: true,
      data: parsed,
      source: 'gemini-vision',
    };
  } catch (err) {
    return {
      success: false,
      error: err.message || 'Failed to scan image with AI',
    };
  }
}

/**
 * Analyze or search medicine by text name.
 * 1. Checks verified offline database first for instant 100% accurate response.
 * 2. If not found or if user wants deeper search and has API key, queries Gemini.
 */
export async function searchMedicine(query) {
  if (!query || !query.trim()) return [];

  // First priority: Check verified offline database
  const offlineMatches = searchMedicineOffline(query);
  if (offlineMatches.length > 0) {
    return offlineMatches.map((item) => ({
      ...item,
      source: 'offline-verified',
    }));
  }

  // Second priority: If no local match and API key is present, ask Gemini
  const apiKey = await getGeminiApiKey();
  if (apiKey) {
    try {
      const contents = [
        {
          parts: [
            {
              text: `${MEDICAL_SYSTEM_PROMPT}\n\nProvide verified medical details for the medicine named or searched: "${query}".`,
            },
          ],
        },
      ];
      const aiData = await callGemini(contents, apiKey);
      return [
        {
          ...aiData,
          id: 'ai-' + Date.now(),
          source: 'gemini-ai',
        },
      ];
    } catch (_err) {
      // Return empty if AI fails
      return [];
    }
  }

  return [];
}

export { MEDICINE_DATABASE };
