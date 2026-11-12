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
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Colors } from '../theme/colors';
import ScreenHeader from '../components/ScreenHeader';
import { resolveMedicine } from '../services/clinicalMedicineService';

const SUGGESTIONS = [
  'Ajubi Tablet',
  'Buxo-40',
  'Dolo 650',
  'Combiflam',
  'Pan-D',
  'Azithral 500',
  'Cetirizine',
  'Augmentin 625',
  'Telma 40',
  'Meftal-Spas',
];

export default function MedicineGuideScreen({ onBack }) {
  const [lang, setLang] = useState('hi'); // 'hi' (Hindi) or 'en' (English)
  const [searchQuery, setSearchQuery] = useState('');
  const [medicineResult, setMedicineResult] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [infoNotice, setInfoNotice] = useState('');
  const [isListening, setIsListening] = useState(false);

  const recognitionRef = useRef(null);

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

  // Execute Dynamic Search for ANY medicine name
  const executeSearch = async (term) => {
    const cleanTerm = (term || searchQuery).trim();
    if (!cleanTerm) return;

    setLoading(true);
    setInfoNotice('');

    try {
      const result = await resolveMedicine(cleanTerm);
      if (result) {
        setMedicineResult(result);
      }
    } catch (_err) {
      Alert.alert(
        lang === 'hi' ? 'त्रुटि' : 'Error',
        lang === 'hi'
          ? 'जानकारी प्राप्त करने में समस्या आई। कृपया पुनः प्रयास करें।'
          : 'Could not fetch medicine information. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Voice Search Handler (Web Speech API)
  const handleVoiceSearch = () => {
    const SpeechRecognition =
      (typeof window !== 'undefined' &&
        (window.SpeechRecognition || window.webkitSpeechRecognition)) ||
      null;

    if (!SpeechRecognition) {
      Alert.alert(
        lang === 'hi' ? 'वॉयस सर्च' : 'Voice Search',
        lang === 'hi'
          ? 'आपके ब्राउज़र में स्पीच रिकॉग्निशन उपलब्ध नहीं है। कृपया दवा का नाम टाइप करें।'
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
          const spoken = transcript.trim();
          setSearchQuery(spoken);
          setInfoNotice(lang === 'hi' ? `बोला गया: "${spoken}"` : `Heard: "${spoken}"`);
          executeSearch(spoken);
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
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setCapturedImage(result.assets[0].uri);
        setInfoNotice(
          lang === 'hi'
            ? 'फोटो प्राप्त हुई। नीचे दवा का नाम लिखकर खोजें।'
            : 'Photo attached. Enter or verify name to search.'
        );
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
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setCapturedImage(result.assets[0].uri);
        setInfoNotice(
          lang === 'hi'
            ? 'फोटो अपलोड हुई। नीचे दवा का नाम लिखकर खोजें।'
            : 'Photo uploaded. Enter or verify name to search.'
        );
      }
    } catch (_e) {
      Alert.alert(
        lang === 'hi' ? 'त्रुटि' : 'Error',
        lang === 'hi' ? 'फोटो गैलरी खोलने में समस्या आई।' : 'Could not access photo library.'
      );
    }
  };

  const isHindi = lang === 'hi';

  return (
    <View style={styles.container}>
      {/* Header */}
      <ScreenHeader
        title={isHindi ? 'दवाई जानकारी' : 'Medicine Guide'}
        subtitle={isHindi ? 'उपयोग, साइड इफेक्ट्स व सुरक्षा' : 'Uses, Side Effects & Safety'}
        icon="pill"
        theme="teal"
        onBack={onBack}
        onReset={() => {
          setMedicineResult(null);
          setSearchQuery('');
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
        {/* Top Language Toggle Bar (No AI Key button) */}
        <View style={styles.topControlRow}>
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
        </View>

        {/* Unified Search Bar */}
        <View style={[styles.searchBarWrapper, isListening && styles.searchBarListening]}>
          <Ionicons name="search" size={20} color="#2DD4BF" style={styles.searchIcon} />

          <TextInput
            style={styles.searchInput}
            placeholder={
              isHindi
                ? 'दवा का नाम लिखें (जैसे Buxo-40, Dolo, Pan-D)...'
                : 'Type medicine name (e.g. Buxo-40, Dolo, Pan-D)...'
            }
            placeholderTextColor="#64748B"
            value={searchQuery}
            onChangeText={(txt) => setSearchQuery(txt)}
            onSubmitEditing={() => executeSearch()}
            returnKeyType="search"
            autoCapitalize="words"
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
                setMedicineResult(null);
                setInfoNotice('');
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

          {/* Search Action Button */}
          <TouchableOpacity
            onPress={() => executeSearch()}
            style={styles.searchSubmitBtn}
            activeOpacity={0.8}
          >
            <Text style={styles.searchSubmitBtnText}>
              {isHindi ? 'खोजें' : 'Search'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Live Speech Recognition / Status Notice */}
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

        {/* Image Preview */}
        {capturedImage && (
          <View style={styles.imagePreviewBox}>
            <Image source={{ uri: capturedImage }} style={styles.thumbnailImg} />
            <View style={styles.imagePreviewTextWrap}>
              <Text style={styles.imagePreviewTitle}>
                {isHindi ? 'दवा की फोटो' : 'Attached Photo'}
              </Text>
              <Text style={styles.imagePreviewSub} numberOfLines={1}>
                {isHindi ? 'सर्च बॉक्स में नाम लिखकर खोजें' : 'Ready to search'}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => {
                setCapturedImage(null);
                setInfoNotice('');
              }}
              style={styles.closeThumbBtn}
            >
              <Ionicons name="close-circle" size={22} color="#94A3B8" />
            </TouchableOpacity>
          </View>
        )}

        {/* DYNAMIC RESULT: USER-SEARCHED MEDICINE DETAILS */}
        {medicineResult ? (
          <View style={styles.detailContainer}>
            {/* Intro Summary Card (Displays EXACT medicine name + 1-line summary) */}
            <LinearGradient
              colors={['#0F242A', '#0B1C22', '#07151A']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.medHeroCard}
            >
              <View style={styles.medHeroHeader}>
                <View style={styles.medHeroBadgeRow}>
                  <View style={styles.verifiedBadge}>
                    <Ionicons name="checkmark-circle" size={13} color="#34D399" />
                    <Text style={styles.verifiedBadgeText}>
                      {isHindi ? 'दवा की जानकारी' : 'Medicine Information'}
                    </Text>
                  </View>
                </View>

                {/* EXACT NAME SEARCHED BY USER */}
                <Text style={styles.medHeroTitle}>{medicineResult.name}</Text>

                {/* Intro Summary Sentence */}
                <Text style={styles.introSummaryText}>
                  {isHindi
                    ? medicineResult.intro_hi || medicineResult.intro_en
                    : medicineResult.intro_en || medicineResult.intro_hi}
                </Text>
              </View>
            </LinearGradient>

            {/* Section 1: मुख्य उपयोग (Uses) */}
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
                  {isHindi ? 'मुख्य उपयोग (Uses)' : 'Primary Uses (Uses)'}
                </Text>
              </View>

              <Text style={styles.usesIntroText}>
                {isHindi
                  ? medicineResult.usesIntro_hi || medicineResult.usesIntro_en
                  : medicineResult.usesIntro_en || medicineResult.usesIntro_hi}
              </Text>

              <View style={styles.bulletsWrap}>
                {(isHindi
                  ? medicineResult.uses_hi
                  : medicineResult.uses_en || medicineResult.uses_hi
                )?.map((useItem, idx) => (
                  <View key={idx} style={styles.bulletRow}>
                    <Ionicons
                      name="ellipse"
                      size={7}
                      color="#2DD4BF"
                      style={styles.smallDotIcon}
                    />
                    <Text style={styles.bulletText}>
                      {typeof useItem === 'object' && useItem.label ? (
                        <>
                          <Text style={styles.bulletLabel}>{useItem.label}: </Text>
                          {useItem.desc}
                        </>
                      ) : (
                        String(useItem)
                      )}
                    </Text>
                  </View>
                ))}
              </View>

              {Boolean(medicineResult.oneMgUrl) && (
                <TouchableOpacity
                  style={styles.oneMgLinkBox}
                  onPress={() => Linking.openURL(medicineResult.oneMgUrl)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="open-outline" size={16} color="#38BDF8" />
                  <Text style={styles.oneMgLinkText}>
                    {isHindi
                      ? `आप इस दवा के बारे में अधिक जानकारी Tata 1mg पर ${medicineResult.name} के माध्यम से देख सकते हैं।`
                      : `View more details about ${medicineResult.name} on Tata 1mg.`}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Section 2: सामान्य दुष्प्रभाव (Side Effects) */}
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
                  {isHindi
                    ? 'सामान्य दुष्प्रभाव (Side Effects)'
                    : 'Common Side Effects'}
                </Text>
              </View>

              <View style={styles.bulletsWrap}>
                {(isHindi
                  ? medicineResult.sideEffects_hi
                  : medicineResult.sideEffects_en || medicineResult.sideEffects_hi
                )?.map((sideItem, idx) => (
                  <View key={idx} style={styles.bulletRow}>
                    <Ionicons
                      name="ellipse"
                      size={7}
                      color="#F59E0B"
                      style={styles.smallDotIcon}
                    />
                    <Text style={styles.bulletText}>{sideItem}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Section 3: सावधानी और चेतावनी */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionTitleRow}>
                <View
                  style={[
                    styles.sectionIconBox,
                    { backgroundColor: 'rgba(239, 68, 68, 0.15)' },
                  ]}
                >
                  <Ionicons name="warning" size={18} color="#EF4444" />
                </View>
                <Text style={styles.sectionTitle}>
                  {isHindi
                    ? 'सावधानी और चेतावनी'
                    : 'Precautions & Warnings'}
                </Text>
              </View>

              <View style={styles.bulletsWrap}>
                {(isHindi
                  ? medicineResult.warnings_hi
                  : medicineResult.warnings_en || medicineResult.warnings_hi
                )?.map((wItem, idx) => (
                  <View key={idx} style={styles.bulletRow}>
                    <Ionicons
                      name="ellipse"
                      size={7}
                      color="#EF4444"
                      style={styles.smallDotIcon}
                    />
                    <Text style={styles.bulletText}>
                      {typeof wItem === 'object' && wItem.label ? (
                        <>
                          <Text style={styles.bulletLabel}>{wItem.label}: </Text>
                          {wItem.desc}
                        </>
                      ) : (
                        String(wItem)
                      )}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

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
          /* CLEAN WELCOME SCREEN WHEN NO SEARCH PERFORMED YET (NO STATIC CARDS LIST) */
          <View style={styles.welcomeContainer}>
            <View style={styles.welcomeIconCircle}>
              <MaterialCommunityIcons name="pill" size={42} color="#2DD4BF" />
            </View>

            <Text style={styles.welcomeTitle}>
              {isHindi ? 'किसी भी दवा की सही जानकारी पाएं' : 'Find Verified Medicine Details'}
            </Text>

            <Text style={styles.welcomeSub}>
              {isHindi
                ? 'ऊपर सर्च बार में दवा का नाम लिखें, बोलकर 🎙️ सर्च करें, या कैमरे 📷 से फोटो अपलोड करें।'
                : 'Type any medicine name above, use voice search 🎙️, or upload a photo 📷.'}
            </Text>

            {/* Quick Suggestion Pills */}
            <View style={styles.suggestionsWrapper}>
              <Text style={styles.suggestionsHeader}>
                {isHindi ? 'उदाहरण (टैप करके देखें):' : 'Examples (tap to search):'}
              </Text>
              <View style={styles.suggestionChipsWrap}>
                {SUGGESTIONS.map((sug, sIdx) => (
                  <TouchableOpacity
                    key={sIdx}
                    style={styles.suggestionChip}
                    onPress={() => {
                      setSearchQuery(sug);
                      executeSearch(sug);
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.suggestionChipText}>{sug}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
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
                {isHindi ? 'दवा की फोटो चुनें' : 'Attach Medicine Photo'}
              </Text>
              <TouchableOpacity onPress={() => setShowMediaModal(false)}>
                <Ionicons name="close" size={22} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <Text style={styles.mediaPickerSub}>
              {isHindi
                ? 'दवा के पत्ते या रैपर की फोटो लेकर साथ में अटैच करें।'
                : 'Take or choose a clear photo of the medicine strip.'}
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
                  <Ionicons name="camera" size={30} color="#5EEAD4" />
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
                  <Ionicons name="images" size={30} color="#7DD3FC" />
                  <Text style={styles.mediaOptionTitle}>
                    {isHindi ? 'गैलरी से चुनें' : 'Choose Gallery'}
                  </Text>
                  <Text style={styles.mediaOptionDesc}>
                    {isHindi ? 'फोटो चुनें' : 'From Storage'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
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
    justifyContent: 'flex-start',
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

  /* All-in-One Search Bar */
  searchBarWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0B171C',
    borderRadius: 16,
    paddingHorizontal: 10,
    height: 52,
    borderWidth: 1.5,
    borderColor: 'rgba(45, 212, 191, 0.4)',
    marginBottom: 14,
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
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    color: '#F8FAFC',
    fontSize: 13.5,
    paddingVertical: 8,
  },
  searchActionBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 3,
    backgroundColor: 'rgba(45, 212, 191, 0.08)',
  },
  micBtnActive: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
  },
  searchSubmitBtn: {
    backgroundColor: '#2DD4BF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    marginLeft: 6,
  },
  searchSubmitBtnText: {
    color: '#042F2E',
    fontSize: 12.5,
    fontWeight: '800',
  },

  voiceStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(45, 212, 191, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 12,
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
    marginBottom: 14,
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

  /* Welcome Screen State (No static cards clutter) */
  welcomeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    paddingHorizontal: 10,
  },
  welcomeIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(45, 212, 191, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(45, 212, 191, 0.3)',
  },
  welcomeTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#F8FAFC',
    textAlign: 'center',
    marginBottom: 8,
  },
  welcomeSub: {
    fontSize: 13,
    lineHeight: 19,
    color: '#94A3B8',
    textAlign: 'center',
    maxWidth: 320,
    marginBottom: 24,
  },
  suggestionsWrapper: {
    width: '100%',
    alignItems: 'center',
  },
  suggestionsHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 10,
  },
  suggestionChipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  suggestionChip: {
    backgroundColor: '#0F1E24',
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(45, 212, 191, 0.25)',
  },
  suggestionChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#5EEAD4',
  },

  /* Detail Screen */
  detailContainer: {
    marginTop: 2,
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
    justifyContent: 'flex-start',
    marginBottom: 8,
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
    fontSize: 23,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.3,
    marginBottom: 8,
  },
  introSummaryText: {
    fontSize: 13.5,
    lineHeight: 20,
    color: '#E2E8F0',
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
  usesIntroText: {
    fontSize: 13,
    lineHeight: 19,
    color: '#CBD5E1',
    marginBottom: 10,
  },
  bulletsWrap: {
    gap: 8,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  smallDotIcon: {
    marginRight: 9,
    marginTop: 6,
  },
  bulletText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 20,
    color: '#E2E8F0',
  },
  bulletLabel: {
    fontWeight: '800',
    color: '#F8FAFC',
  },
  oneMgLinkBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 12,
    padding: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
    gap: 8,
  },
  oneMgLinkText: {
    flex: 1,
    fontSize: 12.5,
    lineHeight: 18,
    color: '#38BDF8',
    fontWeight: '600',
    textDecorationLine: 'underline',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
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
});
