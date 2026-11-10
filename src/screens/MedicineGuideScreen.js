import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
  ActivityIndicator,
  Modal,
  Platform,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Colors } from '../theme/colors';
import ScreenHeader from '../components/ScreenHeader';
import {
  searchMedicine,
  analyzeMedicineImage,
  getGeminiApiKey,
  setGeminiApiKey,
  MEDICINE_DATABASE,
} from '../services/medicineAiService';

const CATEGORIES = [
  { id: 'all', label_en: 'All Medicines', label_hi: 'सभी दवाएं', icon: 'pill' },
  { id: 'Fever & Pain', label_en: 'Fever & Pain', label_hi: 'बुखार व दर्द', icon: 'thermometer' },
  { id: 'Acidity & Gas', label_en: 'Acidity & Gas', label_hi: 'गैस व एसिडिटी', icon: 'stomach' },
  { id: 'Allergy & Cold', label_en: 'Allergy & Cold', label_hi: 'सर्दी व एलर्जी', icon: 'weather-windy' },
  { id: 'Antibiotics', label_en: 'Antibiotics', label_hi: 'एंटीबायोटिक', icon: 'virus-outline' },
  { id: 'BP & Heart', label_en: 'BP & Heart', label_hi: 'बीपी व हृदय', icon: 'heart-pulse' },
  { id: 'Diabetes', label_en: 'Diabetes', label_hi: 'शुगर / मधुमेह', icon: 'water-percent' },
  { id: 'Vitamins & Wellness', label_en: 'Vitamins', label_hi: 'विटामिन्स', icon: 'shield-plus' },
  { id: 'First Aid', label_en: 'First Aid', label_hi: 'मलहम / पट्टी', icon: 'medical-bag' },
];

