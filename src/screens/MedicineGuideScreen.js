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
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Colors } from '../theme/colors';
import ScreenHeader from '../components/ScreenHeader';
import { resolveMedicine } from '../services/clinicalMedicineService';
import { scanMedicineImage } from '../services/medicineScanService';

export default function MedicineGuideScreen({ onBack }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [medicineResult, setMedicineResult] = useState(null);
  const [notFoundTerm, setNotFoundTerm] = useState('');
  const [capturedImage, setCapturedImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [infoNotice, setInfoNotice] = useState('');
  const [isListening, setIsListening] = useState(false);

  const recognitionRef = useRef(null);
  const [skeletonOpacity] = useState(() => new Animated.Value(0.35));

  // Pulsing skeleton animation loop while searching
  useEffect(() => {
    if (loading) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(skeletonOpacity, {
            toValue: 0.95,
            duration: 750,
            useNativeDriver: Platform.OS !== 'web',
          }),
          Animated.timing(skeletonOpacity, {
            toValue: 0.35,
            duration: 750,
            useNativeDriver: Platform.OS !== 'web',
          }),
        ])
      );
      loop.start();
      return () => loop.stop();
    } else {
      skeletonOpacity.setValue(0.35);
    }
  }, [loading, skeletonOpacity]);

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

  // Execute 100% Live Search for ANY medicine name (zero static data)
  const executeSearch = async (term) => {
    const cleanTerm = (term || searchQuery).trim();
    if (!cleanTerm) return;

    setLoading(true);
    setInfoNotice('');
    setNotFoundTerm('');

    try {
      const result = await resolveMedicine(cleanTerm);
      if (result) {
        setMedicineResult(result);
        setNotFoundTerm('');
      } else {
        setMedicineResult(null);
        setNotFoundTerm(cleanTerm);
      }
    } catch (_err) {
      setMedicineResult(null);
      setNotFoundTerm(cleanTerm);
      Alert.alert(
        'त्रुटि',
        'लाइव जानकारी प्राप्त करने में समस्या आई। कृपया इंटरनेट कनेक्शन या दवा का नाम जांचें।'
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
        'वॉयस सर्च',
        'आपके ब्राउज़र में स्पीच रिकॉग्निशन उपलब्ध नहीं है। कृपया दवा का नाम टाइप करें।'
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
      recognition.lang = 'hi-IN';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListening(true);
        setInfoNotice('🎙️ बोलिए, सुन रहे हैं...');
      };

      recognition.onresult = (event) => {
        const transcript = event.results?.[0]?.[0]?.transcript || '';
        if (transcript.trim()) {
          const spoken = transcript.trim();
          setSearchQuery(spoken);
          setInfoNotice(`बोला गया: "${spoken}"`);
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

  // Process Selected or Captured Medicine Image with AI & OCR
  const processSelectedImage = async (asset) => {
    if (!asset || !asset.uri) return;

    setCapturedImage(asset.uri);
    setLoading(true);
    setMedicineResult(null);
    setNotFoundTerm('');
    setInfoNotice('');

    try {
      const scanResult = await scanMedicineImage(asset);

      if (scanResult.success && scanResult.medicine) {
        setMedicineResult(scanResult.medicine);
        setSearchQuery(scanResult.searchTerm || scanResult.medicine.name);
        setNotFoundTerm('');
        setInfoNotice('');
      } else if (scanResult.candidate) {
        setMedicineResult(null);
        setSearchQuery(scanResult.candidate);
        setNotFoundTerm(scanResult.candidate);
        setInfoNotice('');
      } else {
        setMedicineResult(null);
        setInfoNotice('');
        Alert.alert(
          'दवा नहीं पहचानी जा सकी',
          'फोटो में दवा का नाम स्पष्ट नहीं दिखा। कृपया अच्छी रोशनी में दोबारा फोटो खींचें या नाम टाइप करके खोजें।'
        );
      }
    } catch (_err) {
      setMedicineResult(null);
      setInfoNotice('');
      Alert.alert('त्रुटि', 'दवा स्कैन करने में समस्या आई। कृपया इंटरनेट कनेक्शन जांचें।');
    } finally {
      setLoading(false);
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
            'कैमरा अनुमति आवश्यक है',
            'दवा के पत्ते की फोटो खींचने के लिए कृपया कैमरा एक्सेस की अनुमति दें।'
          );
          return;
        }
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.6,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        await processSelectedImage(result.assets[0]);
      }
    } catch (_e) {
      Alert.alert('त्रुटि', 'कैमरा शुरू करने में समस्या आई।');
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
            'गैलरी अनुमति आवश्यक है',
            'दवा की फोटो चुनने के लिए कृपया फोटो गैलरी की अनुमति दें।'
          );
          return;
        }
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        ...(Platform.OS !== 'web' && { allowsEditing: true }),
        quality: 0.6,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        await processSelectedImage(result.assets[0]);
      }
    } catch (_e) {
      Alert.alert('त्रुटि', 'फोटो गैलरी खोलने में समस्या आई।');
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <ScreenHeader
        title="दवाई जानकारी"
        subtitle="उपयोग, साइड इफेक्ट्स व सुरक्षा"
        icon="pill"
        theme="teal"
        onBack={onBack}
        onReset={() => {
          setMedicineResult(null);
          setNotFoundTerm('');
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
        {/* Unified Search Bar */}
        <View style={[styles.searchBarWrapper, isListening && styles.searchBarListening]}>
          <Ionicons name="search" size={20} color="#2DD4BF" style={styles.searchIcon} />

          <TextInput
            style={styles.searchInput}
            placeholder="दवा का नाम लिखें..."
            placeholderTextColor="#64748B"
            value={searchQuery}
            onChangeText={(txt) => setSearchQuery(txt)}
            onSubmitEditing={() => executeSearch()}
            returnKeyType="search"
            autoCapitalize="words"
            autoCorrect={false}
          />

          {loading && !capturedImage && (
            <ActivityIndicator size="small" color="#2DD4BF" style={{ marginRight: 6 }} />
          )}

          {/* Clear text button */}
          {Boolean(searchQuery) && (
            <TouchableOpacity
              onPress={() => {
                setSearchQuery('');
                setMedicineResult(null);
                setNotFoundTerm('');
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
            <Text style={styles.searchSubmitBtnText}>खोजें</Text>
          </TouchableOpacity>
        </View>

        {/* Live Speech Recognition / Status Notice (Voice Search only) */}
        {isListening && Boolean(infoNotice) && (
          <View style={styles.voiceStatusPill}>
            <Ionicons
              name="radio-button-on"
              size={14}
              color="#EF4444"
              style={{ marginRight: 6 }}
            />
            <Text style={styles.voiceStatusText}>{infoNotice}</Text>
          </View>
        )}

        {/* Captured Image Preview in Small Card Box with Skeleton Loader */}
        {capturedImage && (
          <View style={styles.imageCardContainer}>
            <View style={styles.smallImageCardBox}>
              <Image
                source={{ uri: capturedImage }}
                style={styles.smallCardImage}
                resizeMode="cover"
              />
              {loading && (
                <Animated.View
                  style={[
                    styles.skeletonImageOverlay,
                    { opacity: skeletonOpacity },
                  ]}
                >
                  <LinearGradient
                    colors={[
                      'rgba(45, 212, 191, 0.1)',
                      'rgba(45, 212, 191, 0.55)',
                      'rgba(45, 212, 191, 0.1)',
                    ]}
                    style={StyleSheet.absoluteFillObject}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  />
                  <View style={styles.scannerBeam} />
                </Animated.View>
              )}
              {/* Dismiss / Remove Image Button */}
              <TouchableOpacity
                onPress={() => {
                  setCapturedImage(null);
                  setInfoNotice('');
                }}
                style={styles.cardCloseBtn}
                activeOpacity={0.7}
              >
                <Ionicons name="close-circle" size={22} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* DYNAMIC RESULT: USER-SEARCHED MEDICINE DETAILS */}
        {medicineResult ? (
          <View style={styles.detailContainer}>
            {/* Intro Summary Card */}
            <LinearGradient
              colors={['#0F242A', '#0B1C22', '#07151A']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.medHeroCard}
            >
              <View style={styles.medHeroHeader}>
                {/* EXACT NAME SEARCHED BY USER */}
                <Text style={styles.medHeroTitle}>{medicineResult.name}</Text>

                {/* Intro Summary Sentence */}
                <Text style={styles.introSummaryText}>{medicineResult.intro_hi}</Text>
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
                <Text style={styles.sectionTitle}>मुख्य उपयोग (Uses)</Text>
              </View>

              <Text style={styles.usesIntroText}>{medicineResult.usesIntro_hi}</Text>

              <View style={styles.bulletsWrap}>
                {medicineResult.uses_hi?.map((useItem, idx) => (
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
                      ) : typeof useItem === 'object' ? (
                        useItem.desc
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
                    {`आप इस दवा के बारे में अधिक जानकारी Tata 1mg पर ${medicineResult.name} के माध्यम से देख सकते हैं।`}
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
                <Text style={styles.sectionTitle}>सामान्य दुष्प्रभाव (Side Effects)</Text>
              </View>

              <View style={styles.bulletsWrap}>
                {medicineResult.sideEffects_hi?.map((sideItem, idx) => (
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
                <Text style={styles.sectionTitle}>सावधानी और चेतावनी</Text>
              </View>

              <View style={styles.bulletsWrap}>
                {medicineResult.warnings_hi?.map((wItem, idx) => (
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
                अस्वीकरण (Disclaimer): यह जानकारी केवल सामान्य जागरूकता और शैक्षिक उद्देश्य के लिए है। किसी भी दवा का सेवन या खुराक बदलने से पहले हमेशा योग्य डॉक्टर या फार्मासिस्ट से परामर्श अवश्य लें।
              </Text>
            </View>
          </View>
        ) : loading ? (
          /* SKELETON LOADER UI WHILE SEARCHING / SCANNING */
          <Animated.View style={[styles.skeletonContainer, { opacity: skeletonOpacity }]}>
            {/* Skeleton Medicine Intro Card */}
            <View style={styles.skeletonHeroCard}>
              <View style={styles.skeletonTitleBar} />
              <View style={styles.skeletonSubBarLong} />
              <View style={styles.skeletonSubBarShort} />
            </View>

            {/* Skeleton Section 1 (Uses) */}
            <View style={styles.skeletonSectionCard}>
              <View style={styles.skeletonSectionHeader}>
                <View style={styles.skeletonIconBox} />
                <View style={styles.skeletonSectionTitleBar} />
              </View>
              <View style={styles.skeletonBulletLineFull} />
              <View style={styles.skeletonBulletLineMedium} />
              <View style={styles.skeletonBulletLineShort} />
            </View>

            {/* Skeleton Section 2 (Side Effects & Safety) */}
            <View style={styles.skeletonSectionCard}>
              <View style={styles.skeletonSectionHeader}>
                <View style={styles.skeletonIconBox} />
                <View style={styles.skeletonSectionTitleBar} />
              </View>
              <View style={styles.skeletonBulletLineFull} />
              <View style={styles.skeletonBulletLineMedium} />
            </View>
          </Animated.View>
        ) : notFoundTerm ? (
          /* LIVE SEARCH RETURNED NO MATCH */
          <View style={styles.welcomeContainer}>
            <View style={styles.welcomeIconCircle}>
              <Ionicons name="search-outline" size={38} color="#F59E0B" />
            </View>
            <Text style={styles.welcomeTitle}>
              {`"${notFoundTerm}" की लाइव जानकारी नहीं मिली`}
            </Text>
            <Text style={styles.welcomeSub}>
              कृपया दवा का सही नाम लिखकर दोबारा खोजें या अपना इंटरनेट कनेक्शन जांचें।
            </Text>
            <TouchableOpacity
              style={styles.oneMgLinkBox}
              onPress={() =>
                Linking.openURL(
                  `https://www.1mg.com/search/all?name=${encodeURIComponent(notFoundTerm)}`
                )
              }
              activeOpacity={0.8}
            >
              <Ionicons name="open-outline" size={16} color="#38BDF8" />
              <Text style={styles.oneMgLinkText}>
                {`Tata 1mg पर "${notFoundTerm}" खोजें`}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* CLEAN WELCOME SCREEN (NO STATIC DATA OR CHIPS) */
          <View style={styles.welcomeContainer}>
            <View style={styles.welcomeIconCircle}>
              <MaterialCommunityIcons name="pill" size={42} color="#2DD4BF" />
            </View>

            <Text style={styles.welcomeTitle}>किसी भी दवा की सही जानकारी पाएं</Text>

            <Text style={styles.welcomeSub}>
              ऊपर सर्च बार में दवा का नाम लिखें, बोलकर 🎙️ सर्च करें, या कैमरे 📷 से फोटो अपलोड करें।
            </Text>
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
              <Text style={styles.mediaPickerTitle}>दवा की फोटो चुनें</Text>
              <TouchableOpacity onPress={() => setShowMediaModal(false)}>
                <Ionicons name="close" size={22} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <Text style={styles.mediaPickerSub}>
              दवा के पत्ते या रैपर की फोटो लें, ऐप अपने आप दवा का नाम पहचानकर जानकारी दिखाएगा।
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
                  <Text style={styles.mediaOptionTitle}>कैमरा से खींचें</Text>
                  <Text style={styles.mediaOptionDesc}>ऑटो AI स्कैन</Text>
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
                  <Text style={styles.mediaOptionTitle}>गैलरी से चुनें</Text>
                  <Text style={styles.mediaOptionDesc}>फोटो से स्कैन</Text>
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
    width: '100%',
    maxWidth: 680,
    alignSelf: 'center',
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

  /* Image Card Box with Skeleton Loader */
  imageCardContainer: {
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  smallImageCardBox: {
    width: '100%',
    height: '200',
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#0F242A',
    shadowColor: '#2DD4BF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 4,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  smallCardImage: {
    width: '100%',
    height: '100%',
  },
  skeletonImageOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scannerBeam: {
    width: '100%',
    height: 3,
    backgroundColor: '#2DD4BF',
    shadowColor: '#2DD4BF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 5,
    elevation: 5,
  },
  cardCloseBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    borderRadius: 12,
    zIndex: 10,
  },

  /* Skeleton Loading State */
  skeletonContainer: {
    paddingTop: 4,
    gap: 14,
    marginBottom: 20,
  },
  skeletonHeroCard: {
    backgroundColor: '#0F242A',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(45, 212, 191, 0.22)',
    gap: 10,
  },
  skeletonTitleBar: {
    width: '45%',
    height: 22,
    borderRadius: 6,
    backgroundColor: 'rgba(45, 212, 191, 0.25)',
  },
  skeletonSubBarLong: {
    width: '92%',
    height: 14,
    borderRadius: 4,
    backgroundColor: 'rgba(148, 163, 184, 0.16)',
    marginTop: 4,
  },
  skeletonSubBarShort: {
    width: '65%',
    height: 14,
    borderRadius: 4,
    backgroundColor: 'rgba(148, 163, 184, 0.16)',
  },
  skeletonSectionCard: {
    backgroundColor: '#0F242A',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(45, 212, 191, 0.15)',
    gap: 10,
  },
  skeletonSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
  },
  skeletonIconBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: 'rgba(45, 212, 191, 0.22)',
  },
  skeletonSectionTitleBar: {
    width: '38%',
    height: 18,
    borderRadius: 5,
    backgroundColor: 'rgba(45, 212, 191, 0.28)',
  },
  skeletonBulletLineFull: {
    width: '100%',
    height: 12,
    borderRadius: 4,
    backgroundColor: 'rgba(148, 163, 184, 0.14)',
  },
  skeletonBulletLineMedium: {
    width: '82%',
    height: 12,
    borderRadius: 4,
    backgroundColor: 'rgba(148, 163, 184, 0.14)',
  },
  skeletonBulletLineShort: {
    width: '58%',
    height: 12,
    borderRadius: 4,
    backgroundColor: 'rgba(148, 163, 184, 0.14)',
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