export default function MedicineGuideScreen({ onBack }) {
  const [lang, setLang] = useState('hi'); // 'hi' (Hindi) or 'en' (English)
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedMedicine, setSelectedMedicine] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [hasApiKey, setHasApiKey] = useState(false);
  const [infoNotice, setInfoNotice] = useState('');
  const [isListening, setIsListening] = useState(false);

  const recognitionRef = useRef(null);

  // Load existing API key status on mount
  useEffect(() => {
    (async () => {
      const key = await getGeminiApiKey();
      setHasApiKey(Boolean(key));
      setApiKeyInput(key || '');
    })();
  }, []);

  // Cleanup speech recognition on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current && typeof recognitionRef.current.stop === 'function') {
        try {
          recognitionRef.current.stop();
        } catch (_e) {
          // ignore
        }
      }
    };
  }, []);

  // Handle Search Input with debounce
  useEffect(() => {
    if (!searchQuery.trim()) {
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const results = await searchMedicine(searchQuery.trim());
        setSearchResults(results);
      } catch (_err) {
        setSearchResults([]);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Voice Search Handler (Web Speech API with graceful mobile fallback)
  const handleVoiceSearch = () => {
    const SpeechRecognition =
      (typeof window !== 'undefined' &&
        (window.SpeechRecognition || window.webkitSpeechRecognition)) ||
      null;

    if (!SpeechRecognition) {
      Alert.alert(
        lang === 'hi' ? 'वॉयस सर्च' : 'Voice Search',
        lang === 'hi'
          ? 'आपके ब्राउज़र में स्पीच रिकॉग्निशन सपोर्ट नहीं है। कृपया दवा का नाम टाइप करें।'
          : 'Voice speech recognition is not supported on this browser. Please type the medicine name.'
      );
      return;
    }

    if (isListening && recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (_e) {
        // ignore
      }
      setIsListening(false);
      setInfoNotice('');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.lang = lang === 'hi' ? 'hi-IN' : 'en-IN';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListening(true);
        setInfoNotice(
          lang === 'hi' ? '🎙️ बोलिए, सुन रहे हैं...' : '🎙️ Listening... Speak medicine name...'
        );
      };

      recognition.onresult = (event) => {
        const transcript = event.results?.[0]?.[0]?.transcript || '';
        if (transcript.trim()) {
          setSearchQuery(transcript.trim());
          if (selectedMedicine) setSelectedMedicine(null);
          setInfoNotice(
            lang === 'hi' ? `बोला गया: "${transcript.trim()}"` : `Heard: "${transcript.trim()}"`
          );
        }
        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
        setInfoNotice('');
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (_err) {
      setIsListening(false);
      setInfoNotice('');
    }
  };

  // Open Camera to Capture Medicine Image
  const handleCaptureImage = async () => {
    setShowMediaModal(false);
    try {
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(
            lang === 'hi' ? 'कैमरा अनुमति आवश्यक है' : 'Camera Permission Required',
            lang === 'hi'
              ? 'दवा के पत्ते की फोटो खींचने के लिए कृपया कैमरा एक्सेस की अनुमति दें।'
              : 'Please allow camera access to take a photo of the medicine.'
          );
          return;
        }
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.7,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        processScannedImage(result.assets[0]);
      }
    } catch (_e) {
      Alert.alert(
        lang === 'hi' ? 'त्रुटि' : 'Error',
        lang === 'hi' ? 'कैमरा शुरू करने में समस्या आई।' : 'Could not open camera.'
      );
    }
  };

  // Open Gallery to Pick Medicine Image
  const handleUploadImage = async () => {
    setShowMediaModal(false);
    try {
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(
            lang === 'hi' ? 'गैलरी अनुमति आवश्यक है' : 'Gallery Permission Required',
            lang === 'hi'
              ? 'दवा की फोटो चुनने के लिए कृपया फोटो गैलरी की अनुमति दें।'
              : 'Please allow photo gallery access to pick a medicine image.'
          );
          return;
        }
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.7,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        processScannedImage(result.assets[0]);
      }
    } catch (_e) {
      Alert.alert(
        lang === 'hi' ? 'त्रुटि' : 'Error',
        lang === 'hi' ? 'फोटो गैलरी खोलने में समस्या आई।' : 'Could not access photo library.'
      );
    }
  };

  // Process and Analyze Scanned / Picked Image
  const processScannedImage = async (asset) => {
    setCapturedImage(asset.uri);
    setLoading(true);
    setInfoNotice(
      lang === 'hi'
        ? 'AI दवा की फोटो को स्कैन कर रहा है...'
        : 'AI is analyzing medicine photo...'
    );

    try {
      const res = await analyzeMedicineImage(asset.base64, asset.mimeType || 'image/jpeg');

      if (res.success && res.data) {
        setSelectedMedicine({
          ...res.data,
          id: 'ai-scanned-' + Date.now(),
          source: 'gemini-vision',
        });
        setInfoNotice('');
      } else if (res.requiresApiKey) {
        setInfoNotice(
          lang === 'hi'
            ? 'लाइव फोटो स्कैन के लिए Gemini API Key दर्ज करें, या नीचे नाम सर्च करें।'
            : 'Enter free Gemini API Key for live photo scan, or search below.'
        );
        setShowKeyModal(true);
      } else {
        Alert.alert(
          lang === 'hi' ? 'स्कैन पूरा नहीं हुआ' : 'Scan Incomplete',
          res.error ||
            (lang === 'hi'
              ? 'दवा की जानकारी नहीं मिल सकी। कृपया साफ फोटो लें या नाम टाइप करें।'
              : 'Could not recognize medicine.')
        );
        setInfoNotice('');
      }
    } catch (_err) {
      Alert.alert(
        lang === 'hi' ? 'त्रुटि' : 'Error',
        lang === 'hi' ? 'स्कैन के दौरान समस्या आई।' : 'An error occurred during scan.'
      );
      setInfoNotice('');
    } finally {
      setLoading(false);
    }
  };

  // Save Custom Gemini API Key
  const handleSaveApiKey = async () => {
    await setGeminiApiKey(apiKeyInput.trim());
    setHasApiKey(Boolean(apiKeyInput.trim()));
    setShowKeyModal(false);
    Alert.alert(
      lang === 'hi' ? 'सहेजा गया' : 'Saved',
      apiKeyInput.trim()
        ? lang === 'hi'
          ? 'Gemini API Key सुरक्षित रूप से सेव हो गई है!'
          : 'Gemini API Key saved successfully!'
        : lang === 'hi'
        ? 'API Key हटा दी गई है।'
        : 'API Key removed.'
    );
  };

  // Filtered List based on Category & Search
  const displayList = (() => {
    if (searchQuery.trim()) {
      return searchResults;
    }
    if (selectedCategory === 'all') {
      return MEDICINE_DATABASE;
    }
    return MEDICINE_DATABASE.filter((m) => m.tag === selectedCategory);
  })();

  const isHindi = lang === 'hi';

  return (
    <View style={styles.container}>
      {/* Medical Teal Theme Header */}
      <ScreenHeader
        title={isHindi ? 'दवाई जानकारी' : 'Medicine Guide'}
        subtitle={isHindi ? 'उपयोग, साइड इफेक्ट्स व स्कैनर' : 'Uses, Side Effects & Scanner'}
        icon="pill"
        theme="teal"
        onBack={onBack}
        onReset={() => {
          setSelectedMedicine(null);
          setSearchQuery('');
          setSearchResults([]);
          setCapturedImage(null);
          setInfoNotice('');
        }}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Top Control Bar: Language Switcher + AI Settings */}
        <View style={styles.topControlRow}>
          {/* Dual Language Switcher Pill */}
          <View style={styles.langSwitchWrapper}>
            <TouchableOpacity
              style={[styles.langBtn, isHindi && styles.langBtnActive]}
              onPress={() => setLang('hi')}
              activeOpacity={0.8}
            >
              <Text style={[styles.langBtnText, isHindi && styles.langBtnTextActive]}>
                🇮🇳 हिंदी
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.langBtn, !isHindi && styles.langBtnActive]}
              onPress={() => setLang('en')}
              activeOpacity={0.8}
            >
              <Text style={[styles.langBtnText, !isHindi && styles.langBtnTextActive]}>
                🇬🇧 English
              </Text>
            </TouchableOpacity>
          </View>

          {/* AI Settings / Key Button */}
          <TouchableOpacity
            style={[styles.keySettingsBtn, hasApiKey && styles.keySettingsBtnActive]}
            onPress={() => setShowKeyModal(true)}
            activeOpacity={0.8}
          >
            <Ionicons
              name={hasApiKey ? 'sparkles' : 'key-outline'}
              size={15}
              color={hasApiKey ? '#2DD4BF' : '#94A3B8'}
              style={{ marginRight: 4 }}
            />
            <Text style={[styles.keySettingsText, hasApiKey && { color: '#2DD4BF' }]}>
              {hasApiKey ? 'AI Vision ON' : 'AI Key'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Unified All-in-One Search Bar: Type, Clear, Voice Mic, and Camera Upload */}
        <View style={[styles.searchBarWrapper, isListening && styles.searchBarListening]}>
          <Ionicons name="search" size={20} color="#2DD4BF" style={styles.searchIcon} />

          <TextInput
            style={styles.searchInput}
            placeholder={
              isHindi
                ? 'दवा का नाम, सॉल्ट या बीमारी लिखें...'
                : 'Type medicine name, salt or symptom...'
            }
            placeholderTextColor="#64748B"
            value={searchQuery}
            onChangeText={(txt) => {
              setSearchQuery(txt);
              if (!txt.trim()) setSearchResults([]);
              if (selectedMedicine) setSelectedMedicine(null);
            }}
            autoCapitalize="none"
            autoCorrect={false}
          />

          {loading && (
            <ActivityIndicator size="small" color="#2DD4BF" style={{ marginRight: 6 }} />
          )}

          {/* Clear text button */}
          {Boolean(searchQuery) && (
            <TouchableOpacity
              onPress={() => {
                setSearchQuery('');
                setSearchResults([]);
              }}
              style={styles.searchActionBtn}
            >
              <Ionicons name="close" size={18} color="#94A3B8" />
            </TouchableOpacity>
          )}

          {/* Voice Search (Mic) Button */}
          <TouchableOpacity
            onPress={handleVoiceSearch}
            style={[styles.searchActionBtn, isListening && styles.micBtnActive]}
            activeOpacity={0.7}
          >
            <Ionicons
              name={isListening ? 'mic' : 'mic-outline'}
              size={20}
              color={isListening ? '#EF4444' : '#2DD4BF'}
            />
          </TouchableOpacity>

          {/* Camera / Photo Upload Button */}
          <TouchableOpacity
            onPress={() => setShowMediaModal(true)}
            style={styles.searchActionBtn}
            activeOpacity={0.7}
          >
            <Ionicons name="camera-outline" size={20} color="#2DD4BF" />
          </TouchableOpacity>
        </View>

        {/* Live Speech Recognition / Scanner Status Notice */}
        {Boolean(infoNotice) && (
          <View style={styles.voiceStatusPill}>
            <Ionicons
              name={isListening ? 'radio-button-on' : 'information-circle'}
              size={14}
              color={isListening ? '#EF4444' : '#2DD4BF'}
              style={{ marginRight: 6 }}
            />
            <Text style={styles.voiceStatusText}>{infoNotice}</Text>
          </View>
        )}

        {/* Image Preview & Scanning Status */}
        {capturedImage && (
          <View style={styles.imagePreviewBox}>
            <Image source={{ uri: capturedImage }} style={styles.thumbnailImg} />
            <View style={styles.imagePreviewTextWrap}>
              <Text style={styles.imagePreviewTitle}>
                {isHindi ? 'स्कैन की गई फोटो' : 'Scanned Image'}
              </Text>
              <Text style={styles.imagePreviewSub} numberOfLines={1}>
                {infoNotice || (isHindi ? 'विश्लेषण पूरा हुआ' : 'Analysis complete')}
              </Text>
            </View>
            {loading ? (
              <ActivityIndicator size="small" color="#2DD4BF" style={{ marginRight: 8 }} />
            ) : (
              <TouchableOpacity
                onPress={() => {
                  setCapturedImage(null);
                  setInfoNotice('');
                }}
                style={styles.closeThumbBtn}
              >
                <Ionicons name="close-circle" size={22} color="#94A3B8" />
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* SELECTED MEDICINE DETAIL VIEW */}
        {selectedMedicine ? (
          <View style={styles.detailContainer}>
            {/* Back to list button */}
            <TouchableOpacity
              style={styles.backToListBtn}
              onPress={() => setSelectedMedicine(null)}
              activeOpacity={0.8}
            >
              <Ionicons name="chevron-back" size={18} color="#2DD4BF" />
              <Text style={styles.backToListText}>
                {isHindi ? 'सभी दवाएं देखें' : 'Back to medicines list'}
              </Text>
            </TouchableOpacity>

            {/* Medicine Hero Card */}
            <LinearGradient
              colors={['#0F242A', '#0B1C22', '#07151A']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.medHeroCard}
            >
              <View style={styles.medHeroHeader}>
                <View style={styles.medHeroBadgeRow}>
                  <View style={styles.categoryBadge}>
                    <Text style={styles.categoryBadgeText}>
                      {isHindi
                        ? selectedMedicine.category_hi || selectedMedicine.category_en
                        : selectedMedicine.category_en || selectedMedicine.category_hi}
                    </Text>
                  </View>

                  <View style={styles.verifiedBadge}>
                    <Ionicons name="checkmark-circle" size={13} color="#34D399" />
                    <Text style={styles.verifiedBadgeText}>
                      {selectedMedicine.source === 'gemini-vision' ||
                      selectedMedicine.source === 'gemini-ai'
                        ? 'AI Verified'
                        : isHindi
                        ? 'सत्यापित'
                        : 'Verified'}
                    </Text>
                  </View>
                </View>

                <Text style={styles.medHeroTitle}>{selectedMedicine.name}</Text>

                {Boolean(selectedMedicine.salt) && (
                  <View style={styles.saltRow}>
                    <MaterialCommunityIcons name="molecule" size={16} color="#5EEAD4" />
                    <Text style={styles.saltText}>{selectedMedicine.salt}</Text>
                  </View>
                )}

                {selectedMedicine.brandNames && selectedMedicine.brandNames.length > 0 && (
                  <View style={styles.brandNamesWrap}>
                    <Text style={styles.brandNamesLabel}>
                      {isHindi ? 'प्रसिद्ध ब्रांड:' : 'Common Brands:'}
                    </Text>
                    <Text style={styles.brandNamesList}>
                      {selectedMedicine.brandNames.join(' · ')}
                    </Text>
                  </View>
                )}
              </View>
            </LinearGradient>

            {/* Section 1: Primary Uses (किस काम आती है) */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionTitleRow}>
                <View
                  style={[
                    styles.sectionIconBox,
                    { backgroundColor: 'rgba(45, 212, 191, 0.15)' },
                  ]}
                >
                  <Ionicons name="medical" size={18} color="#2DD4BF" />
                </View>
                <Text style={styles.sectionTitle}>
                  {isHindi ? 'दवा किस काम आती है (मुख्य उपयोग)' : 'Primary Uses & Indications'}
                </Text>
              </View>

              <View style={styles.bulletsWrap}>
                {(isHindi
                  ? selectedMedicine.uses_hi
                  : selectedMedicine.uses_en || selectedMedicine.uses_hi
                )?.map((useItem, idx) => (
                  <View key={idx} style={styles.bulletRow}>
                    <Ionicons
                      name="checkmark-done"
                      size={16}
                      color="#2DD4BF"
                      style={styles.bulletIcon}
                    />
                    <Text style={styles.bulletText}>{useItem}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Section 2: Side Effects (संभावित दुष्प्रभाव) */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionTitleRow}>
                <View
                  style={[
                    styles.sectionIconBox,
                    { backgroundColor: 'rgba(245, 158, 11, 0.15)' },
                  ]}
                >
                  <Ionicons name="alert-circle" size={18} color="#F59E0B" />
                </View>
                <Text style={styles.sectionTitle}>
                  {isHindi ? 'साइड इफेक्ट्स (संभावित दुष्प्रभाव)' : 'Potential Side Effects'}
                </Text>
              </View>

              {/* Common Side Effects */}
              <Text style={styles.subSectionHeader}>
                {isHindi ? 'सामान्य लक्षण (Common):' : 'Common Side Effects:'}
              </Text>
              <View style={styles.bulletsWrap}>
                {(isHindi
                  ? selectedMedicine.sideEffects_hi?.common
                  : selectedMedicine.sideEffects_en?.common ||
                    selectedMedicine.sideEffects_hi?.common
                )?.map((sideItem, idx) => (
                  <View key={idx} style={styles.bulletRow}>
                    <Ionicons
                      name="ellipse"
                      size={8}
                      color="#F59E0B"
                      style={styles.smallDotIcon}
                    />
                    <Text style={styles.bulletText}>{sideItem}</Text>
                  </View>
                ))}
              </View>

              {/* Serious / Warning Side Effects */}
              {((isHindi
                ? selectedMedicine.sideEffects_hi?.serious
                : selectedMedicine.sideEffects_en?.serious ||
                  selectedMedicine.sideEffects_hi?.serious
              )?.length || 0) > 0 && (
                <View style={styles.seriousAlertBox}>
                  <Ionicons
                    name="warning"
                    size={16}
                    color="#EF4444"
                    style={{ marginRight: 6, marginTop: 1 }}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.seriousAlertTitle}>
                      {isHindi
                        ? 'सावधानी / गंभीर लक्षण (Warning):'
                        : 'Caution / Serious Symptoms:'}
                    </Text>
                    {(isHindi
                      ? selectedMedicine.sideEffects_hi?.serious
                      : selectedMedicine.sideEffects_en?.serious ||
                        selectedMedicine.sideEffects_hi?.serious
                    )?.map((warnItem, wIdx) => (
                      <Text key={wIdx} style={styles.seriousAlertText}>
                        • {warnItem}
                      </Text>
                    ))}
                  </View>
                </View>
              )}
            </View>

            {/* Section 3: How to Use (कब और कैसे लें) */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionTitleRow}>
                <View
                  style={[
                    styles.sectionIconBox,
                    { backgroundColor: 'rgba(56, 189, 248, 0.15)' },
                  ]}
                >
                  <Ionicons name="time" size={18} color="#38BDF8" />
                </View>
                <Text style={styles.sectionTitle}>
                  {isHindi ? 'कब और कैसे लें (सेवन का तरीका)' : 'How & When to Take'}
                </Text>
              </View>
              <Text style={styles.howToUseText}>
                {isHindi
                  ? selectedMedicine.howToUse_hi || selectedMedicine.howToUse_en
                  : selectedMedicine.howToUse_en || selectedMedicine.howToUse_hi}
              </Text>
            </View>

            {/* Section 4: Key Precautions (ज़रूरी सावधानियां) */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionTitleRow}>
                <View
                  style={[
                    styles.sectionIconBox,
                    { backgroundColor: 'rgba(239, 68, 68, 0.15)' },
                  ]}
                >
                  <Ionicons name="shield-outline" size={18} color="#EF4444" />
                </View>
                <Text style={styles.sectionTitle}>
                  {isHindi ? 'ज़रूरी सावधानियां (Precautions)' : 'Important Precautions'}
                </Text>
              </View>

              <View style={styles.bulletsWrap}>
                {(isHindi
                  ? selectedMedicine.precautions_hi
                  : selectedMedicine.precautions_en || selectedMedicine.precautions_hi
                )?.map((pItem, idx) => (
                  <View key={idx} style={styles.bulletRow}>
                    <Ionicons
                      name="shield-checkmark"
                      size={16}
                      color="#F87171"
                      style={styles.bulletIcon}
                    />
                    <Text style={styles.bulletText}>{pItem}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Section 5: Safety Matrix (सुरक्षा सलाह - गर्भावस्था, शराब, ड्राइविंग) */}
            {selectedMedicine.safetyAdvice && (
              <View style={styles.sectionCard}>
                <View style={styles.sectionTitleRow}>
                  <View
                    style={[
                      styles.sectionIconBox,
                      { backgroundColor: 'rgba(168, 85, 247, 0.15)' },
                    ]}
                  >
                    <MaterialCommunityIcons name="shield-account" size={18} color="#A855F7" />
                  </View>
                  <Text style={styles.sectionTitle}>
                    {isHindi ? 'सुरक्षा मैट्रिक्स (Safety Advice)' : 'Safety Guidance'}
                  </Text>
                </View>

                <View style={styles.safetyGrid}>
                  {/* Pregnancy */}
                  <View style={styles.safetyCard}>
                    <View style={styles.safetyHeader}>
                      <MaterialCommunityIcons name="human-pregnant" size={18} color="#F472B6" />
                      <Text style={styles.safetyTitle}>
                        {isHindi ? 'गर्भावस्था' : 'Pregnancy'}
                      </Text>
                    </View>
                    <Text style={styles.safetyDesc}>
                      {isHindi
                        ? selectedMedicine.safetyAdvice.pregnancy?.text_hi
                        : selectedMedicine.safetyAdvice.pregnancy?.text_en}
                    </Text>
                  </View>

                  {/* Alcohol */}
                  <View style={styles.safetyCard}>
                    <View style={styles.safetyHeader}>
                      <Ionicons name="wine" size={17} color="#FB923C" />
                      <Text style={styles.safetyTitle}>
                        {isHindi ? 'शराब / अल्कोहल' : 'Alcohol'}
                      </Text>
                    </View>
                    <Text style={styles.safetyDesc}>
                      {isHindi
                        ? selectedMedicine.safetyAdvice.alcohol?.text_hi
                        : selectedMedicine.safetyAdvice.alcohol?.text_en}
                    </Text>
                  </View>

                  {/* Driving */}
                  <View style={styles.safetyCard}>
                    <View style={styles.safetyHeader}>
                      <Ionicons name="car" size={17} color="#38BDF8" />
                      <Text style={styles.safetyTitle}>{isHindi ? 'ड्राइविंग' : 'Driving'}</Text>
                    </View>
                    <Text style={styles.safetyDesc}>
                      {isHindi
                        ? selectedMedicine.safetyAdvice.driving?.text_hi
                        : selectedMedicine.safetyAdvice.driving?.text_en}
                    </Text>
                  </View>

                  {/* Kidney / Liver */}
                  <View style={styles.safetyCard}>
                    <View style={styles.safetyHeader}>
                      <MaterialCommunityIcons name="hospital-box" size={17} color="#34D399" />
                      <Text style={styles.safetyTitle}>
                        {isHindi ? 'किडनी / लिवर' : 'Kidney/Liver'}
                      </Text>
                    </View>
                    <Text style={styles.safetyDesc}>
                      {isHindi
                        ? selectedMedicine.safetyAdvice.kidneyLiver?.text_hi
                        : selectedMedicine.safetyAdvice.kidneyLiver?.text_en}
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* Mandatory Medical Safety Disclaimer */}
            <View style={styles.disclaimerBox}>
              <Ionicons
                name="information-circle"
                size={20}
                color="#FBBF24"
                style={{ marginRight: 8, marginTop: 2 }}
              />
              <Text style={styles.disclaimerText}>
                {isHindi
                  ? 'अस्वीकरण (Disclaimer): यह जानकारी केवल सामान्य जागरूकता और शैक्षिक उद्देश्य के लिए है। किसी भी दवा का सेवन या खुराक बदलने से पहले हमेशा योग्य डॉक्टर या फार्मासिस्ट से परामर्श अवश्य लें।'
                  : 'Medical Disclaimer: This information is for general educational awareness only. Always consult a qualified doctor or licensed pharmacist before starting, changing, or discontinuing any medication.'}
              </Text>
            </View>
          </View>
        ) : (
          /* MEDICINES LIST & CATEGORIES BROWSER */
          <View style={styles.browserContainer}>
            {/* Category Filter Chips Horizontal Scroll */}
            {!searchQuery.trim() && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoryScroll}
              >
                {CATEGORIES.map((cat) => {
                  const isActive = selectedCategory === cat.id;
                  return (
                    <TouchableOpacity
                      key={cat.id}
                      style={[styles.categoryChip, isActive && styles.categoryChipActive]}
                      onPress={() => setSelectedCategory(cat.id)}
                      activeOpacity={0.8}
                    >
                      <MaterialCommunityIcons
                        name={cat.icon}
                        size={15}
                        color={isActive ? '#0B1220' : '#2DD4BF'}
                        style={{ marginRight: 5 }}
                      />
                      <Text
                        style={[
                          styles.categoryChipText,
                          isActive && styles.categoryChipTextActive,
                        ]}
                      >
                        {isHindi ? cat.label_hi : cat.label_en}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}

            {/* Section Header */}
            <View style={styles.listHeaderRow}>
              <Text style={styles.listHeaderTitle}>
                {searchQuery.trim()
                  ? `${isHindi ? 'खोज परिणाम' : 'Search Results'} (${displayList.length})`
                  : isHindi
                  ? 'अक्सर इस्तेमाल होने वाली दवाएं'
                  : 'Popular Verified Medicines'}
              </Text>
              <Text style={styles.listHeaderSub}>
                {isHindi ? 'टैप करके पूरी जानकारी देखें' : 'Tap to see full details'}
              </Text>
            </View>

            {/* Medicines Cards List */}
            {displayList.length === 0 ? (
              <View style={styles.emptyWrap}>
                <MaterialCommunityIcons name="pill-off" size={48} color="#475569" />
                <Text style={styles.emptyTitle}>
                  {isHindi ? 'खोज जारी है...' : 'Searching...'}
                </Text>
                <Text style={styles.emptySub}>
                  {isHindi
                    ? 'कृपया दवा या सॉल्ट का नाम चेक करें, या ऊपर कैमरा से फोटो खींचकर स्कैन करें।'
                    : 'Please check the spelling or use the camera scan icon.'}
                </Text>
              </View>
            ) : (
              displayList.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.medicineListItem}
                  onPress={() => setSelectedMedicine(item)}
                  activeOpacity={0.82}
                >
                  <LinearGradient
                    colors={['#0F1E24', '#0B171C']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.medicineItemGradient}
                  >
                    <View style={styles.medicineItemLeft}>
                      <View style={styles.medIconBox}>
                        <MaterialCommunityIcons name="pill" size={24} color="#2DD4BF" />
                      </View>
                      <View style={styles.medItemTextWrap}>
                        <Text style={styles.medItemName}>{item.name}</Text>
                        <Text style={styles.medItemSalt} numberOfLines={1}>
                          {item.salt}
                        </Text>
                        <Text style={styles.medItemUse} numberOfLines={1}>
                          •{' '}
                          {isHindi ? item.uses_hi?.[0] : item.uses_en?.[0] || item.uses_hi?.[0]}
                        </Text>
                      </View>
                    </View>

                    <Ionicons name="chevron-forward" size={20} color="#2DD4BF" />
                  </LinearGradient>
                </TouchableOpacity>
              ))
            )}
          </View>
        )}
      </ScrollView>

      {/* MEDIA PICKER MODAL (Camera vs Gallery) */}
      <Modal
        visible={showMediaModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMediaModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowMediaModal(false)}
        >
          <View style={styles.mediaPickerCard}>
            <View style={styles.mediaPickerHeader}>
              <Text style={styles.mediaPickerTitle}>
                {isHindi ? 'दवा की फोटो चुनें' : 'Scan Medicine Image'}
              </Text>
              <TouchableOpacity onPress={() => setShowMediaModal(false)}>
                <Ionicons name="close" size={22} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <Text style={styles.mediaPickerSub}>
              {isHindi
                ? 'दवा के पत्ते या रैपर की साफ फोटो लेकर AI से तुरंत नाम व उपयोग जानें।'
                : 'Take or choose a clear photo of the medicine strip to identify.'}
            </Text>

            <View style={styles.mediaPickerOptionsRow}>
              {/* Option 1: Camera */}
              <TouchableOpacity
                style={styles.mediaOptionBtn}
                onPress={handleCaptureImage}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={['#0F766E', '#115E59', '#134E4A']}
                  style={styles.mediaOptionGradient}
                >
                  <Ionicons name="camera" size={32} color="#5EEAD4" />
                  <Text style={styles.mediaOptionTitle}>
                    {isHindi ? 'कैमरा से खींचें' : 'Take Photo'}
                  </Text>
                  <Text style={styles.mediaOptionDesc}>
                    {isHindi ? 'लाइव फोटो लें' : 'Open Camera'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>

              {/* Option 2: Gallery */}
              <TouchableOpacity
                style={styles.mediaOptionBtn}
                onPress={handleUploadImage}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={['#0369A1', '#075985', '#0C4A6E']}
                  style={styles.mediaOptionGradient}
                >
                  <Ionicons name="images" size={32} color="#7DD3FC" />
                  <Text style={styles.mediaOptionTitle}>
                    {isHindi ? 'गैलरी से चुनें' : 'Choose Gallery'}
                  </Text>
                  <Text style={styles.mediaOptionDesc}>
                    {isHindi ? 'फोटो अपलोड करें' : 'From Storage'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* GEMINI API KEY MODAL */}
      <Modal
        visible={showKeyModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowKeyModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderTitleRow}>
                <Ionicons name="sparkles" size={20} color="#2DD4BF" style={{ marginRight: 6 }} />
                <Text style={styles.modalTitle}>
                  {isHindi ? 'Google Gemini AI सेटिंग्स' : 'Google Gemini AI Settings'}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowKeyModal(false)}>
                <Ionicons name="close" size={22} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalDesc}>
              {isHindi
                ? 'दवा के पत्ते या शीशी की लाइव फोटो को AI से पहचानने के लिए अपनी मुफ़्त Google Gemini API Key दर्ज करें। (यह Key आपके फ़ोन में सुरक्षित रहेगी)'
                : 'Enter your free Google Gemini API Key for live AI vision recognition of any medicine strip or bottle.'}
            </Text>

            <TextInput
              style={styles.keyInput}
              placeholder="Paste AIzaSy... API key here"
              placeholderTextColor="#64748B"
              value={apiKeyInput}
              onChangeText={setApiKeyInput}
              autoCapitalize="none"
              autoCorrect={false}
              secureTextEntry
            />

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setShowKeyModal(false)}
              >
                <Text style={styles.modalCancelText}>
                  {isHindi ? 'रद्द करें' : 'Cancel'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalSaveBtn}
                onPress={handleSaveApiKey}
              >
                <LinearGradient
                  colors={['#2DD4BF', '#0D9488']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.modalSaveGradient}
                >
                  <Text style={styles.modalSaveText}>
                    {isHindi ? 'सहेजें (Save)' : 'Save Key'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgDark,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 40,
  },

  /* Top Control Bar */
  topControlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  langSwitchWrapper: {
    flexDirection: 'row',
    backgroundColor: '#0F1E24',
    borderRadius: 24,
    padding: 3,
    borderWidth: 1,
    borderColor: 'rgba(45, 212, 191, 0.25)',
  },
  langBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  langBtnActive: {
    backgroundColor: '#2DD4BF',
  },
  langBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
  },
  langBtnTextActive: {
    color: '#042F2E',
  },
  keySettingsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F1E24',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.2)',
  },
  keySettingsBtnActive: {
    borderColor: 'rgba(45, 212, 191, 0.5)',
    backgroundColor: 'rgba(45, 212, 191, 0.08)',
  },
  keySettingsText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
  },

  /* All-in-One Search Bar */
  searchBarWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0B171C',
    borderRadius: 16,
    paddingHorizontal: 12,
    height: 52,
    borderWidth: 1.5,
    borderColor: 'rgba(45, 212, 191, 0.4)',
    marginBottom: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
  },
  searchBarListening: {
    borderColor: '#EF4444',
    backgroundColor: 'rgba(239, 68, 68, 0.06)',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#F8FAFC',
    fontSize: 14,
    paddingVertical: 8,
  },
  searchActionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
    backgroundColor: 'rgba(45, 212, 191, 0.08)',
  },
  micBtnActive: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
  },
  voiceStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(45, 212, 191, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 10,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(45, 212, 191, 0.25)',
  },
  voiceStatusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#5EEAD4',
  },

  /* Image Preview */
  imagePreviewBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F242A',
    borderRadius: 14,
    padding: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(45, 212, 191, 0.3)',
  },
  thumbnailImg: {
    width: 44,
    height: 44,
    borderRadius: 8,
  },
  imagePreviewTextWrap: {
    flex: 1,
    marginLeft: 10,
  },
  imagePreviewTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  imagePreviewSub: {
    fontSize: 11,
    color: '#2DD4BF',
    marginTop: 1,
  },
  closeThumbBtn: {
    padding: 6,
  },

  /* Category Scroll */
  categoryScroll: {
    paddingBottom: 10,
    gap: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#0F1E24',
    borderWidth: 1,
    borderColor: 'rgba(45, 212, 191, 0.25)',
  },
  categoryChipActive: {
    backgroundColor: '#2DD4BF',
    borderColor: '#2DD4BF',
  },
  categoryChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#E2E8F0',
  },
  categoryChipTextActive: {
    color: '#042F2E',
  },

  /* List Header */
  listHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginTop: 6,
    marginBottom: 10,
  },
  listHeaderTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  listHeaderSub: {
    fontSize: 11,
    color: '#94A3B8',
  },

  /* Medicine List Items */
  medicineListItem: {
    marginBottom: 10,
    borderRadius: 16,
    overflow: 'hidden',
  },
  medicineItemGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(45, 212, 191, 0.15)',
  },
  medicineItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  medIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(45, 212, 191, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: 'rgba(45, 212, 191, 0.25)',
  },
  medItemTextWrap: {
    flex: 1,
  },
  medItemName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  medItemSalt: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#2DD4BF',
    marginTop: 2,
  },
  medItemUse: {
    fontSize: 11.5,
    color: '#94A3B8',
    marginTop: 3,
  },

  /* Empty State */
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#E2E8F0',
    marginTop: 12,
  },
  emptySub: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: 20,
  },

  /* Detail Screen */
  detailContainer: {
    marginTop: 2,
  },
  backToListBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    alignSelf: 'flex-start',
    paddingVertical: 4,
  },
  backToListText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2DD4BF',
    marginLeft: 4,
  },
  medHeroCard: {
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1.2,
    borderColor: 'rgba(45, 212, 191, 0.35)',
  },
  medHeroHeader: {},
  medHeroBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  categoryBadge: {
    backgroundColor: 'rgba(45, 212, 191, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(45, 212, 191, 0.3)',
  },
  categoryBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#5EEAD4',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(52, 211, 153, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  verifiedBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#34D399',
    marginLeft: 4,
  },
  medHeroTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  saltRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  saltText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#5EEAD4',
    marginLeft: 6,
  },
  brandNamesWrap: {
    marginTop: 8,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  brandNamesLabel: {
    fontSize: 11,
    color: '#94A3B8',
    marginRight: 4,
  },
  brandNamesList: {
    fontSize: 11,
    fontWeight: '700',
    color: '#CBD5E1',
  },

  /* Generic Section Cards */
  sectionCard: {
    backgroundColor: '#0C181E',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(45, 212, 191, 0.15)',
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#F8FAFC',
    flex: 1,
  },
  bulletsWrap: {
    gap: 8,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  bulletIcon: {
    marginRight: 8,
    marginTop: 2,
  },
  smallDotIcon: {
    marginRight: 8,
    marginTop: 6,
  },
  bulletText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    color: '#E2E8F0',
  },
  subSectionHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FBBF24',
    marginBottom: 6,
  },
  seriousAlertBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 12,
    padding: 10,
    marginTop: 10,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  seriousAlertTitle: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#F87171',
    marginBottom: 3,
  },
  seriousAlertText: {
    fontSize: 12,
    color: '#FECACA',
    lineHeight: 17,
  },
  howToUseText: {
    fontSize: 13,
    lineHeight: 20,
    color: '#E2E8F0',
  },

  /* Safety Matrix */
  safetyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  safetyCard: {
    width: '48%',
    backgroundColor: '#0F2128',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.12)',
  },
  safetyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  safetyTitle: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#F8FAFC',
    marginLeft: 6,
  },
  safetyDesc: {
    fontSize: 11,
    lineHeight: 15,
    color: '#94A3B8',
  },

  /* Disclaimer */
  disclaimerBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(251, 191, 36, 0.08)',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.3)',
    marginTop: 4,
    marginBottom: 20,
  },
  disclaimerText: {
    flex: 1,
    fontSize: 11.5,
    lineHeight: 17,
    color: '#FDE68A',
  },

  /* Media Picker Modal */
  mediaPickerCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#0F1E24',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(45, 212, 191, 0.4)',
  },
  mediaPickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  mediaPickerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  mediaPickerSub: {
    fontSize: 12,
    color: '#94A3B8',
    lineHeight: 17,
    marginBottom: 16,
  },
  mediaPickerOptionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  mediaOptionBtn: {
    flex: 1,
    borderRadius: 18,
    overflow: 'hidden',
  },
  mediaOptionGradient: {
    paddingVertical: 18,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mediaOptionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#F8FAFC',
    marginTop: 8,
  },
  mediaOptionDesc: {
    fontSize: 11,
    color: 'rgba(248, 250, 252, 0.7)',
    marginTop: 2,
  },

  /* Modal */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#0F1E24',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1.5,
    borderColor: 'rgba(45, 212, 191, 0.4)',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  modalHeaderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  modalDesc: {
    fontSize: 12,
    color: '#94A3B8',
    lineHeight: 17,
    marginBottom: 14,
  },
  keyInput: {
    backgroundColor: '#07151A',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(45, 212, 191, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#F8FAFC',
    fontSize: 13,
    marginBottom: 16,
  },
  modalBtnRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  modalCancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  modalCancelText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '700',
  },
  modalSaveBtn: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  modalSaveGradient: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  modalSaveText: {
    color: '#042F2E',
    fontSize: 13,
    fontWeight: '800',
  },
});
