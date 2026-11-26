import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Animated,
  Easing,
  ActivityIndicator,
  Share,
  Modal,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import Svg, {
  Path,
  Circle,
  Defs,
  LinearGradient as SvgLinearGradient,
  Stop,
} from 'react-native-svg';
import { MaterialCommunityIcons, Ionicons, FontAwesome5 } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CrossingTrainAlert from '../components/CrossingTrainAlert';
import {
  DYNAMIC_CATEGORIES,
  searchTrainsOnlineOrOffline,
  searchStationsOnline,
  fetchTrainsBetween,
  formatJourneyDuration,
  fetchDynamicTrendingTrains,
  fetchLiveTrainStatus,
  findCrossingTrains,
  getISTDateString,
  getISTDateLabel,
} from '../lib/trainData';

const RECENT_SEARCHES_KEY = '@recent_train_searches_dynamic_v3';
const LANG_STORAGE_KEY = '@train_app_preferred_lang_v1';
const THEME_STORAGE_KEY = '@train_app_theme_v1';

// =========================================================================
// DESIGN TOKENS — "Midnight Indigo & Emerald Rail Command"
// =========================================================================
const THEMES = {
  dark: {
    mode: 'dark',
    bgGradient: ['#070B14', '#0B0F19', '#111827'],
    bgTop: '#070B14',
    glass: 'rgba(19, 28, 46, 0.72)',
    glassStrong: 'rgba(13, 20, 34, 0.97)',
    glassSoft: 'rgba(148, 163, 184, 0.08)',
    inputBg: 'rgba(2, 6, 23, 0.55)',
    border: 'rgba(148, 163, 184, 0.16)',
    borderStrong: 'rgba(148, 163, 184, 0.28)',
    text: '#F8FAFC',
    textMuted: '#94A3B8',
    textDim: '#64748B',
    emerald: '#10B981',
    emeraldDeep: '#047857',
    emeraldSoft: 'rgba(16, 185, 129, 0.14)',
    emeraldBorder: 'rgba(16, 185, 129, 0.34)',
    amber: '#F59E0B',
    amberSoft: 'rgba(245, 158, 11, 0.12)',
    amberBorder: 'rgba(245, 158, 11, 0.32)',
    indigo: '#818CF8',
    indigoSoft: 'rgba(99, 102, 241, 0.16)',
    rose: '#FB7185',
    roseSoft: 'rgba(244, 63, 94, 0.13)',
    roseBorder: 'rgba(244, 63, 94, 0.30)',
    onEmerald: '#04140E',
    railTrack: 'rgba(148, 163, 184, 0.22)',
    railDone: 'rgba(16, 185, 129, 0.55)',
    emeraldGlow: 'rgba(16, 185, 129, 0.13)',
    indigoGlow: 'rgba(99, 102, 241, 0.12)',
    hudGradient: ['#122036', '#0A1220'],
    cardGradient: ['rgba(23, 33, 54, 0.92)', 'rgba(13, 20, 34, 0.94)'],
    drawerGradient: ['#111C2E', '#0A0F19'],
    dockGradient: ['rgba(17, 26, 43, 0.97)', 'rgba(10, 16, 28, 0.99)'],
    scrim: 'rgba(2, 6, 23, 0.68)',
    shadow: '#000000',
  },
  light: {
    mode: 'light',
    bgGradient: ['#F8FAFC', '#EEF2FF', '#F1F5F9'],
    bgTop: '#F8FAFC',
    glass: 'rgba(255, 255, 255, 0.86)',
    glassStrong: 'rgba(255, 255, 255, 0.99)',
    glassSoft: 'rgba(15, 23, 42, 0.05)',
    inputBg: 'rgba(255, 255, 255, 0.9)',
    border: 'rgba(15, 23, 42, 0.10)',
    borderStrong: 'rgba(15, 23, 42, 0.18)',
    text: '#0B1220',
    textMuted: '#475569',
    textDim: '#64748B',
    emerald: '#059669',
    emeraldDeep: '#047857',
    emeraldSoft: 'rgba(5, 150, 105, 0.10)',
    emeraldBorder: 'rgba(5, 150, 105, 0.30)',
    amber: '#B45309',
    amberSoft: 'rgba(180, 83, 9, 0.10)',
    amberBorder: 'rgba(180, 83, 9, 0.26)',
    indigo: '#4F46E5',
    indigoSoft: 'rgba(79, 70, 229, 0.10)',
    rose: '#BE123C',
    roseSoft: 'rgba(190, 18, 60, 0.09)',
    roseBorder: 'rgba(190, 18, 60, 0.24)',
    onEmerald: '#FFFFFF',
    railTrack: 'rgba(15, 23, 42, 0.14)',
    railDone: 'rgba(5, 150, 105, 0.45)',
    emeraldGlow: 'rgba(5, 150, 105, 0.10)',
    indigoGlow: 'rgba(79, 70, 229, 0.09)',
    hudGradient: ['#FFFFFF', '#ECFDF5'],
    cardGradient: ['rgba(255, 255, 255, 0.98)', 'rgba(248, 250, 252, 0.98)'],
    drawerGradient: ['#FFFFFF', '#F1F5F9'],
    dockGradient: ['rgba(255, 255, 255, 0.98)', 'rgba(241, 245, 249, 0.99)'],
    scrim: 'rgba(15, 23, 42, 0.42)',
    shadow: '#0F172A',
  },
};

// =========================================================================
// COPY — English default, Hindi switchable
// =========================================================================
const STRINGS = {
  en: {
    appTitle: 'Live Train Tracker',
    appSub: 'Search by train or find trains between two stations',
    spotTitle: 'Spot Any Train',
    spotSub: 'Search by name (e.g. Chitrakoot) or number (e.g. 14123)',
    searchPlaceholder: 'Enter train name or number...',
    categoriesLabel: 'Live Categories',
    quickFilters: 'Quick filters',
    recentSearches: 'Recent Searches',
    clear: 'Clear',
    matchingTrains: 'Matching Trains',
    liveActiveTrains: 'Live Active Trains',
    noTrainFound: 'No Train Found',
    checkQuery: 'Check name or number, or tap below to check direct status:',
    viewDirectStatus: (q) => `Check Live Status for "${q}"`,
    viewStatus: 'View Status',
    tapLive: 'Tap for live telemetry',
    liveCockpit: 'Live cockpit',
    horn: 'HORN',
    onTime: 'On Time',
    arrivalLabel: 'Arrival',
    departureLabel: 'Departure',
    lateBy: (m) => `${m} MIN LATE`,
    earlyBy: (m) => `${m} MIN EARLY`,
    runningFast: 'Full steam ahead — the train is moving on track.',
    runningSub: 'Get ready for the upcoming stations',
    yesterday: 'Yesterday',
    today: 'Today',
    tomorrow: 'Tomorrow',
    majorHalts: (c) => `Major Stops (${c})`,
    allStations: (c) => `All Stations (${c})`,
    showIntermediate: (n) => `View ${n} passing station${n > 1 ? 's' : ''}`,
    hideIntermediate: (n) => `Hide ${n} passing station${n > 1 ? 's' : ''}`,
    coachOrder: 'Coach Layout',
    engine: 'ENGINE',
    trackJourney: 'Railway Track Journey',
    trainIsHere: 'Train is here',
    trainInSection: 'Train in this section',
    demoCockpit: 'Demo telemetry',
    demoBanner:
      'Offline demo — live feed unavailable. Timings, platform, speed and coach shown here are sample data.',
    crossingTrains: (c) => `${c} Trains Crossing Nearby`,
    crossingSub: 'Trains on the opposite track currently in this section',
    syncingTelemetry: 'Syncing live telemetry from train...',
    connectingSignal: 'Connecting live signal...',
    kmMilestone: (km) => `${km} km`,
    sch: 'Sch',
    liveGps: 'LIVE · GPS',
    speedLabel: 'Speed',
    gaugeLabel: 'SPEED',
    platformShort: 'PF',
    minShort: 'min',
    progressStart: 'ORIGIN',
    progressEnd: 'DESTINATION',
    menu: 'Menu',
    drawerTitle: 'Rail Command',
    drawerSubtitle: 'Your live journey console',
    myBookings: 'My Bookings',
    myBookingsSub: 'Recent trains & saved searches',
    timetable: 'Train Schedule & Timetable',
    timetableSub: 'Find trains between any two stations',
    seats: 'Seat Availability & Fare',
    seatsSub: 'Check seats and fare',
    stationBoard: 'Live Station Departure Board',
    stationBoardSub: 'Departures from any station',
    alerts: 'Alerts & Notifications',
    alertsSub: 'Delay and crossing alerts',
    settings: 'Settings & Preferences',
    settingsSub: 'Theme, language and data',
    shareRate: 'Share & Rate Us',
    shareRateSub: 'Tell a friend about the app',
    settingsTitle: 'Preferences',
    themeLabel: 'Appearance',
    lightMode: 'Daylight',
    darkMode: 'Midnight',
    languageLabel: 'Language',
    clearRecents: 'Clear recent searches',
    comingSoon: 'Soon',
    comingSoonNote:
      'Seat availability, station departure boards and notifications are coming in a future update.',
    dockSpot: 'Spot',
    dockRoute: 'Route',
    dockRecent: 'Recent',
    dockShare: 'Share',
    dockMenu: 'Menu',
    backToHome: 'Back to Home',
    shareMessage:
      'Track any train live with Live Train Tracker — spot trains, follow delays, speed and platform info in real time.\n\nShared via Live Train Tracker.',
    close: 'Close',

    // Route (from/to station) search
    modeTrain: 'Train / No.',
    modeRoute: 'From ➔ To',
    routeTitle: 'Find Trains by Route',
    routeSub: 'Pick your boarding and destination station',
    fromLabel: 'From',
    toLabel: 'To',
    fromPlaceholder: 'From station (e.g. NDLS / Delhi)',
    toPlaceholder: 'To station (e.g. BSB / Varanasi)',
    searchTrainsBtn: 'Search Trains',
    swapStations: 'Swap',
    routeResults: (c) => `${c} Trains Found`,
    routeResultsEmpty: 'No direct trains found between these stations.',
    routeHintTitle: 'Plan Your Journey',
    routeHintSub: 'Select a From and To station, then tap Search Trains.',
    loadingTrains: 'Finding trains for your route...',
    routeErrorSame: 'From and To stations cannot be the same.',
    routeErrorSelect: 'Please select both From and To stations.',
    routeErrorNetwork: 'Could not load trains right now. Please try again.',
    routeErrorNotFound: 'Station not found. Please pick a station from the list.',
    haltsBetween: (c) => `${c} halts`,
    stationsLabel: 'Stations',
  },
  hi: {
    appTitle: 'लाइव ट्रेन ट्रैकर',
    appSub: 'ट्रेन से या कहाँ से–कहाँ तक, दोनों तरह से खोजें',
    spotTitle: 'ट्रेन खोजें',
    spotSub: 'ट्रेन का नाम (उदा. चित्रकूट) या नंबर (उदा. 14123) डालें',
    searchPlaceholder: 'ट्रेन का नाम या नंबर डालें...',
    categoriesLabel: 'लाइव श्रेणियां',
    quickFilters: 'क्विक फ़िल्टर',
    recentSearches: 'हाल की खोजें',
    clear: 'हटाएं',
    matchingTrains: 'मिली हुई ट्रेनें',
    liveActiveTrains: 'सक्रिय ट्रेनें',
    noTrainFound: 'कोई ट्रेन नहीं मिली',
    checkQuery: 'नाम या नंबर जांचें, या नीचे से सीधा लाइव स्थिति देखें:',
    viewDirectStatus: (q) => `ट्रेन "${q}" का लाइव स्टेटस देखें`,
    viewStatus: 'स्थिति देखें',
    tapLive: 'लाइव टेलीमेट्री देखें',
    liveCockpit: 'लाइव कॉकपिट',
    horn: 'हॉर्न',
    onTime: 'समय पर',
    arrivalLabel: 'आगमन',
    departureLabel: 'प्रस्थान',
    lateBy: (m) => `${m} मि. देरी`,
    earlyBy: (m) => `${m} मि. पहले`,
    runningFast: 'छुक-छुक! ट्रेन पटरी पर दौड़ रही है।',
    runningSub: 'अगले स्टेशन के लिए तैयार रहें',
    yesterday: 'कल',
    today: 'आज',
    tomorrow: 'कल',
    majorHalts: (c) => `प्रमुख ठहराव (${c})`,
    allStations: (c) => `सभी स्टेशन (${c})`,
    showIntermediate: (n) => `${n} बीच के स्टेशन देखें`,
    hideIntermediate: (n) => `${n} बीच के स्टेशन छिपाएँ`,
    coachOrder: 'कोच क्रम',
    engine: 'इंजन',
    trackJourney: 'रेलवे ट्रैक टाइमलाइन',
    trainIsHere: 'ट्रेन यहाँ है',
    trainInSection: 'ट्रेन इस सेक्शन में है',
    demoCockpit: 'डेमो टेलीमेट्री',
    demoBanner:
      'ऑफ़लाइन डेमो — लाइव फ़ीड उपलब्ध नहीं। यहाँ दिए गए समय, प्लेटफ़ॉर्म, गति और कोच नमूना डेटा हैं।',
    crossingTrains: (c) => `${c} क्रॉसिंग ट्रेनें`,
    crossingSub: 'विपरीत दिशा की ट्रेनें जो इस समय आपके सेक्शन में हैं',
    syncingTelemetry: 'लाइव टेलीमेट्री जोड़ी जा रही है...',
    connectingSignal: 'सिग्नल से संपर्क हो रहा है...',
    kmMilestone: (km) => `${km} किमी`,
    sch: 'निर्धारित',
    liveGps: 'लाइव · जीपीएस',
    speedLabel: 'स्पीड',
    gaugeLabel: 'गति',
    platformShort: 'प्लेटफ़ॉर्म',
    minShort: 'मि',
    progressStart: 'स्टार्ट',
    progressEnd: 'गंतव्य',
    menu: 'मेन्यू',
    drawerTitle: 'रेल कमांड',
    drawerSubtitle: 'आपका लाइव यात्रा कंसोल',
    myBookings: 'मेरी बुकिंग',
    myBookingsSub: 'हाल की ट्रेनें और सेव की गई खोजें',
    timetable: 'ट्रेन शेड्यूल और टाइमटेबल',
    timetableSub: 'किन्हीं दो स्टेशनों के बीच ट्रेनें खोजें',
    seats: 'सीट उपलब्धता और किराया',
    seatsSub: 'सीट और किराया जांचें',
    stationBoard: 'लाइव स्टेशन डिपार्चर बोर्ड',
    stationBoardSub: 'किसी भी स्टेशन से प्रस्थान',
    alerts: 'अलर्ट और नोटिफिकेशन',
    alertsSub: 'देरी और क्रॉसिंग अलर्ट',
    settings: 'सेटिंग्स और प्राथमिकताएं',
    settingsSub: 'थीम, भाषा और डेटा',
    shareRate: 'शेयर करें और रेट करें',
    shareRateSub: 'दोस्तों को ऐप के बारे में बताएं',
    settingsTitle: 'प्राथमिकताएं',
    themeLabel: 'थीम',
    lightMode: 'डेलाइट',
    darkMode: 'मिडनाइट',
    languageLabel: 'भाषा',
    clearRecents: 'हाल की खोजें हटाएं',
    comingSoon: 'जल्द',
    comingSoonNote: 'सीट उपलब्धता, स्टेशन डिपार्चर बोर्ड और नोटिफिकेशन अगले अपडेट में आएंगे।',
    dockSpot: 'खोज',
    dockRoute: 'रूट',
    dockRecent: 'हाल',
    dockShare: 'शेयर',
    dockMenu: 'मेन्यू',
    backToHome: 'होम पर वापस',
    shareMessage:
      'लाइव ट्रेन ट्रैकर से किसी भी ट्रेन को लाइव ट्रैक करें — ट्रेन खोजें, देरी, स्पीड और प्लेटफ़ॉर्म की जानकारी पाएं।\n\nलाइव ट्रेन ट्रैकर द्वारा साझा किया गया।',
    close: 'बंद करें',

    // Route (from/to station) search
    modeTrain: 'ट्रेन / नंबर',
    modeRoute: 'कहाँ से ➔ कहाँ',
    routeTitle: 'रूट से ट्रेन खोजें',
    routeSub: 'कहाँ से चढ़ना है और कहाँ जाना है, स्टेशन चुनें',
    fromLabel: 'कहाँ से',
    toLabel: 'कहाँ जाना है',
    fromPlaceholder: 'कहाँ से (उदा. NDLS / दिल्ली)',
    toPlaceholder: 'कहाँ जाना है (उदा. BSB / वाराणसी)',
    searchTrainsBtn: 'ट्रेनें खोजें',
    swapStations: 'बदलें',
    routeResults: (c) => `${c} ट्रेनें मिलीं`,
    routeResultsEmpty: 'इन स्टेशनों के बीच कोई सीधी ट्रेन नहीं मिली।',
    routeHintTitle: 'अपनी यात्रा चुनें',
    routeHintSub: 'कहाँ से और कहाँ जाना है चुनें, फिर ट्रेनें खोजें दबाएँ।',
    loadingTrains: 'आपके रूट की ट्रेनें खोजी जा रही हैं...',
    routeErrorSame: 'कहाँ से और कहाँ जाना है, एक ही स्टेशन नहीं हो सकता।',
    routeErrorSelect: 'कृपया दोनों स्टेशन चुनें।',
    routeErrorNetwork: 'अभी ट्रेनें लोड नहीं हो सकीं। कृपया फिर कोशिश करें।',
    routeErrorNotFound: 'स्टेशन नहीं मिला। कृपया सूची से स्टेशन चुनें।',
    haltsBetween: (c) => `${c} ठहराव`,
    stationsLabel: 'स्टेशन',
  },
};


// =========================================================================
// STYLE FACTORY — one palette-driven sheet for dark + light
// =========================================================================
function createStyles(c, drawerWidth) {
  const isDark = c.mode === 'dark';
  const cardShadow = {
    shadowColor: c.shadow,
    shadowOpacity: isDark ? 0.38 : 0.07,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: isDark ? 5 : 2,
  };

  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: c.bgTop,
    },
    scroll: {
      flex: 1,
    },
    searchScrollContent: {
      paddingHorizontal: 16,
      paddingTop: 6,
      paddingBottom: 118,
    },
    detailScrollContent: {
      paddingHorizontal: 16,
      paddingTop: 4,
      paddingBottom: 32,
    },
    ambientLayer: {
      ...StyleSheet.absoluteFillObject,
      overflow: 'hidden',
    },
    ambientBlob: {
      position: 'absolute',
      width: 280,
      height: 280,
      borderRadius: 140,
      backgroundColor: c.emeraldGlow,
    },
    ambientBlobA: {
      top: -120,
      right: -100,
    },
    ambientBlobSmall: {
      position: 'absolute',
      width: 220,
      height: 220,
      borderRadius: 110,
      backgroundColor: c.indigoGlow,
    },
    ambientBlobB: {
      bottom: 30,
      left: -110,
    },

    // HEADER ------------------------------------------------------------
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingTop: 6,
      paddingBottom: 8,
      gap: 8,
    },
    headerIconBtn: {
      width: 38,
      height: 38,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.glass,
      borderWidth: 1,
      borderColor: c.border,
    },
    headerTitleWrap: {
      flex: 1,
      marginLeft: 2,
    },
    headerTitle: {
      fontSize: 15.5,
      fontWeight: '800',
      color: c.text,
      letterSpacing: 0.2,
    },
    headerStatusRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 3,
    },
    headerLiveDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: c.emerald,
      marginRight: 5,
    },
    headerStatusText: {
      fontSize: 9,
      fontWeight: '800',
      color: c.emerald,
      letterSpacing: 1.1,
    },
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },

    langPill: {
      flexDirection: 'row',
      backgroundColor: c.inputBg,
      borderRadius: 10,
      padding: 2,
      borderWidth: 1,
      borderColor: c.border,
    },
    langBtn: {
      paddingHorizontal: 7,
      paddingVertical: 5,
      borderRadius: 8,
    },
    langBtnActive: {
      backgroundColor: c.emerald,
    },
    langText: {
      fontSize: 9,
      fontWeight: '800',
      color: c.textDim,
      letterSpacing: 0.5,
    },
    langTextActive: {
      color: c.onEmerald,
    },

    // HERO SEARCH CARD --------------------------------------------------
    heroCard: {
      borderRadius: 22,
      backgroundColor: c.glass,
      borderWidth: 1,
      borderColor: c.border,
      padding: 16,
      marginTop: 4,
      overflow: 'hidden',
      ...cardShadow,
    },
    heroGlow: {
      position: 'absolute',
      width: 190,
      height: 190,
      borderRadius: 95,
      backgroundColor: c.emeraldGlow,
      top: -100,
      right: -70,
    },
    heroTop: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 14,
    },
    heroIconBadge: {
      width: 42,
      height: 42,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
    },
    heroTitleWrap: {
      flex: 1,
      marginLeft: 12,
    },
    heroTitle: {
      fontSize: 19,
      fontWeight: '800',
      color: c.text,
      letterSpacing: -0.3,
    },
    heroSubtitle: {
      fontSize: 11.5,
      color: c.textMuted,
      marginTop: 2,
      lineHeight: 16,
    },
    segment: {
      flexDirection: 'row',
      backgroundColor: c.inputBg,
      borderRadius: 14,
      padding: 4,
      borderWidth: 1,
      borderColor: c.border,
      marginBottom: 14,
    },
    segmentBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 9,
      borderRadius: 11,
    },
    segmentBtnActive: {
      backgroundColor: c.emerald,
    },
    segmentText: {
      fontSize: 11.5,
      fontWeight: '700',
      color: c.textMuted,
    },
    segmentTextActive: {
      color: c.onEmerald,
      fontWeight: '800',
    },

    inputShell: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: c.inputBg,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: c.border,
      paddingLeft: 12,
      paddingRight: 5,
      minHeight: 52,
    },
    input: {
      flex: 1,
      color: c.text,
      fontSize: 14,
      fontWeight: '600',
      paddingVertical: 12,
      paddingHorizontal: 8,
    },
    inputClear: {
      padding: 6,
    },
    inputSubmit: {
      width: 40,
      height: 40,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },

    filterLabelRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 16,
      marginBottom: 8,
    },
    filterLabel: {
      fontSize: 9.5,
      fontWeight: '800',
      letterSpacing: 1.2,
      color: c.textDim,
      textTransform: 'uppercase',
    },
    chipRow: {
      gap: 8,
      paddingRight: 8,
      paddingBottom: 2,
    },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: c.glassSoft,
      borderWidth: 1,
      borderColor: c.border,
    },
    chipActive: {
      backgroundColor: c.emerald,
      borderColor: c.emerald,
    },
    chipText: {
      fontSize: 11,
      fontWeight: '700',
      color: c.textMuted,
    },
    chipTextActive: {
      color: c.onEmerald,
    },

    // ROUTE FORM --------------------------------------------------------
    routeFieldRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: c.inputBg,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: c.border,
      paddingHorizontal: 12,
      paddingVertical: 8,
      minHeight: 58,
    },
    routeFieldActive: {
      borderColor: c.emerald,
      backgroundColor: c.emeraldSoft,
    },
    routeFieldDotWrap: {
      width: 22,
      alignItems: 'center',
    },
    routeDotFrom: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: c.emerald,
    },
    routeDotTo: {
      width: 10,
      height: 10,
      borderRadius: 3,
      backgroundColor: c.amber,
    },
    routeFieldBody: {
      flex: 1,
    },
    routeFieldLabel: {
      fontSize: 8.5,
      fontWeight: '800',
      letterSpacing: 1,
      color: c.textDim,
      textTransform: 'uppercase',
    },
    routeFieldInput: {
      color: c.text,
      fontSize: 13,
      fontWeight: '600',
      paddingVertical: 2,
      marginTop: 1,
    },
    swapRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 8,
    },
    swapLine: {
      flex: 1,
      height: 1,
      backgroundColor: c.border,
    },
    swapBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginHorizontal: 10,
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: 20,
      backgroundColor: c.amberSoft,
      borderWidth: 1,
      borderColor: c.amberBorder,
    },
    swapText: {
      fontSize: 10.5,
      fontWeight: '800',
      color: c.amber,
      letterSpacing: 0.3,
    },
    dateRow: {
      flexDirection: 'row',
      gap: 8,
      marginTop: 12,
    },
    dateChip: {
      flex: 1,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.inputBg,
      paddingVertical: 9,
      alignItems: 'center',
    },
    dateChipActive: {
      backgroundColor: c.amberSoft,
      borderColor: c.amber,
    },
    dateChipTitle: {
      fontSize: 11,
      fontWeight: '800',
      color: c.textMuted,
    },
    dateChipTitleActive: {
      color: c.amber,
    },
    dateChipSub: {
      fontSize: 9,
      color: c.textDim,
      marginTop: 2,
    },
    dateChipSubActive: {
      color: c.textMuted,
    },
    primaryBtn: {
      borderRadius: 14,
      paddingVertical: 14,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      marginTop: 14,
    },
    primaryBtnText: {
      fontSize: 13.5,
      fontWeight: '800',
      color: c.onEmerald,
      letterSpacing: 0.3,
    },
    errorBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginTop: 10,
      backgroundColor: c.roseSoft,
      borderRadius: 10,
      padding: 8,
      borderWidth: 1,
      borderColor: c.roseBorder,
    },
    errorText: {
      flex: 1,
      fontSize: 10.5,
      color: c.rose,
      fontWeight: '600',
    },
    demoBanner: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 8,
      backgroundColor: c.amberSoft,
      borderWidth: 1,
      borderColor: c.amberBorder,
      borderRadius: 12,
      padding: 11,
      marginBottom: 12,
    },
    demoBannerText: {
      flex: 1,
      fontSize: 10.5,
      lineHeight: 15,
      fontWeight: '600',
      color: c.amber,
    },
    demoLiveDot: {
      backgroundColor: c.amber,
    },

    stationSuggestions: {
      marginTop: 8,
      backgroundColor: c.glassStrong,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: c.border,
      overflow: 'hidden',
    },
    suggestionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.border,
    },
    suggestionCode: {
      minWidth: 44,
      paddingHorizontal: 6,
      paddingVertical: 3,
      borderRadius: 6,
      backgroundColor: c.emeraldSoft,
      alignItems: 'center',
      marginRight: 10,
    },
    suggestionCodeText: {
      fontSize: 10,
      fontWeight: '800',
      color: c.emerald,
    },
    suggestionName: {
      fontSize: 12.5,
      fontWeight: '700',
      color: c.text,
    },
    suggestionCity: {
      fontSize: 10,
      color: c.textDim,
      marginTop: 1,
    },
    suggestionLoading: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      padding: 12,
    },

    // SECTIONS ----------------------------------------------------------
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 22,
      marginBottom: 10,
    },
    sectionTitleWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    sectionAccent: {
      width: 3,
      height: 14,
      borderRadius: 2,
      backgroundColor: c.emerald,
      marginRight: 8,
    },
    sectionTitle: {
      fontSize: 11.5,
      fontWeight: '800',
      letterSpacing: 0.9,
      color: c.text,
      textTransform: 'uppercase',
    },
    clearText: {
      fontSize: 10.5,
      fontWeight: '800',
      color: c.emerald,
      letterSpacing: 0.3,
    },
    livePill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 20,
      backgroundColor: c.emeraldSoft,
    },
    liveDot: {
      width: 5,
      height: 5,
      borderRadius: 3,
      backgroundColor: c.emerald,
    },
    livePillText: {
      fontSize: 8.5,
      fontWeight: '800',
      color: c.emerald,
      letterSpacing: 0.9,
    },

    // RECENT SEARCHES ---------------------------------------------------
    recentScroll: {
      gap: 10,
      paddingRight: 10,
    },
    recentCard: {
      width: 236,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: c.glass,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: c.border,
      padding: 12,
    },
    recentNumChip: {
      paddingHorizontal: 7,
      paddingVertical: 4,
      borderRadius: 7,
      backgroundColor: c.indigoSoft,
      marginRight: 10,
    },
    recentNumText: {
      fontSize: 10,
      fontWeight: '800',
      color: c.indigo,
    },
    recentBody: {
      flex: 1,
    },
    recentName: {
      fontSize: 12,
      fontWeight: '700',
      color: c.text,
    },
    recentRoute: {
      fontSize: 10,
      color: c.textDim,
      marginTop: 2,
    },

    // TRAIN RESULT CARDS ------------------------------------------------
    trainCard: {
      borderRadius: 18,
      borderWidth: 1,
      borderColor: c.border,
      marginBottom: 10,
      overflow: 'hidden',
      ...cardShadow,
    },
    trainCardInner: {
      padding: 14,
    },
    trainCardTop: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    trainNumChip: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
      backgroundColor: c.emeraldSoft,
      borderWidth: 1,
      borderColor: c.emeraldBorder,
    },
    trainNumText: {
      fontSize: 10.5,
      fontWeight: '800',
      color: c.emerald,
      letterSpacing: 0.3,
    },
    trainName: {
      flex: 1,
      fontSize: 13.5,
      fontWeight: '800',
      color: c.text,
      marginLeft: 10,
    },
    trainPulse: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    trainPulseDot: {
      width: 5,
      height: 5,
      borderRadius: 3,
      backgroundColor: c.emerald,
    },
    trainPulseText: {
      fontSize: 8.5,
      fontWeight: '800',
      color: c.emerald,
      letterSpacing: 0.8,
    },
    trainRouteRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 12,
    },
    trainRouteCode: {
      fontSize: 11,
      fontWeight: '800',
      color: c.textMuted,
      letterSpacing: 0.5,
    },
    trainRouteTrack: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      marginHorizontal: 10,
    },
    trainRouteLine: {
      flex: 1,
      height: 1,
      backgroundColor: c.border,
    },
    trainRouteIcon: {
      marginHorizontal: 6,
    },
    trainCardFooter: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 12,
    },
    trainTypeChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 20,
      backgroundColor: c.glassSoft,
    },
    trainTypeText: {
      fontSize: 9.5,
      fontWeight: '700',
      color: c.textMuted,
    },
    viewStatusBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 20,
      backgroundColor: c.emerald,
    },
    viewStatusText: {
      fontSize: 9.5,
      fontWeight: '800',
      color: c.onEmerald,
      letterSpacing: 0.4,
    },

    // EMPTY / LOADING ---------------------------------------------------
    emptyCard: {
      alignItems: 'center',
      paddingVertical: 30,
      paddingHorizontal: 20,
      backgroundColor: c.glass,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: c.border,
      marginTop: 4,
    },
    emptyEmoji: {
      fontSize: 32,
    },
    emptyTitle: {
      fontSize: 14,
      fontWeight: '800',
      color: c.text,
      marginTop: 8,
    },
    emptySub: {
      fontSize: 11,
      color: c.textMuted,
      textAlign: 'center',
      marginTop: 5,
      lineHeight: 16,
    },
    forceBtn: {
      marginTop: 12,
      paddingHorizontal: 14,
      paddingVertical: 9,
      borderRadius: 20,
      backgroundColor: c.emerald,
    },
    forceBtnText: {
      fontSize: 10.5,
      fontWeight: '800',
      color: c.onEmerald,
    },

    // ROUTE RESULTS -----------------------------------------------------
    routeMetaBar: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: c.glass,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: c.border,
      padding: 10,
      marginBottom: 10,
    },
    routeMetaBadge: {
      paddingHorizontal: 7,
      paddingVertical: 3,
      borderRadius: 6,
      backgroundColor: c.indigoSoft,
    },
    routeMetaCode: {
      fontSize: 10,
      fontWeight: '800',
      color: c.indigo,
    },
    routeMetaNames: {
      flex: 1,
      fontSize: 10,
      color: c.textMuted,
      marginLeft: 8,
    },
    routeCard: {
      backgroundColor: c.glass,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: c.border,
      padding: 13,
      marginBottom: 10,
    },
    routeCardTop: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    routeTrainName: {
      flex: 1,
      fontSize: 12.5,
      fontWeight: '800',
      color: c.text,
      marginLeft: 10,
    },
    routeTimingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 12,
    },
    routeTimeBlock: {
      minWidth: 54,
    },
    routeTimeBlockEnd: {
      alignItems: 'flex-end',
    },
    routeTimeValue: {
      fontSize: 16,
      fontWeight: '800',
      color: c.text,
      letterSpacing: -0.3,
    },
    routeTimeCode: {
      fontSize: 9.5,
      fontWeight: '700',
      color: c.textDim,
      letterSpacing: 0.5,
      marginTop: 1,
    },
    routeTrackWrap: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      marginHorizontal: 10,
    },
    routeTrackLine: {
      flex: 1,
      height: 1,
      backgroundColor: c.border,
    },
    routeInfoRow: {
      flexDirection: 'row',
      gap: 8,
      marginTop: 11,
      flexWrap: 'wrap',
    },
    routeInfoChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 20,
      backgroundColor: c.glassSoft,
    },
    routeInfoText: {
      fontSize: 9.5,
      fontWeight: '600',
      color: c.textMuted,
    },

    // BOTTOM COMMAND BAR ------------------------------------------------
    dockWrap: {
      position: 'absolute',
      left: 12,
      right: 12,
      bottom: 8,
    },
    dockBar: {
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: 20,
      borderWidth: 1,
      borderColor: c.border,
      paddingHorizontal: 4,
      paddingVertical: 5,
      ...cardShadow,
    },
    dockItem: {
      flex: 1,
      alignItems: 'center',
      gap: 3,
      paddingVertical: 7,
      borderRadius: 14,
    },
    dockItemActive: {
      backgroundColor: c.emeraldSoft,
    },
    dockLabel: {
      fontSize: 8.5,
      fontWeight: '700',
      color: c.textDim,
    },
    dockLabelActive: {
      color: c.emerald,
      fontWeight: '800',
    },

    // DETAIL HEADER -----------------------------------------------------
    detailHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingTop: 6,
      paddingBottom: 8,
      gap: 8,
    },
    detailTitleWrap: {
      flex: 1,
    },
    detailTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 7,
    },
    detailNumChip: {
      paddingHorizontal: 7,
      paddingVertical: 2.5,
      borderRadius: 6,
      backgroundColor: c.amberSoft,
      borderWidth: 1,
      borderColor: c.amberBorder,
    },
    detailNumText: {
      fontSize: 9.5,
      fontWeight: '800',
      color: c.amber,
    },
    detailTitle: {
      flex: 1,
      fontSize: 13.5,
      fontWeight: '800',
      color: c.text,
    },
    detailSub: {
      fontSize: 10,
      color: c.textMuted,
      marginTop: 3,
    },

    dateTabs: {
      flexDirection: 'row',
      gap: 8,
      marginTop: 4,
      marginBottom: 12,
    },
    dateTab: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: 8,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.glass,
    },
    dateTabActive: {
      backgroundColor: c.emerald,
      borderColor: c.emerald,
    },
    dateTabTitle: {
      fontSize: 10.5,
      fontWeight: '800',
      color: c.textMuted,
    },
    dateTabTitleActive: {
      color: c.onEmerald,
    },
    dateTabSub: {
      fontSize: 8.5,
      color: c.textDim,
      marginTop: 1,
    },
    dateTabSubActive: {
      color: c.onEmerald,
      opacity: 0.8,
    },

    // LIVE HUD ----------------------------------------------------------
    hudCard: {
      borderRadius: 22,
      borderWidth: 1,
      borderColor: c.border,
      padding: 16,
      overflow: 'hidden',
      ...cardShadow,
    },
    hudTopRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    hudLivePill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 9,
      paddingVertical: 4,
      borderRadius: 20,
      backgroundColor: c.emeraldSoft,
    },
    hudLiveDot: {
      width: 5,
      height: 5,
      borderRadius: 3,
      backgroundColor: c.emerald,
    },
    hudLiveText: {
      fontSize: 8.5,
      fontWeight: '800',
      color: c.emerald,
      letterSpacing: 1,
      textTransform: 'uppercase',
    },
    delayChip: {
      paddingHorizontal: 9,
      paddingVertical: 4,
      borderRadius: 20,
      borderWidth: 1,
    },
    delayOk: {
      backgroundColor: c.emeraldSoft,
      borderColor: c.emeraldBorder,
    },
    delayWarn: {
      backgroundColor: c.amberSoft,
      borderColor: c.amberBorder,
    },
    delayLate: {
      backgroundColor: c.roseSoft,
      borderColor: c.roseBorder,
    },
    delayText: {
      fontSize: 8.5,
      fontWeight: '800',
      letterSpacing: 0.4,
    },
    delayOkText: {
      color: c.emerald,
    },
    delayWarnText: {
      color: c.amber,
    },
    delayLateText: {
      color: c.rose,
    },
    hudMain: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 14,
    },
    speedBlock: {
      flex: 1,
    },
    speedValueRow: {
      flexDirection: 'row',
      alignItems: 'flex-end',
    },
    speedValue: {
      fontSize: 46,
      fontWeight: '800',
      color: c.text,
      letterSpacing: -2,
    },
    speedUnit: {
      fontSize: 12,
      fontWeight: '700',
      color: c.textDim,
      marginLeft: 5,
      marginBottom: 9,
    },
    speedCaption: {
      fontSize: 8.5,
      fontWeight: '800',
      color: c.textDim,
      letterSpacing: 1.3,
      textTransform: 'uppercase',
      marginTop: -2,
    },
    speedTrack: {
      height: 5,
      borderRadius: 3,
      backgroundColor: c.railTrack,
      overflow: 'hidden',
      marginTop: 10,
      width: '92%',
    },
    speedTrackFill: {
      height: 5,
      borderRadius: 3,
      backgroundColor: c.emerald,
    },
    speedStation: {
      fontSize: 9.5,
      color: c.textMuted,
      marginTop: 8,
    },
    gaugeBox: {
      width: 118,
      alignItems: 'center',
      justifyContent: 'center',
    },
    gaugeLabel: {
      fontSize: 7.5,
      fontWeight: '800',
      letterSpacing: 1.1,
      color: c.textDim,
      marginTop: -8,
    },
    hudStatusRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 14,
      backgroundColor: c.glassSoft,
      borderRadius: 14,
      padding: 10,
    },
    hudStatusIcon: {
      width: 28,
      height: 28,
      borderRadius: 9,
      backgroundColor: c.emeraldSoft,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 9,
    },
    hudHeadline: {
      fontSize: 11,
      fontWeight: '800',
      color: c.text,
      lineHeight: 15,
    },
    hudSub: {
      fontSize: 9,
      color: c.textDim,
      marginTop: 2,
    },
    hornBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: 9,
      paddingVertical: 6,
      borderRadius: 20,
      backgroundColor: c.amberSoft,
      borderWidth: 1,
      borderColor: c.amberBorder,
      marginLeft: 8,
    },
    hornText: {
      fontSize: 8,
      fontWeight: '800',
      color: c.amber,
      letterSpacing: 0.5,
    },
    progressWrap: {
      marginTop: 14,
    },
    progressRail: {
      height: 6,
      borderRadius: 3,
      backgroundColor: c.railTrack,
      position: 'relative',
      justifyContent: 'center',
    },
    progressFill: {
      height: 6,
      borderRadius: 3,
      backgroundColor: c.emerald,
    },
    progressTrain: {
      position: 'absolute',
      top: -6,
      width: 18,
      height: 18,
      borderRadius: 9,
      backgroundColor: c.emerald,
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: -9,
    },
    progressLabels: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 6,
    },
    progressLabel: {
      fontSize: 8,
      fontWeight: '700',
      color: c.textDim,
      letterSpacing: 0.6,
    },

    // FILTER + COACH ----------------------------------------------------
    filterRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 14,
      marginBottom: 12,
    },
    filterSegment: {
      flexDirection: 'row',
      backgroundColor: c.inputBg,
      borderRadius: 12,
      padding: 3,
      borderWidth: 1,
      borderColor: c.border,
      flex: 1,
    },
    filterPill: {
      flex: 1,
      paddingVertical: 7,
      alignItems: 'center',
      borderRadius: 9,
    },
    filterPillActive: {
      backgroundColor: c.emerald,
    },
    filterText: {
      fontSize: 9.5,
      fontWeight: '700',
      color: c.textMuted,
    },
    filterTextActive: {
      color: c.onEmerald,
      fontWeight: '800',
    },
    coachChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      marginLeft: 8,
      paddingHorizontal: 10,
      paddingVertical: 7,
      borderRadius: 12,
      backgroundColor: c.amberSoft,
      borderWidth: 1,
      borderColor: c.amberBorder,
    },
    coachChipText: {
      fontSize: 8.5,
      fontWeight: '800',
      color: c.amber,
    },
    coachScroll: {
      gap: 6,
      paddingBottom: 4,
      paddingRight: 6,
    },
    coachLoco: {
      paddingHorizontal: 10,
      paddingVertical: 8,
      borderRadius: 9,
      backgroundColor: c.emeraldSoft,
      borderWidth: 1,
      borderColor: c.emeraldBorder,
      justifyContent: 'center',
    },
    coachLocoText: {
      fontSize: 8.5,
      fontWeight: '800',
      color: c.emerald,
    },
    coachItem: {
      width: 38,
      paddingVertical: 6,
      borderRadius: 8,
      backgroundColor: c.glass,
      borderWidth: 1,
      borderColor: c.border,
      alignItems: 'center',
    },
    coachWindowRow: {
      flexDirection: 'row',
      gap: 3,
      marginBottom: 3,
    },
    coachWindow: {
      width: 4,
      height: 3,
      borderRadius: 1,
      backgroundColor: c.textDim,
    },
    coachItemText: {
      fontSize: 8,
      fontWeight: '800',
      color: c.textMuted,
    },

    // TIMELINE ----------------------------------------------------------
    timelineCard: {
      marginTop: 16,
      backgroundColor: c.glass,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: c.border,
      padding: 14,
    },
    timelineHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 10,
    },
    timelineTitle: {
      fontSize: 10.5,
      fontWeight: '800',
      color: c.text,
      letterSpacing: 0.8,
      textTransform: 'uppercase',
      marginLeft: 7,
    },
    timelineSpacer: {
      flex: 1,
    },
    timelineCredit: {
      fontSize: 8.5,
      fontWeight: '700',
      color: c.textDim,
      marginTop: -4,
      marginBottom: 8,
      letterSpacing: 0.2,
    },
    timelineCount: {
      fontSize: 8.5,
      fontWeight: '800',
      color: c.textDim,
      backgroundColor: c.glassSoft,
      paddingHorizontal: 7,
      paddingVertical: 2,
      borderRadius: 20,
    },
    journeyRow: {
      flexDirection: 'row',
      alignItems: 'stretch',
      marginVertical: 3,
    },
    journeyCard: {
      flex: 1,
      backgroundColor: c.glass,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: c.border,
      borderLeftWidth: 3,
      borderLeftColor: c.amber,
      paddingHorizontal: 12,
      paddingVertical: 10,
      overflow: 'hidden',
    },
    journeyCardCurrent: {
      backgroundColor: c.emeraldSoft,
      borderColor: c.emeraldBorder,
      borderLeftColor: c.emerald,
    },
    journeyCardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8,
    },
    journeyStationName: {
      flexShrink: 1,
      fontSize: 13,
      fontWeight: '800',
      color: c.text,
      lineHeight: 18,
    },
    journeyStationNameMuted: {
      color: c.textMuted,
      fontWeight: '700',
    },
    journeyStationNameCurrent: {
      color: c.emerald,
    },
    journeyHeaderRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 7,
      flexShrink: 0,
    },
    journeyPfBadge: {
      paddingHorizontal: 6,
      paddingVertical: 3,
      borderRadius: 5,
      backgroundColor: c.emerald,
    },
    journeyPfBadgeText: {
      fontSize: 9,
      fontWeight: '800',
      color: c.onEmerald,
      letterSpacing: 0.2,
    },
    journeyStatusText: {
      fontSize: 10,
      fontWeight: '800',
      color: c.emerald,
    },
    journeyStatusLate: {
      color: c.amber,
    },
    journeyDivider: {
      height: 1,
      backgroundColor: c.border,
      marginVertical: 8,
    },
    journeyTimesRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: 12,
    },
    journeyTimeBlock: {
      flexShrink: 1,
    },
    journeyTimeBlockEnd: {
      alignItems: 'flex-end',
    },
    journeyTimeLabel: {
      fontSize: 8.5,
      fontWeight: '800',
      letterSpacing: 1,
      color: c.textDim,
      textTransform: 'uppercase',
    },
    journeyTimeValue: {
      fontSize: 13,
      fontWeight: '800',
      color: c.text,
      marginTop: 3,
      letterSpacing: -0.2,
    },
    journeyTimeValueMuted: {
      color: c.textMuted,
    },
    journeyScheduled: {
      fontSize: 9.5,
      fontWeight: '600',
      color: c.textDim,
      marginTop: 2,
    },
    journeyBadgeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    journeyHereChip: {
      alignSelf: 'flex-start',
      marginTop: 7,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 5,
      backgroundColor: c.emerald,
    },
    journeyHereChipText: {
      fontSize: 8.5,
      fontWeight: '800',
      color: c.onEmerald,
      letterSpacing: 0.3,
    },
    journeyDelayChip: {
      alignSelf: 'flex-start',
      marginTop: 7,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 5,
      backgroundColor: c.roseSoft,
    },
    journeyDelayChipText: {
      fontSize: 8.5,
      fontWeight: '800',
      color: c.rose,
    },
    journeyCardTouch: {
      flex: 1,
    },
    journeyExpandRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderTopWidth: 1,
      borderTopColor: c.border,
      marginTop: 8,
      paddingTop: 7,
    },
    journeyExpandText: {
      fontSize: 9.5,
      fontWeight: '800',
      color: c.emerald,
      letterSpacing: 0.6,
      textTransform: 'uppercase',
    },
    stationRailCol: {
      width: 26,
      alignItems: 'center',
    },
    stationRailSegment: {
      width: 2,
      flex: 1,
      backgroundColor: c.railTrack,
    },
    stationRailHidden: {
      backgroundColor: 'transparent',
    },
    stationRailDone: {
      backgroundColor: c.railDone,
    },
    stationNode: {
      width: 16,
      height: 16,
      borderRadius: 8,
      borderWidth: 2,
      borderColor: c.railTrack,
      backgroundColor: c.bgTop,
      alignItems: 'center',
      justifyContent: 'center',
      marginVertical: 2,
    },
    stationNodeDone: {
      backgroundColor: c.emerald,
      borderColor: c.emerald,
    },
    stationNodeCurrent: {
      backgroundColor: c.emerald,
      borderColor: c.emerald,
    },
    stationNodeCore: {
      width: 4,
      height: 4,
      borderRadius: 2,
      backgroundColor: c.textDim,
    },
    stationNodePulse: {
      position: 'absolute',
      width: 16,
      height: 16,
      borderRadius: 8,
      backgroundColor: c.emerald,
      opacity: 0.32,
    },

    liveLoading: {
      alignItems: 'center',
      paddingVertical: 40,
      backgroundColor: c.glass,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: c.border,
    },
    liveLoadingTitle: {
      fontSize: 13,
      fontWeight: '800',
      color: c.text,
      marginTop: 8,
    },
    liveLoadingSub: {
      fontSize: 10.5,
      color: c.textMuted,
      marginTop: 4,
    },

    crossingsWrap: {
      marginTop: 16,
    },
    crossingsHeader: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    crossingsTitle: {
      fontSize: 12,
      fontWeight: '800',
      color: c.rose,
      marginLeft: 7,
    },
    crossingsSub: {
      fontSize: 10,
      color: c.textDim,
      marginTop: 4,
      marginBottom: 8,
    },
    crossingsList: {
      marginHorizontal: -16,
    },

    // DRAWER ------------------------------------------------------------
    drawerRoot: {
      flex: 1,
      flexDirection: 'row',
    },
    drawerScrim: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: c.scrim,
    },
    drawerPanel: {
      width: drawerWidth,
      height: '100%',
      backgroundColor: c.bgTop,
      borderTopRightRadius: 24,
      borderBottomRightRadius: 24,
      overflow: 'hidden',
      paddingTop: Platform.OS === 'android' ? 42 : 58,
      paddingBottom: 22,
    },
    drawerHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 18,
      paddingBottom: 16,
    },
    drawerBrandIcon: {
      width: 42,
      height: 42,
      borderRadius: 13,
      alignItems: 'center',
      justifyContent: 'center',
    },
    drawerBrandTextWrap: {
      flex: 1,
      marginLeft: 11,
    },
    drawerBrandTitle: {
      fontSize: 15,
      fontWeight: '800',
      color: c.text,
      letterSpacing: -0.2,
    },
    drawerBrandSub: {
      fontSize: 9.5,
      color: c.textDim,
      marginTop: 2,
    },
    drawerCloseBtn: {
      width: 32,
      height: 32,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.glassSoft,
    },
    drawerScroll: {
      paddingHorizontal: 14,
    },
    drawerItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 11,
      paddingHorizontal: 10,
      borderRadius: 13,
      marginBottom: 4,
    },
    drawerItemIcon: {
      width: 34,
      height: 34,
      borderRadius: 10,
      backgroundColor: c.glassSoft,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 11,
    },
    drawerItemBody: {
      flex: 1,
    },
    drawerItemLabel: {
      fontSize: 12.5,
      fontWeight: '700',
      color: c.text,
    },
    drawerItemSub: {
      fontSize: 9.5,
      color: c.textDim,
      marginTop: 2,
    },
    drawerSoonChip: {
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 5,
      backgroundColor: c.amberSoft,
    },
    drawerSoonText: {
      fontSize: 7.5,
      fontWeight: '800',
      color: c.amber,
      letterSpacing: 0.5,
    },
    drawerNote: {
      flexDirection: 'row',
      marginHorizontal: 14,
      marginBottom: 10,
      padding: 10,
      borderRadius: 10,
      backgroundColor: c.amberSoft,
      borderWidth: 1,
      borderColor: c.amberBorder,
    },
    drawerNoteText: {
      flex: 1,
      fontSize: 10,
      color: c.textMuted,
      marginLeft: 7,
      lineHeight: 14,
    },
    drawerDivider: {
      height: 1,
      backgroundColor: c.border,
      marginVertical: 10,
      marginHorizontal: 14,
    },
    drawerSectionLabel: {
      fontSize: 8.5,
      fontWeight: '800',
      letterSpacing: 1.3,
      color: c.textDim,
      textTransform: 'uppercase',
      marginHorizontal: 18,
      marginBottom: 8,
    },
    drawerFooter: {
      marginTop: 'auto',
      paddingHorizontal: 18,
      paddingTop: 12,
    },
    drawerHomeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 7,
      paddingVertical: 11,
      borderRadius: 11,
      backgroundColor: c.glassSoft,
      borderWidth: 1,
      borderColor: c.border,
      marginBottom: 10,
    },
    drawerHomeText: {
      fontSize: 10.5,
      fontWeight: '800',
      color: c.textMuted,
    },
    drawerFooterText: {
      fontSize: 9,
      color: c.textDim,
      textAlign: 'center',
    },
    settingsGroup: {
      paddingHorizontal: 14,
      marginBottom: 14,
    },
    settingsCard: {
      backgroundColor: c.glassSoft,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: c.border,
      padding: 12,
    },
    settingsLabel: {
      fontSize: 9,
      fontWeight: '800',
      letterSpacing: 1,
      color: c.textDim,
      textTransform: 'uppercase',
      marginBottom: 8,
    },
    themeChoiceRow: {
      flexDirection: 'row',
      gap: 8,
    },
    themeChoice: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 10,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: c.border,
    },
    themeChoiceActive: {
      backgroundColor: c.emeraldSoft,
      borderColor: c.emerald,
    },
    themeChoiceText: {
      fontSize: 10.5,
      fontWeight: '700',
      color: c.textMuted,
    },
    themeChoiceTextActive: {
      color: c.emerald,
      fontWeight: '800',
    },
    settingsActionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 7,
      paddingVertical: 11,
      borderRadius: 11,
      borderWidth: 1,
      borderColor: c.roseBorder,
      backgroundColor: c.roseSoft,
      marginTop: 10,
    },
    settingsActionText: {
      fontSize: 10.5,
      fontWeight: '800',
      color: c.rose,
    },
  });
}


// =========================================================================
// LANGUAGE TOGGLE
// =========================================================================
function LanguageToggle({ lang, onToggle, styles, c }) {
  return (
    <View style={styles.langPill}>
      <TouchableOpacity
        style={[styles.langBtn, lang === 'en' && styles.langBtnActive]}
        onPress={() => onToggle('en')}
        activeOpacity={0.8}
      >
        <Text style={[styles.langText, lang === 'en' && styles.langTextActive]}>ENG</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.langBtn, lang === 'hi' && styles.langBtnActive]}
        onPress={() => onToggle('hi')}
        activeOpacity={0.8}
      >
        <Text style={[styles.langText, lang === 'hi' && styles.langTextActive]}>HI</Text>
      </TouchableOpacity>
    </View>
  );
}

// =========================================================================
// GLASS HEADER — menu, brand, live network badge, theme + language
// =========================================================================
function AppHeader({
  t,
  styles,
  c,
  lang,
  onToggleLang,
  themeMode,
  onToggleTheme,
  onOpenMenu,
  pulseAnim,
}) {
  return (
    <View style={styles.header}>
      <TouchableOpacity style={styles.headerIconBtn} onPress={onOpenMenu} activeOpacity={0.8}>
        <Ionicons name="menu" size={22} color={c.text} />
      </TouchableOpacity>

      <View style={styles.headerTitleWrap}>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {t.appTitle}
        </Text>
        <View style={styles.headerStatusRow}>
          <Animated.View
            style={[styles.headerLiveDot, { transform: [{ scale: pulseAnim }] }]}
          />
          <Text style={styles.headerStatusText}>{t.liveGps}</Text>
        </View>
      </View>

      <View style={styles.headerActions}>
        <TouchableOpacity style={styles.headerIconBtn} onPress={onToggleTheme} activeOpacity={0.8}>
          <Ionicons
            name={themeMode === 'dark' ? 'sunny-outline' : 'moon-outline'}
            size={19}
            color={c.amber}
          />
        </TouchableOpacity>
        <LanguageToggle lang={lang} onToggle={onToggleLang} styles={styles} c={c} />
      </View>
    </View>
  );
}

// =========================================================================
// SLIDING COMMAND DRAWER
// =========================================================================
function CommandDrawer({
  visible,
  onClose,
  panel,
  setPanel,
  note,
  onSelect,
  onClearRecents,
  onBackHome,
  styles,
  c,
  t,
  lang,
  onToggleLang,
  themeMode,
  onToggleTheme,
}) {
  const [slide] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (!visible) return;
    slide.setValue(0);
    Animated.timing(slide, {
      toValue: 1,
      duration: 260,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [visible, slide]);

  const items = [
    { id: 'bookings', icon: 'ticket-confirmation-outline', label: t.myBookings, sub: t.myBookingsSub },
    { id: 'timetable', icon: 'timetable', label: t.timetable, sub: t.timetableSub },
    { id: 'seats', icon: 'seat-passenger', label: t.seats, sub: t.seatsSub, soon: true },
    { id: 'board', icon: 'clipboard-list-outline', label: t.stationBoard, sub: t.stationBoardSub, soon: true },
    { id: 'alerts', icon: 'bell-outline', label: t.alerts, sub: t.alertsSub, soon: true },
    { id: 'settings', icon: 'cog-outline', label: t.settings, sub: t.settingsSub },
    { id: 'share', icon: 'share-variant-outline', label: t.shareRate, sub: t.shareRateSub },
  ];

  // Panel is at most 330px wide, so -340 fully hides it before sliding in.
  const translateX = slide.interpolate({ inputRange: [0, 1], outputRange: [-340, 0] });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.drawerRoot}>
        <TouchableOpacity style={styles.drawerScrim} activeOpacity={1} onPress={onClose} />

        <Animated.View style={[styles.drawerPanel, { transform: [{ translateX }] }]}>
          <LinearGradient colors={c.drawerGradient} style={StyleSheet.absoluteFill} />

          <View style={styles.drawerHeader}>
            <LinearGradient
              colors={[c.emerald, c.emeraldDeep]}
              style={styles.drawerBrandIcon}
            >
              <MaterialCommunityIcons name="train-car" size={21} color={c.onEmerald} />
            </LinearGradient>
            <View style={styles.drawerBrandTextWrap}>
              <Text style={styles.drawerBrandTitle}>
                {panel === 'settings' ? t.settingsTitle : t.drawerTitle}
              </Text>
              <Text style={styles.drawerBrandSub}>{t.drawerSubtitle}</Text>
            </View>
            <TouchableOpacity style={styles.drawerCloseBtn} onPress={onClose} activeOpacity={0.8}>
              <Ionicons name="close" size={18} color={c.textMuted} />
            </TouchableOpacity>
          </View>

          {!!note && (
            <View style={styles.drawerNote}>
              <Ionicons name="information-circle-outline" size={14} color={c.amber} />
              <Text style={styles.drawerNoteText}>{note}</Text>
            </View>
          )}

          <ScrollView
            style={styles.drawerScroll}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 16 }}
          >
            {panel === 'settings' ? (
              <>
                <View style={styles.settingsGroup}>
                  <View style={styles.settingsCard}>
                    <Text style={styles.settingsLabel}>{t.themeLabel}</Text>
                    <View style={styles.themeChoiceRow}>
                      <TouchableOpacity
                        style={[
                          styles.themeChoice,
                          themeMode === 'dark' && styles.themeChoiceActive,
                        ]}
                        onPress={() => onToggleTheme('dark')}
                        activeOpacity={0.85}
                      >
                        <Ionicons
                          name="moon-outline"
                          size={15}
                          color={themeMode === 'dark' ? c.emerald : c.textMuted}
                        />
                        <Text
                          style={[
                            styles.themeChoiceText,
                            themeMode === 'dark' && styles.themeChoiceTextActive,
                          ]}
                        >
                          {t.darkMode}
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[
                          styles.themeChoice,
                          themeMode === 'light' && styles.themeChoiceActive,
                        ]}
                        onPress={() => onToggleTheme('light')}
                        activeOpacity={0.85}
                      >
                        <Ionicons
                          name="sunny-outline"
                          size={15}
                          color={themeMode === 'light' ? c.emerald : c.textMuted}
                        />
                        <Text
                          style={[
                            styles.themeChoiceText,
                            themeMode === 'light' && styles.themeChoiceTextActive,
                          ]}
                        >
                          {t.lightMode}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>

                <View style={styles.settingsGroup}>
                  <View style={styles.settingsCard}>
                    <Text style={styles.settingsLabel}>{t.languageLabel}</Text>
                    <View style={styles.themeChoiceRow}>
                      <TouchableOpacity
                        style={[styles.themeChoice, lang === 'en' && styles.themeChoiceActive]}
                        onPress={() => onToggleLang('en')}
                        activeOpacity={0.85}
                      >
                        <Text
                          style={[
                            styles.themeChoiceText,
                            lang === 'en' && styles.themeChoiceTextActive,
                          ]}
                        >
                          English
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.themeChoice, lang === 'hi' && styles.themeChoiceActive]}
                        onPress={() => onToggleLang('hi')}
                        activeOpacity={0.85}
                      >
                        <Text
                          style={[
                            styles.themeChoiceText,
                            lang === 'hi' && styles.themeChoiceTextActive,
                          ]}
                        >
                          हिन्दी
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>

                <View style={styles.settingsGroup}>
                  <TouchableOpacity
                    style={styles.settingsActionRow}
                    onPress={onClearRecents}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="trash-outline" size={14} color={c.rose} />
                    <Text style={styles.settingsActionText}>{t.clearRecents}</Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={[styles.drawerItem, { marginHorizontal: 0 }]}
                  onPress={() => setPanel('main')}
                  activeOpacity={0.8}
                >
                  <View style={styles.drawerItemIcon}>
                    <Ionicons name="arrow-back" size={16} color={c.textMuted} />
                  </View>
                  <View style={styles.drawerItemBody}>
                    <Text style={styles.drawerItemLabel}>{t.drawerTitle}</Text>
                  </View>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={styles.drawerSectionLabel}>{t.menu}</Text>
                {items.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.drawerItem}
                    onPress={() => onSelect(item.id)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.drawerItemIcon}>
                      <MaterialCommunityIcons
                        name={item.icon}
                        size={17}
                        color={item.soon ? c.amber : c.emerald}
                      />
                    </View>
                    <View style={styles.drawerItemBody}>
                      <Text style={styles.drawerItemLabel}>{item.label}</Text>
                      <Text style={styles.drawerItemSub} numberOfLines={1}>
                        {item.sub}
                      </Text>
                    </View>
                    {item.soon ? (
                      <View style={styles.drawerSoonChip}>
                        <Text style={styles.drawerSoonText}>{t.comingSoon}</Text>
                      </View>
                    ) : (
                      <Ionicons name="chevron-forward" size={15} color={c.textDim} />
                    )}
                  </TouchableOpacity>
                ))}
                <View style={styles.drawerDivider} />
              </>
            )}
          </ScrollView>

          <View style={styles.drawerFooter}>
            <TouchableOpacity
              style={styles.drawerHomeRow}
              onPress={() => {
                onClose();
                if (typeof onBackHome === 'function') onBackHome();
              }}
              activeOpacity={0.85}
            >
              <Ionicons name="home-outline" size={14} color={c.textMuted} />
              <Text style={styles.drawerHomeText}>{t.backToHome}</Text>
            </TouchableOpacity>
            <Text style={styles.drawerFooterText}>{t.appTitle}</Text>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

// =========================================================================
// LIVE TELEMETRY HUD
// =========================================================================
function TelemetryHud({
  speed = 0,
  delayMin = 0,
  statusHeadline = '',
  statusSub = '',
  onHonk,
  hornTrigger = 0,
  lang = 'en',
  currentStationName = '',
  progress = 0,
  hasProgress = false,
  speedBasis = '',
  isSimulated = false,
  styles,
  c,
}) {
  const t = STRINGS[lang] || STRINGS.en;
  const ratio = Math.min(1, Math.max(0, speed / 150));
  const arcLength = Math.PI * 46;
  const filled = arcLength * ratio;

  // Playful horn shake, kept from the previous cockpit HUD
  const [hornAnim] = useState(() => new Animated.Value(0));
  useEffect(() => {
    if (hornTrigger > 0) {
      Animated.sequence([
        Animated.timing(hornAnim, { toValue: 1, duration: 110, useNativeDriver: true }),
        Animated.timing(hornAnim, { toValue: -1, duration: 110, useNativeDriver: true }),
        Animated.timing(hornAnim, { toValue: 1, duration: 110, useNativeDriver: true }),
        Animated.timing(hornAnim, { toValue: 0, duration: 110, useNativeDriver: true }),
      ]).start();
    }
  }, [hornTrigger, hornAnim]);

  const hornRotate = hornAnim.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ['-14deg', '0deg', '14deg'],
  });

  const delayText =
    delayMin === 0 ? t.onTime : delayMin > 0 ? t.lateBy(delayMin) : t.earlyBy(Math.abs(delayMin));
  const delayTone = delayMin > 10 ? 'late' : delayMin > 0 ? 'warn' : 'ok';
  const delayChipStyle =
    delayTone === 'late' ? styles.delayLate : delayTone === 'warn' ? styles.delayWarn : styles.delayOk;
  const delayTextStyle =
    delayTone === 'late'
      ? styles.delayLateText
      : delayTone === 'warn'
        ? styles.delayWarnText
        : styles.delayOkText;

  return (
    <LinearGradient colors={c.hudGradient} style={styles.hudCard}>
      <View style={styles.hudTopRow}>
        <View style={styles.hudLivePill}>
          <View style={[styles.hudLiveDot, isSimulated && styles.demoLiveDot]} />
          <Text style={[styles.hudLiveText, isSimulated && styles.demoBannerText]}>
            {isSimulated ? t.demoCockpit : t.liveCockpit}
          </Text>
        </View>
        <View style={[styles.delayChip, delayChipStyle]}>
          <Text style={[styles.delayText, delayTextStyle]}>{delayText}</Text>
        </View>
      </View>

      <View style={styles.hudMain}>
        <View style={styles.speedBlock}>
          <View style={styles.speedValueRow}>
            <Text style={styles.speedValue}>{Math.round(speed)}</Text>
            <Text style={styles.speedUnit}>
              {speedBasis === 'estimated' ? 'km/h est.' : 'km/h'}
            </Text>
          </View>
          <Text style={styles.speedCaption}>{t.speedLabel}</Text>
          <View style={styles.speedTrack}>
            <View style={[styles.speedTrackFill, { width: `${Math.round(ratio * 100)}%` }]} />
          </View>
          {!!currentStationName && (
            <Text style={styles.speedStation} numberOfLines={1}>
              ● {currentStationName}
            </Text>
          )}
        </View>

        <View style={styles.gaugeBox}>
          <Svg width={118} height={72} viewBox="0 0 120 72">
            <Defs>
              <SvgLinearGradient id="gaugeArc" x1="0" y1="0" x2="1" y2="0">
                <Stop offset="0%" stopColor={c.emerald} />
                <Stop offset="60%" stopColor={c.amber} />
                <Stop offset="100%" stopColor={c.rose} />
              </SvgLinearGradient>
            </Defs>
            <Path
              d="M 14 62 A 46 46 0 0 1 106 62"
              stroke={c.railTrack}
              strokeWidth="8"
              strokeLinecap="round"
              fill="none"
            />
            <Path
              d="M 14 62 A 46 46 0 0 1 106 62"
              stroke="url(#gaugeArc)"
              strokeWidth="8"
              strokeLinecap="round"
              fill="none"
              strokeDasharray={`${filled} ${arcLength}`}
            />
            <Circle cx="60" cy="62" r="3.5" fill={c.emerald} />
          </Svg>
          <Text style={styles.gaugeLabel}>{t.gaugeLabel}</Text>
        </View>
      </View>

      <View style={styles.hudStatusRow}>
        <View style={styles.hudStatusIcon}>
          <Ionicons name="radio" size={14} color={c.emerald} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.hudHeadline} numberOfLines={2}>
            {statusHeadline || t.runningFast}
          </Text>
          <Text style={styles.hudSub} numberOfLines={1}>
            {statusSub || t.runningSub}
          </Text>
        </View>
        <TouchableOpacity style={styles.hornBtn} onPress={onHonk} activeOpacity={0.85}>
          <Animated.View style={{ transform: [{ rotate: hornRotate }] }}>
            <FontAwesome5 name="bullhorn" size={11} color={c.amber} />
          </Animated.View>
          <Text style={styles.hornText}>{t.horn}</Text>
        </TouchableOpacity>
      </View>

      {hasProgress && (
        <View style={styles.progressWrap}>
          <View style={styles.progressRail}>
            <View
              style={[styles.progressFill, { width: `${Math.max(2, Math.min(100, progress * 100))}%` }]}
            />
            <View
              style={[
                styles.progressTrain,
                { left: `${Math.max(2, Math.min(100, progress * 100))}%` },
              ]}
            >
              <MaterialCommunityIcons name="train" size={10} color={c.onEmerald} />
            </View>
          </View>
          <View style={styles.progressLabels}>
            <Text style={styles.progressLabel}>{t.progressStart}</Text>
            <Text style={styles.progressLabel}>{t.progressEnd}</Text>
          </View>
        </View>
      )}
    </LinearGradient>
  );
}

// =========================================================================
// TIMELINE STATION ROW
// =========================================================================
function StationRow({
  station,
  isFirst,
  isLast,
  isCurrent,
  isDeparted,
  pulseAnim,
  hasNonHalts = 0,
  isExpanded = false,
  onToggle,
  sectionLive = false,
  lang = 'en',
  styles,
  c,
}) {
  const t = STRINGS[lang] || STRINGS.en;
  const arrTime = station.actualArrival || station.scheduledArrival || '--:--';
  const depTime = station.actualDeparture || station.scheduledDeparture || '--:--';
  const delayVal = Math.max(station.delayArrival || 0, station.delayDeparture || 0);
  const hasDelay = delayVal > 0;
  const showScheduledDep =
    !!station.scheduledDeparture && station.scheduledDeparture !== depTime;

  const stationDisplayName =
    lang === 'hi' ? station.stationHindi || station.stationName : station.stationName;
  // Never show a guessed platform number for stations where the feed has none.
  const hasPlatform = !!station.platform && station.platform !== 'PF --';
  const platformNum = String(station.platform || '').replace(/[^\d]/g, '');
  const card = (
    <View style={[styles.journeyCard, isCurrent && styles.journeyCardCurrent]}>
      <View style={styles.journeyCardHeader}>
        <Text
          style={[
            styles.journeyStationName,
            isDeparted && styles.journeyStationNameMuted,
            isCurrent && styles.journeyStationNameCurrent,
          ]}
          numberOfLines={2}
        >
          {stationDisplayName} ({station.stationCode})
        </Text>
        <View style={styles.journeyHeaderRight}>
          {hasPlatform && (
            <View style={styles.journeyPfBadge}>
              <Text style={styles.journeyPfBadgeText}>- PF {platformNum}</Text>
            </View>
          )}
          <Text style={[styles.journeyStatusText, hasDelay && styles.journeyStatusLate]}>
            {hasDelay ? t.lateBy(delayVal) : t.onTime}
          </Text>
        </View>
      </View>

      <View style={styles.journeyDivider} />

      <View style={styles.journeyTimesRow}>
        <View style={styles.journeyTimeBlock}>
          <Text style={styles.journeyTimeLabel}>{t.arrivalLabel}</Text>
          <Text
            style={[
              styles.journeyTimeValue,
              isDeparted && styles.journeyTimeValueMuted,
              isCurrent && styles.journeyStationNameCurrent,
            ]}
          >
            {arrTime}
          </Text>
        </View>
        <View style={[styles.journeyTimeBlock, styles.journeyTimeBlockEnd]}>
          <Text style={styles.journeyTimeLabel}>{t.departureLabel}</Text>
          <Text
            style={[
              styles.journeyTimeValue,
              isDeparted && styles.journeyTimeValueMuted,
              isCurrent && styles.journeyStationNameCurrent,
            ]}
          >
            {depTime}
          </Text>
          {showScheduledDep && (
            <Text style={styles.journeyScheduled}>{station.scheduledDeparture}</Text>
          )}
        </View>
      </View>

      {(isCurrent || hasDelay) && (
        <View style={styles.journeyBadgeRow}>
          {isCurrent && (
            <View style={styles.journeyHereChip}>
              <Text style={styles.journeyHereChipText}>
                {sectionLive ? t.trainInSection : t.trainIsHere}
              </Text>
            </View>
          )}
          {hasDelay && (
            <View style={styles.journeyDelayChip}>
              <Text style={styles.journeyDelayChipText}>
                +{delayVal} {t.minShort}
              </Text>
            </View>
          )}
        </View>
      )}

      {hasNonHalts > 0 && (
        <View style={styles.journeyExpandRow}>
          <Text style={styles.journeyExpandText}>
            {isExpanded
              ? t.hideIntermediate(hasNonHalts)
              : t.showIntermediate(hasNonHalts)}
          </Text>
          <Ionicons
            name={isExpanded ? 'chevron-up' : 'chevron-down'}
            size={13}
            color={c.emerald}
          />
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.journeyRow}>
      <View style={styles.stationRailCol}>
        <View
          style={[
            styles.stationRailSegment,
            isFirst && styles.stationRailHidden,
            (isDeparted || isCurrent) && styles.stationRailDone,
          ]}
        />
        <View
          style={[
            styles.stationNode,
            isDeparted && styles.stationNodeDone,
            isCurrent && styles.stationNodeCurrent,
          ]}
        >
          {isCurrent && (
            <Animated.View
              style={[styles.stationNodePulse, { transform: [{ scale: pulseAnim }] }]}
            />
          )}
          {isCurrent ? (
            <MaterialCommunityIcons name="train" size={10} color={c.onEmerald} />
          ) : isDeparted ? (
            <Ionicons name="checkmark" size={10} color={c.onEmerald} />
          ) : (
            <View style={styles.stationNodeCore} />
          )}
        </View>
        <View
          style={[
            styles.stationRailSegment,
            isLast && styles.stationRailHidden,
            isDeparted && styles.stationRailDone,
          ]}
        />
      </View>

      {hasNonHalts > 0 ? (
        <TouchableOpacity
          style={styles.journeyCardTouch}
          onPress={onToggle}
          activeOpacity={0.8}
          accessibilityRole="button"
        >
          {card}
        </TouchableOpacity>
      ) : (
        card
      )}
    </View>
  );
}


// =========================================================================
// MAIN COMPONENT: LiveTrainStatus
// =========================================================================
export default function LiveTrainStatus({ onBack, onRegisterBack }) {
  const [lang, setLang] = useState('en'); // 'en' default, switchable to 'hi'
  const t = STRINGS[lang] || STRINGS.en;

  const [query, setQuery] = useState('');
  const [selectedTrain, setSelectedTrain] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [activeCategory, setActiveCategory] = useState(null);
  const [recentSearches, setRecentSearches] = useState([]);

  // Live status state
  const [live, setLive] = useState(null);
  const [isLoadingLive, setIsLoadingLive] = useState(false);
  const [selectedDateOffset, setSelectedDateOffset] = useState(0); // -1: Yesterday, 0: Today, 1: Tomorrow
  const [filterMode, setFilterMode] = useState('halts'); // 'halts' | 'all'
  const [expandedHalts, setExpandedHalts] = useState({});
  const [crossings, setCrossings] = useState([]);
  const [hornCount, setHornCount] = useState(0);

  // Search mode: 'train' (name/number) or 'route' (from ➔ to station)
  const [searchMode, setSearchMode] = useState('train');
  const [fromQuery, setFromQuery] = useState('');
  const [toQuery, setToQuery] = useState('');
  const [fromStation, setFromStation] = useState(null);
  const [toStation, setToStation] = useState(null);
  const [fromSuggestions, setFromSuggestions] = useState([]);
  const [toSuggestions, setToSuggestions] = useState([]);
  const [activeStationField, setActiveStationField] = useState(null);
  const [stationSearchingField, setStationSearchingField] = useState(null);
  const [routeDateOffset, setRouteDateOffset] = useState(0);
  const [routeResults, setRouteResults] = useState([]);
  const [routeMeta, setRouteMeta] = useState(null);
  const [routeSearched, setRouteSearched] = useState(false);
  const [isRouteSearching, setIsRouteSearching] = useState(false);
  const [routeError, setRouteError] = useState('');

  // Presentation-only state (theme, drawer, animated swap)
  const [themeMode, setThemeMode] = useState('dark');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerPanel, setDrawerPanel] = useState('main'); // 'main' | 'settings'
  const [drawerNote, setDrawerNote] = useState('');

  // Animated values
  const [refreshAnim] = useState(() => new Animated.Value(0));
  const [pulseAnim] = useState(() => new Animated.Value(1));
  const [swapAnim] = useState(() => new Animated.Value(0));
  const searchTimeoutRef = useRef(null);
  const stationTimersRef = useRef({ from: null, to: null });
  const stationQueryRef = useRef({ from: '', to: '' });
  const searchScrollRef = useRef(null);

  const { width: viewportWidth } = useWindowDimensions();
  const drawerWidth = Math.min(330, viewportWidth * 0.86);
  const c = THEMES[themeMode] || THEMES.dark;
  const styles = useMemo(() => createStyles(c, drawerWidth), [c, drawerWidth]);

  // Load language, theme and recent searches on mount
  useEffect(() => {
    (async () => {
      try {
        const savedLang = await AsyncStorage.getItem(LANG_STORAGE_KEY);
        if (savedLang === 'hi' || savedLang === 'en') {
          setLang(savedLang);
        }
        const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (savedTheme === 'light' || savedTheme === 'dark') {
          setThemeMode(savedTheme);
        }
        const stored = await AsyncStorage.getItem(RECENT_SEARCHES_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setRecentSearches(parsed);
          }
        }
      } catch (_e) {
        // ignore
      }

      setIsSearching(true);
      const dynamicTrains = await fetchDynamicTrendingTrains('vande bharat');
      setSearchResults(dynamicTrains);
      setIsSearching(false);
    })();
  }, []);

  // Handle language switch
  const handleToggleLang = useCallback((nextLang) => {
    setLang(nextLang);
    AsyncStorage.setItem(LANG_STORAGE_KEY, nextLang).catch(() => {});
  }, []);

  // Handle theme switch (Midnight / Daylight)
  const handleToggleTheme = useCallback(
    (nextTheme) => {
      const value =
        nextTheme === 'light' || nextTheme === 'dark'
          ? nextTheme
          : themeMode === 'dark'
            ? 'light'
            : 'dark';
      setThemeMode(value);
      AsyncStorage.setItem(THEME_STORAGE_KEY, value).catch(() => {});
    },
    [themeMode]
  );

  // Clear any pending station search timers on unmount
  useEffect(
    () => () => {
      const timers = stationTimersRef.current;
      if (timers.from) clearTimeout(timers.from);
      if (timers.to) clearTimeout(timers.to);
    },
    []
  );

  // ---- FROM / TO STATION SEARCH -------------------------------------------------

  // Turn typed text like "NDLS" or "New Delhi (NDLS)" into a station object
  const parseStationInput = useCallback((text) => {
    const raw = (text || '').trim();
    if (!raw) return null;

    const inBrackets = raw.match(/\(([A-Za-z0-9]{2,10})\)\s*$/);
    if (inBrackets) {
      const code = inBrackets[1].toUpperCase();
      const name = raw.replace(/\s*\([^)]*\)\s*$/, '').trim() || code;
      return { code, name };
    }

    if (/^[A-Za-z0-9]{2,10}$/.test(raw)) {
      return { code: raw.toUpperCase(), name: raw.toUpperCase() };
    }

    return null;
  }, []);

  const handleStationQueryChange = useCallback(
    (text, field) => {
      if (field === 'from') {
        setFromQuery(text);
        setFromStation(null);
      } else {
        setToQuery(text);
        setToStation(null);
      }

      setRouteError('');
      setActiveStationField(field);

      const timers = stationTimersRef.current;
      if (timers[field]) clearTimeout(timers[field]);

      const q = (text || '').trim();
      stationQueryRef.current[field] = q;

      if (q.length < 2) {
        if (field === 'from') setFromSuggestions([]);
        else setToSuggestions([]);
        setStationSearchingField(null);
        return;
      }

      setStationSearchingField(field);
      timers[field] = setTimeout(async () => {
        const list = await searchStationsOnline(q, lang);
        // Ignore stale responses if the user kept typing
        if (stationQueryRef.current[field] !== q) return;
        if (field === 'from') setFromSuggestions(list);
        else setToSuggestions(list);
        setStationSearchingField((cur) => (cur === field ? null : cur));
      }, 320);
    },
    [lang]
  );

  const handleSelectStation = useCallback((station, field) => {
    const label = `${station.name} (${station.code})`;
    stationQueryRef.current[field] = '';
    if (field === 'from') {
      setFromStation(station);
      setFromQuery(label);
      setFromSuggestions([]);
    } else {
      setToStation(station);
      setToQuery(label);
      setToSuggestions([]);
    }
    setActiveStationField(null);
    setStationSearchingField(null);
    setRouteError('');
  }, []);

  const handleSwapStations = useCallback(() => {
    stationQueryRef.current = { from: '', to: '' };
    setFromStation(toStation);
    setFromQuery(toQuery);
    setToStation(fromStation);
    setToQuery(fromQuery);
    setFromSuggestions([]);
    setToSuggestions([]);
    setActiveStationField(null);
    setRouteError('');
    setRouteSearched(false);
    setRouteResults([]);
    setRouteMeta(null);
  }, [fromQuery, toQuery, fromStation, toStation]);

  // Animated swap: rotate the icon a half turn, then swap the fields
  const handleSwapPress = useCallback(() => {
    swapAnim.setValue(0);
    Animated.timing(swapAnim, {
      toValue: 1,
      duration: 280,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: true,
    }).start(() => swapAnim.setValue(0));
    handleSwapStations();
  }, [swapAnim, handleSwapStations]);

  // Fetch trains for a resolved from/to pair
  const runRouteSearch = useCallback(
    async (fromArg, toArg, offset) => {
      setIsRouteSearching(true);
      setRouteError('');
      try {
        const dateStr = getISTDateString(offset);
        const result = await fetchTrainsBetween(fromArg.code, toArg.code, dateStr, lang);

        if (result.error === 'same-station') {
          setRouteError(t.routeErrorSame);
          setRouteResults([]);
        } else if (result.error === 'not-found') {
          setRouteError(t.routeErrorNotFound);
          setRouteResults([]);
        } else if (result.error === 'invalid') {
          setRouteError(t.routeErrorSelect);
          setRouteResults([]);
        } else {
          if (result.error === 'network') setRouteError(t.routeErrorNetwork);
          setRouteResults(result.trains || []);
          setRouteMeta({ from: result.from || fromArg, to: result.to || toArg });
        }
        setRouteSearched(true);
      } finally {
        setIsRouteSearching(false);
      }
    },
    [lang, t]
  );

  const handleRouteSearch = useCallback(async () => {
    if (!fromQuery.trim() || !toQuery.trim()) {
      setRouteError(t.routeErrorSelect);
      return;
    }

    setIsRouteSearching(true);
    setRouteError('');

    try {
      const fromArg =
        fromStation || parseStationInput(fromQuery) || (await searchStationsOnline(fromQuery, lang))[0] || null;
      const toArg =
        toStation || parseStationInput(toQuery) || (await searchStationsOnline(toQuery, lang))[0] || null;

      if (!fromArg || !toArg) {
        setRouteError(t.routeErrorNotFound);
        setRouteSearched(true);
        setRouteResults([]);
        return;
      }

      if (fromArg.code === toArg.code) {
        setRouteError(t.routeErrorSame);
        setRouteSearched(true);
        setRouteResults([]);
        return;
      }

      setFromStation(fromArg);
      setFromQuery(`${fromArg.name} (${fromArg.code})`);
      setToStation(toArg);
      setToQuery(`${toArg.name} (${toArg.code})`);
      setActiveStationField(null);
      setFromSuggestions([]);
      setToSuggestions([]);

      await runRouteSearch(fromArg, toArg, routeDateOffset);
    } finally {
      setIsRouteSearching(false);
    }
  }, [fromQuery, toQuery, fromStation, toStation, routeDateOffset, lang, t, parseStationInput, runRouteSearch]);

  const handleRouteDateChange = useCallback(
    (offset) => {
      if (offset === routeDateOffset) return;
      setRouteDateOffset(offset);
      if (fromStation && toStation && routeSearched) {
        runRouteSearch(fromStation, toStation, offset);
      }
    },
    [routeDateOffset, fromStation, toStation, routeSearched, runRouteSearch]
  );

  // Pulse animation for live train marker
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.35,
          duration: 850,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 850,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulseAnim]);

  // Android hardware back: if a train's live status is open, close it and
  // return to the search list first. Otherwise let the app handle back.
  useEffect(() => {
    if (typeof onRegisterBack !== 'function') return undefined;

    return onRegisterBack(() => {
      if (drawerOpen) {
        setDrawerOpen(false);
        return true;
      }
      if (selectedTrain) {
        setSelectedTrain(null);
        setLive(null);
        return true;
      }
      return false;
    });
  }, [onRegisterBack, selectedTrain, drawerOpen]);

  // Save to recent searches dynamically
  const saveRecentSearch = useCallback(async (train) => {
    try {
      setRecentSearches((prev) => {
        const num = train.number || train.trainNumber;
        const filtered = prev.filter((item) => (item.number || item.trainNumber) !== num);
        const next = [train, ...filtered].slice(0, 6);
        AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next)).catch(() => {});
        return next;
      });
    } catch (_e) {
      // ignore
    }
  }, []);

  const clearRecentSearches = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(RECENT_SEARCHES_KEY);
      setRecentSearches([]);
    } catch (_e) {
      // ignore
    }
  }, []);

  // Fetch live train status
  const loadTrainStatus = useCallback(
    async (trainNum, dateOffset = 0) => {
      if (!trainNum) return;
      setIsLoadingLive(true);

      refreshAnim.setValue(0);
      Animated.timing(refreshAnim, {
        toValue: 1,
        duration: 800,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }).start();

      const dateStr = getISTDateString(dateOffset);
      try {
        const liveData = await fetchLiveTrainStatus(trainNum, dateStr);
        setLive(liveData);
        setCrossings(findCrossingTrains(liveData, liveData));
      } catch (_e) {
        // handled in service
      } finally {
        setIsLoadingLive(false);
      }
    },
    [refreshAnim]
  );

  // Poll every 60s — keeps free-tier API quotas (RailCore 100/day) usable.
  useEffect(() => {
    if (!selectedTrain) return;
    const num = selectedTrain.number || selectedTrain.trainNumber;
    const interval = setInterval(() => {
      loadTrainStatus(num, selectedDateOffset);
    }, 60000);
    return () => clearInterval(interval);
  }, [selectedTrain, selectedDateOffset, loadTrainStatus]);

  // Select a train
  const handleSelectTrain = useCallback(
    (train) => {
      setSelectedTrain(train);
      setSelectedDateOffset(0);
      setExpandedHalts({});
      setFilterMode('halts');
      saveRecentSearch(train);
      const num = train.number || train.trainNumber;
      loadTrainStatus(num, 0);
    },
    [loadTrainStatus, saveRecentSearch]
  );

  // Dynamic Search Input
  const handleQueryChange = useCallback((text) => {
    setQuery(text);
    setActiveCategory(null);
    const q = (text || '').trim();

    if (!q) {
      setIsSearching(true);
      fetchDynamicTrendingTrains('vande bharat').then((res) => {
        setSearchResults(res);
        setIsSearching(false);
      });
      return;
    }

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    setIsSearching(true);
    searchTimeoutRef.current = setTimeout(async () => {
      const results = await searchTrainsOnlineOrOffline(q);
      setSearchResults(results);
      setIsSearching(false);
    }, 380);
  }, []);

  // Category Chip click
  const handleCategoryPress = useCallback((cat) => {
    setActiveCategory(cat.id);
    setQuery('');
    setIsSearching(true);
    fetchDynamicTrendingTrains(cat.query).then((res) => {
      setSearchResults(res);
      setIsSearching(false);
    });
  }, []);

  // Submit search directly
  const handleSearchSubmit = useCallback(() => {
    const q = (query || '').trim();
    if (!q) return;

    if (searchResults.length > 0) {
      handleSelectTrain(searchResults[0]);
    } else {
      const dynamicCustom = {
        number: /^\d+$/.test(q) ? q : '14123',
        name: /^\d+$/.test(q) ? `Express ${q}` : `${q.toUpperCase()} Express`,
        nameHindi: /^\d+$/.test(q) ? `एक्सप्रेस ${q}` : `${q} एक्सप्रेस`,
        source: 'MBDP',
        sourceName: 'Maa Belha Devi Dham Pratapgarh',
        dest: 'CKTD',
        destName: 'Chitrakut Dham Karwi',
        origin: 'MBDP',
        destination: 'CKTD',
        type: 'Express',
      };
      handleSelectTrain(dynamicCustom);
    }
  }, [query, searchResults, handleSelectTrain]);

  // Share status
  const handleShareStatus = useCallback(async () => {
    if (!live) return;
    try {
      const delayText =
        live.delayMin === 0
          ? t.onTime
          : live.delayMin > 0
            ? t.lateBy(live.delayMin)
            : t.earlyBy(Math.abs(live.delayMin));

      const summary = lang === 'hi' ? live.summaryHi : live.summaryEn;
      const msg = `🚆 Live Train Status: ${live.trainNumber} - ${live.trainName}\n📍 Status: ${summary}\n⏱️ Delay: ${delayText}\n⚡ Speed: ${live.speedKmh} km/h\n🛤️ Route: ${live.source} ➔ ${live.destination}\n📅 Date: ${live.startDate}\nShared via Smart Calculator & Train App`;

      await Share.share({ message: msg });
    } catch (_e) {
      // ignore
    }
  }, [live, lang, t]);

  // Share the app itself (drawer action)
  const handleShareApp = useCallback(async () => {
    try {
      await Share.share({ message: t.shareMessage });
    } catch (_e) {
      // ignore
    }
  }, [t]);

  // Station route to display. In "halts" mode every row is a halt and carries
  // the non-halting stations that follow it (up to the next halt). Tapping the
  // halt reveals those pass-through stations instead of hiding them entirely.
  const timelineItems = useMemo(() => {
    if (!live || !live.route) return [];
    const route = live.route;

    if (filterMode === 'all') {
      return route.map((station, i) => ({
        key: `${station.sequence ?? i}-${station.stationCode ?? i}`,
        station,
        nonHalts: [],
      }));
    }

    const halts = route.filter((r) => r.isHalt);
    const hasHalts = halts.length > 0;
    const base = hasHalts ? halts : route;

    return base.map((station, i) => {
      let nonHalts = [];
      if (hasHalts) {
        const startIdx = route.indexOf(station) + 1;
        let endIdx = startIdx;
        while (endIdx < route.length && !route[endIdx].isHalt) endIdx += 1;
        nonHalts = route.slice(startIdx, endIdx);
      }
      return {
        key: `${station.sequence ?? i}-${station.stationCode ?? i}`,
        station,
        nonHalts,
      };
    });
  }, [live, filterMode]);

  const toggleHalt = useCallback((key) => {
    setExpandedHalts((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  // ---- UI helpers (presentation only) ----------------------------------

  const scrollToTop = useCallback(() => {
    if (searchScrollRef.current) {
      searchScrollRef.current.scrollTo({ y: 0, animated: true });
    }
  }, []);

  const openDrawer = useCallback((panel = 'main') => {
    setDrawerPanel(panel);
    setDrawerNote('');
    setDrawerOpen(true);
  }, []);

  const closeDrawer = useCallback(() => {
    setDrawerOpen(false);
    setDrawerNote('');
  }, []);

  const handleDrawerSelect = useCallback(
    (id) => {
      if (id === 'settings') {
        setDrawerPanel('settings');
        setDrawerNote('');
        return;
      }
      if (id === 'share') {
        closeDrawer();
        handleShareApp();
        return;
      }
      if (id === 'bookings') {
        closeDrawer();
        setSearchMode('train');
        if (recentSearches.length > 0) {
          searchScrollRef.current?.scrollTo({ y: 340, animated: true });
        } else {
          scrollToTop();
        }
        return;
      }
      if (id === 'timetable') {
        closeDrawer();
        setSearchMode('route');
        scrollToTop();
        return;
      }
      setDrawerNote(t.comingSoonNote);
    },
    [closeDrawer, handleShareApp, recentSearches.length, scrollToTop, t]
  );

  const handleDockPress = useCallback(
    (id) => {
      if (id === 'spot') {
        setSearchMode('train');
        scrollToTop();
        return;
      }
      if (id === 'route') {
        setSearchMode('route');
        scrollToTop();
        return;
      }
      if (id === 'recent') {
        if (recentSearches.length > 0) {
          searchScrollRef.current?.scrollTo({ y: 330, animated: true });
        } else {
          scrollToTop();
        }
        return;
      }
      if (id === 'share') {
        handleShareApp();
        return;
      }
      openDrawer('main');
    },
    [recentSearches.length, scrollToTop, handleShareApp, openDrawer]
  );

  // Inline autocomplete list for the From / To station inputs
  const renderStationSuggestions = (field) => {
    const suggestions = field === 'from' ? fromSuggestions : toSuggestions;
    const isLoading = stationSearchingField === field;

    if (activeStationField !== field) return null;
    if (!isLoading && suggestions.length === 0) return null;

    return (
      <View style={styles.stationSuggestions}>
        {isLoading && suggestions.length === 0 ? (
          <View style={styles.suggestionLoading}>
            <ActivityIndicator size="small" color={c.amber} />
            <Text style={styles.suggestionName}>{t.stationsLabel}...</Text>
          </View>
        ) : (
          suggestions.slice(0, 6).map((s, idx) => (
            <TouchableOpacity
              key={`${field}-${s.code}-${idx}`}
              style={styles.suggestionRow}
              onPress={() => handleSelectStation(s, field)}
              activeOpacity={0.8}
            >
              <View style={styles.suggestionCode}>
                <Text style={styles.suggestionCodeText}>{s.code}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.suggestionName} numberOfLines={1}>
                  {s.name}
                </Text>
                {!!s.city && <Text style={styles.suggestionCity}>{s.city}</Text>}
              </View>
              <Ionicons name="add-circle-outline" size={17} color={c.emerald} />
            </TouchableOpacity>
          ))
        )}
      </View>
    );
  };

  const dockItems = [
    { id: 'spot', icon: 'train', label: t.dockSpot, active: searchMode === 'train' },
    { id: 'route', icon: 'map-marker-path', label: t.dockRoute, active: searchMode === 'route' },
    { id: 'recent', icon: 'time-outline', label: t.dockRecent, ion: true },
    { id: 'share', icon: 'share-social-outline', label: t.dockShare, ion: true },
    { id: 'menu', icon: 'menu', label: t.dockMenu, ion: true },
  ];

  const swapRotate = swapAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });


  // =========================================================================
  // VIEW 1: SPOT / ROUTE SEARCH
  // =========================================================================
  if (!selectedTrain) {
    return (
      <View style={styles.screen}>
        <StatusBar style={themeMode === 'dark' ? 'light' : 'dark'} />
        <LinearGradient colors={c.bgGradient} style={StyleSheet.absoluteFill} />
        <View pointerEvents="none" style={styles.ambientLayer}>
          <View style={[styles.ambientBlob, styles.ambientBlobA]} />
          <View style={[styles.ambientBlobSmall, styles.ambientBlobB]} />
        </View>

        <AppHeader
          t={t}
          styles={styles}
          c={c}
          lang={lang}
          onToggleLang={handleToggleLang}
          themeMode={themeMode}
          onToggleTheme={() => handleToggleTheme()}
          onOpenMenu={() => openDrawer('main')}
          pulseAnim={pulseAnim}
        />

        <ScrollView
          ref={searchScrollRef}
          style={styles.scroll}
          contentContainerStyle={styles.searchScrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* SPOT / ROUTE COMMAND CARD */}
          <View style={styles.heroCard}>
            <View pointerEvents="none" style={styles.heroGlow} />

            <View style={styles.heroTop}>
              <LinearGradient
                colors={[c.emerald, c.emeraldDeep]}
                style={styles.heroIconBadge}
              >
                <MaterialCommunityIcons name="train-car" size={20} color={c.onEmerald} />
              </LinearGradient>
              <View style={styles.heroTitleWrap}>
                <Text style={styles.heroTitle}>
                  {searchMode === 'train' ? t.spotTitle : t.routeTitle}
                </Text>
                <Text style={styles.heroSubtitle} numberOfLines={2}>
                  {searchMode === 'train' ? t.spotSub : t.routeSub}
                </Text>
              </View>
              <View style={styles.livePill}>
                <View style={styles.liveDot} />
                <Text style={styles.livePillText}>LIVE</Text>
              </View>
            </View>

            <View style={styles.segment}>
              <TouchableOpacity
                style={[styles.segmentBtn, searchMode === 'train' && styles.segmentBtnActive]}
                onPress={() => setSearchMode('train')}
                activeOpacity={0.85}
              >
                <MaterialCommunityIcons
                  name="train"
                  size={15}
                  color={searchMode === 'train' ? c.onEmerald : c.textMuted}
                />
                <Text
                  style={[styles.segmentText, searchMode === 'train' && styles.segmentTextActive]}
                >
                  {t.modeTrain}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.segmentBtn, searchMode === 'route' && styles.segmentBtnActive]}
                onPress={() => setSearchMode('route')}
                activeOpacity={0.85}
              >
                <MaterialCommunityIcons
                  name="map-marker-path"
                  size={15}
                  color={searchMode === 'route' ? c.onEmerald : c.textMuted}
                />
                <Text
                  style={[styles.segmentText, searchMode === 'route' && styles.segmentTextActive]}
                >
                  {t.modeRoute}
                </Text>
              </TouchableOpacity>
            </View>

            {searchMode === 'train' ? (
              <>
                <View style={styles.inputShell}>
                  <MaterialCommunityIcons name="magnify" size={20} color={c.textMuted} />
                  <TextInput
                    style={styles.input}
                    value={query}
                    onChangeText={handleQueryChange}
                    placeholder={t.searchPlaceholder}
                    placeholderTextColor={c.textDim}
                    autoCapitalize="characters"
                    returnKeyType="search"
                    onSubmitEditing={handleSearchSubmit}
                  />
                  {query.length > 0 && (
                    <TouchableOpacity onPress={() => handleQueryChange('')} style={styles.inputClear}>
                      <Ionicons name="close-circle" size={18} color={c.textDim} />
                    </TouchableOpacity>
                  )}
                  <LinearGradient colors={[c.emerald, c.emeraldDeep]} style={styles.inputSubmit}>
                    <TouchableOpacity
                      onPress={handleSearchSubmit}
                      activeOpacity={0.85}
                      style={{ width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' }}
                    >
                      {isSearching ? (
                        <ActivityIndicator size="small" color={c.onEmerald} />
                      ) : (
                        <MaterialCommunityIcons name="arrow-right" size={18} color={c.onEmerald} />
                      )}
                    </TouchableOpacity>
                  </LinearGradient>
                </View>

                <View style={styles.filterLabelRow}>
                  <Text style={styles.filterLabel}>{t.quickFilters}</Text>
                </View>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.chipRow}
                >
                  {DYNAMIC_CATEGORIES.map((cat) => {
                    const isCatActive = activeCategory === cat.id;
                    const label = lang === 'hi' ? cat.labelHi : cat.labelEn;
                    return (
                      <TouchableOpacity
                        key={cat.id}
                        style={[styles.chip, isCatActive && styles.chipActive]}
                        onPress={() => handleCategoryPress(cat)}
                        activeOpacity={0.8}
                      >
                        <MaterialCommunityIcons
                          name={cat.icon}
                          size={14}
                          color={isCatActive ? c.onEmerald : c.amber}
                        />
                        <Text style={[styles.chipText, isCatActive && styles.chipTextActive]}>
                          {label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </>
            ) : (
              <View>
                <View
                  style={[
                    styles.routeFieldRow,
                    activeStationField === 'from' && styles.routeFieldActive,
                  ]}
                >
                  <View style={styles.routeFieldDotWrap}>
                    <View style={styles.routeDotFrom} />
                  </View>
                  <View style={styles.routeFieldBody}>
                    <Text style={styles.routeFieldLabel}>{t.fromLabel}</Text>
                    <TextInput
                      style={styles.routeFieldInput}
                      value={fromQuery}
                      onChangeText={(text) => handleStationQueryChange(text, 'from')}
                      placeholder={t.fromPlaceholder}
                      placeholderTextColor={c.textDim}
                      autoCapitalize="characters"
                      returnKeyType="search"
                      onSubmitEditing={handleRouteSearch}
                      onFocus={() => setActiveStationField('from')}
                    />
                  </View>
                  {fromQuery.length > 0 && (
                    <TouchableOpacity
                      onPress={() => handleStationQueryChange('', 'from')}
                      style={styles.inputClear}
                    >
                      <Ionicons name="close-circle" size={18} color={c.textDim} />
                    </TouchableOpacity>
                  )}
                </View>

                {renderStationSuggestions('from')}

                <View style={styles.swapRow}>
                  <View style={styles.swapLine} />
                  <TouchableOpacity
                    style={styles.swapBtn}
                    onPress={handleSwapPress}
                    activeOpacity={0.85}
                  >
                    <Animated.View style={{ transform: [{ rotate: swapRotate }] }}>
                      <MaterialCommunityIcons name="swap-vertical" size={15} color={c.amber} />
                    </Animated.View>
                    <Text style={styles.swapText}>{t.swapStations}</Text>
                  </TouchableOpacity>
                  <View style={styles.swapLine} />
                </View>

                <View
                  style={[
                    styles.routeFieldRow,
                    activeStationField === 'to' && styles.routeFieldActive,
                  ]}
                >
                  <View style={styles.routeFieldDotWrap}>
                    <View style={styles.routeDotTo} />
                  </View>
                  <View style={styles.routeFieldBody}>
                    <Text style={styles.routeFieldLabel}>{t.toLabel}</Text>
                    <TextInput
                      style={styles.routeFieldInput}
                      value={toQuery}
                      onChangeText={(text) => handleStationQueryChange(text, 'to')}
                      placeholder={t.toPlaceholder}
                      placeholderTextColor={c.textDim}
                      autoCapitalize="characters"
                      returnKeyType="search"
                      onSubmitEditing={handleRouteSearch}
                      onFocus={() => setActiveStationField('to')}
                    />
                  </View>
                  {toQuery.length > 0 && (
                    <TouchableOpacity
                      onPress={() => handleStationQueryChange('', 'to')}
                      style={styles.inputClear}
                    >
                      <Ionicons name="close-circle" size={18} color={c.textDim} />
                    </TouchableOpacity>
                  )}
                </View>

                {renderStationSuggestions('to')}

                <View style={styles.dateRow}>
                  {[0, 1].map((offset) => {
                    const isActive = routeDateOffset === offset;
                    return (
                      <TouchableOpacity
                        key={offset}
                        style={[styles.dateChip, isActive && styles.dateChipActive]}
                        onPress={() => handleRouteDateChange(offset)}
                        activeOpacity={0.85}
                      >
                        <Text
                          style={[styles.dateChipTitle, isActive && styles.dateChipTitleActive]}
                        >
                          {offset === 0 ? t.today : t.tomorrow}
                        </Text>
                        <Text style={[styles.dateChipSub, isActive && styles.dateChipSubActive]}>
                          {getISTDateLabel(offset, lang)}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <TouchableOpacity
                  onPress={handleRouteSearch}
                  activeOpacity={0.9}
                  disabled={isRouteSearching}
                >
                  <LinearGradient colors={[c.emerald, c.emeraldDeep]} style={styles.primaryBtn}>
                    {isRouteSearching ? (
                      <ActivityIndicator size="small" color={c.onEmerald} />
                    ) : (
                      <>
                        <MaterialCommunityIcons name="magnify" size={18} color={c.onEmerald} />
                        <Text style={styles.primaryBtnText}>{t.searchTrainsBtn}</Text>
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                {!!routeError && (
                  <View style={styles.errorBox}>
                    <Ionicons name="alert-circle" size={14} color={c.rose} />
                    <Text style={styles.errorText}>{routeError}</Text>
                  </View>
                )}
              </View>
            )}
          </View>

          {searchMode === 'train' ? (
            <>
              {/* RECENT SEARCHES */}
              {recentSearches.length > 0 && query.trim() === '' && (
                <View>
                  <View style={styles.sectionHeader}>
                    <View style={styles.sectionTitleWrap}>
                      <View style={styles.sectionAccent} />
                      <Text style={styles.sectionTitle}>{t.recentSearches}</Text>
                    </View>
                    <TouchableOpacity onPress={clearRecentSearches} activeOpacity={0.7}>
                      <Text style={styles.clearText}>{t.clear}</Text>
                    </TouchableOpacity>
                  </View>

                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.recentScroll}
                  >
                    {recentSearches.map((item, idx) => {
                      const num = item.number || item.trainNumber;
                      const name = item.name || item.trainName || `Train ${num}`;
                      return (
                        <TouchableOpacity
                          key={`${num}-${idx}`}
                          style={styles.recentCard}
                          onPress={() => handleSelectTrain(item)}
                          activeOpacity={0.85}
                        >
                          <View style={styles.recentNumChip}>
                            <Text style={styles.recentNumText}>{num}</Text>
                          </View>
                          <View style={styles.recentBody}>
                            <Text style={styles.recentName} numberOfLines={1}>
                              {name}
                            </Text>
                            <Text style={styles.recentRoute} numberOfLines={1}>
                              {item.source || item.origin || ''} → {item.dest || item.destination || ''}
                            </Text>
                          </View>
                          <Ionicons name="chevron-forward" size={14} color={c.textDim} />
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
              )}

              {/* LIVE ACTIVE TRAINS */}
              <View>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionTitleWrap}>
                    <View style={styles.sectionAccent} />
                    <Text style={styles.sectionTitle}>
                      {query.trim() === ''
                        ? t.liveActiveTrains
                        : `${searchResults.length} ${t.matchingTrains}`}
                    </Text>
                  </View>
                  {isSearching ? (
                    <ActivityIndicator size="small" color={c.amber} />
                  ) : (
                    query.trim() === '' && (
                      <View style={styles.livePill}>
                        <View style={styles.liveDot} />
                        <Text style={styles.livePillText}>LIVE</Text>
                      </View>
                    )
                  )}
                </View>

                {searchResults.length === 0 && !isSearching ? (
                  <View style={styles.emptyCard}>
                    <Text style={styles.emptyEmoji}>🚉</Text>
                    <Text style={styles.emptyTitle}>{t.noTrainFound}</Text>
                    <Text style={styles.emptySub}>{t.checkQuery}</Text>
                    <TouchableOpacity
                      style={styles.forceBtn}
                      onPress={handleSearchSubmit}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.forceBtnText}>{t.viewDirectStatus(query)}</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  searchResults.map((train, tIdx) => {
                    const num = train.number || train.trainNumber;
                    const name =
                      lang === 'hi' && train.nameHindi
                        ? train.nameHindi
                        : train.name || train.trainName;
                    const src = train.sourceName || train.source || train.origin;
                    const dst = train.destName || train.dest || train.destination;

                    return (
                      <TouchableOpacity
                        key={`${num}-${tIdx}`}
                        style={styles.trainCard}
                        onPress={() => handleSelectTrain(train)}
                        activeOpacity={0.9}
                      >
                        <LinearGradient colors={c.cardGradient} style={styles.trainCardInner}>
                          <View style={styles.trainCardTop}>
                            <View style={styles.trainNumChip}>
                              <Text style={styles.trainNumText}>{num}</Text>
                            </View>
                            <Text style={styles.trainName} numberOfLines={1}>
                              {name}
                            </Text>
                            <View style={styles.trainPulse}>
                              <View style={styles.trainPulseDot} />
                              <Text style={styles.trainPulseText}>LIVE</Text>
                            </View>
                          </View>

                          <View style={styles.trainRouteRow}>
                            <Text style={styles.trainRouteCode}>{src}</Text>
                            <View style={styles.trainRouteTrack}>
                              <View style={styles.trainRouteLine} />
                              <MaterialCommunityIcons
                                name="train"
                                size={13}
                                color={c.emerald}
                                style={styles.trainRouteIcon}
                              />
                              <View style={styles.trainRouteLine} />
                            </View>
                            <Text style={styles.trainRouteCode}>{dst}</Text>
                          </View>

                          <View style={styles.trainCardFooter}>
                            <View style={styles.trainTypeChip}>
                              <Ionicons name="radio-outline" size={11} color={c.textMuted} />
                              <Text style={styles.trainTypeText}>{t.tapLive}</Text>
                            </View>
                            <View style={styles.viewStatusBtn}>
                              <Text style={styles.viewStatusText}>{t.viewStatus}</Text>
                              <Ionicons name="chevron-forward" size={12} color={c.onEmerald} />
                            </View>
                          </View>
                        </LinearGradient>
                      </TouchableOpacity>
                    );
                  })
                )}
              </View>
            </>
          ) : (
            <View>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleWrap}>
                  <View style={styles.sectionAccent} />
                  <Text style={styles.sectionTitle}>
                    {routeSearched ? t.routeResults(routeResults.length) : t.routeHintTitle}
                  </Text>
                </View>
                {isRouteSearching && <ActivityIndicator size="small" color={c.amber} />}
              </View>

              {routeSearched && routeMeta && (
                <View style={styles.routeMetaBar}>
                  <View style={styles.routeMetaBadge}>
                    <Text style={styles.routeMetaCode}>{routeMeta.from?.code || '--'}</Text>
                  </View>
                  <MaterialCommunityIcons
                    name="arrow-right-thin"
                    size={17}
                    color={c.amber}
                    style={{ marginHorizontal: 4 }}
                  />
                  <View style={styles.routeMetaBadge}>
                    <Text style={styles.routeMetaCode}>{routeMeta.to?.code || '--'}</Text>
                  </View>
                  <Text style={styles.routeMetaNames} numberOfLines={1}>
                    {routeMeta.from?.name || ''} → {routeMeta.to?.name || ''}
                  </Text>
                </View>
              )}

              {isRouteSearching && routeResults.length === 0 ? (
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyEmoji}>🚉</Text>
                  <ActivityIndicator size="large" color={c.amber} style={{ marginVertical: 8 }} />
                  <Text style={styles.emptySub}>{t.loadingTrains}</Text>
                </View>
              ) : !routeSearched ? (
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyEmoji}>🧭</Text>
                  <Text style={styles.emptyTitle}>{t.routeHintTitle}</Text>
                  <Text style={styles.emptySub}>{t.routeHintSub}</Text>
                </View>
              ) : routeResults.length === 0 ? (
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyEmoji}>🚉</Text>
                  <Text style={styles.emptyTitle}>{t.noTrainFound}</Text>
                  <Text style={styles.emptySub}>{t.routeResultsEmpty}</Text>
                </View>
              ) : (
                routeResults.map((train, rIdx) => {
                  const trainLabel =
                    lang === 'hi' && train.nameHindi
                      ? train.nameHindi
                      : train.name || `Train ${train.number}`;
                  return (
                    <TouchableOpacity
                      key={`${train.number}-${rIdx}`}
                      style={styles.routeCard}
                      onPress={() => handleSelectTrain(train)}
                      activeOpacity={0.9}
                    >
                      <View style={styles.routeCardTop}>
                        <View style={styles.trainNumChip}>
                          <Text style={styles.trainNumText}>{train.number}</Text>
                        </View>
                        <Text style={styles.routeTrainName} numberOfLines={1}>
                          {trainLabel}
                        </Text>
                        <Ionicons name="chevron-forward" size={16} color={c.amber} />
                      </View>

                      <View style={styles.routeTimingRow}>
                        <View style={styles.routeTimeBlock}>
                          <Text style={styles.routeTimeValue}>{train.departure}</Text>
                          <Text style={styles.routeTimeCode}>{train.routeFrom?.code}</Text>
                        </View>

                        <View style={styles.routeTrackWrap}>
                          <View style={styles.routeTrackLine} />
                          <MaterialCommunityIcons
                            name="train"
                            size={13}
                            color={c.emerald}
                            style={{ marginHorizontal: 6 }}
                          />
                          <View style={styles.routeTrackLine} />
                        </View>

                        <View style={[styles.routeTimeBlock, styles.routeTimeBlockEnd]}>
                          <Text style={styles.routeTimeValue}>{train.arrival}</Text>
                          <Text style={styles.routeTimeCode}>{train.routeTo?.code}</Text>
                        </View>
                      </View>

                      <View style={styles.routeInfoRow}>
                        <View style={styles.routeInfoChip}>
                          <Ionicons name="time-outline" size={11} color={c.textDim} />
                          <Text style={styles.routeInfoText}>
                            {formatJourneyDuration(train.durationMin)}
                          </Text>
                        </View>
                        <View style={styles.routeInfoChip}>
                          <MaterialCommunityIcons
                            name="map-marker-distance"
                            size={11}
                            color={c.textDim}
                          />
                          <Text style={styles.routeInfoText}>{train.distanceKm} km</Text>
                        </View>
                        <View style={styles.routeInfoChip}>
                          <MaterialCommunityIcons name="map-marker" size={11} color={c.textDim} />
                          <Text style={styles.routeInfoText}>
                            {t.haltsBetween(train.haltsBetween)}
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })
              )}
            </View>
          )}
        </ScrollView>

        {/* SLIM COMMAND DOCK */}
        <View style={styles.dockWrap} pointerEvents="box-none">
          <LinearGradient colors={c.dockGradient} style={styles.dockBar}>
            {dockItems.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[styles.dockItem, item.active && styles.dockItemActive]}
                onPress={() => handleDockPress(item.id)}
                activeOpacity={0.8}
              >
                {item.ion ? (
                  <Ionicons
                    name={item.icon}
                    size={17}
                    color={item.active ? c.emerald : c.textDim}
                  />
                ) : (
                  <MaterialCommunityIcons
                    name={item.icon}
                    size={17}
                    color={item.active ? c.emerald : c.textDim}
                  />
                )}
                <Text style={[styles.dockLabel, item.active && styles.dockLabelActive]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </LinearGradient>
        </View>

        <CommandDrawer
          visible={drawerOpen}
          onClose={closeDrawer}
          panel={drawerPanel}
          setPanel={setDrawerPanel}
          note={drawerNote}
          onSelect={handleDrawerSelect}
          onClearRecents={clearRecentSearches}
          onBackHome={onBack}
          styles={styles}
          c={c}
          t={t}
          lang={lang}
          onToggleLang={handleToggleLang}
          themeMode={themeMode}
          onToggleTheme={handleToggleTheme}
        />
      </View>
    );
  }


  // =========================================================================
  // VIEW 2: LIVE STATUS COMMAND VIEW
  // =========================================================================
  const trainNum = selectedTrain.number || selectedTrain.trainNumber || live?.trainNumber || '';
  const trainName =
    lang === 'hi' && live?.trainNameHindi
      ? live.trainNameHindi
      : live?.trainName || selectedTrain.name || selectedTrain.trainName || `Train ${trainNum}`;

  const delayMinutes = live?.delayMin || 0;
  const currentStation = live?.currentStation;
  const isSimulated = !!live?.isOfflineSimulation || live?.isLiveApi === false;

  const headline = lang === 'hi' ? live?.summaryHi : live?.summaryEn;
  const subdetail = lang === 'hi' ? live?.detailHi : live?.detailEn;

  const routeLength = live?.route?.length || 0;
  const currentPos =
    typeof live?.currentStationIndex === 'number' ? live.currentStationIndex : -1;
  const progress = routeLength > 1 && currentPos >= 0 ? currentPos / (routeLength - 1) : 0;
  const hasProgress = routeLength > 1 && currentPos >= 0;
  const currentStationName = currentStation
    ? lang === 'hi'
      ? currentStation.stationHindi || currentStation.stationName
      : currentStation.stationName
    : '';

  return (
    <View style={styles.screen}>
      <StatusBar style={themeMode === 'dark' ? 'light' : 'dark'} />
      <LinearGradient colors={c.bgGradient} style={StyleSheet.absoluteFill} />
      <View pointerEvents="none" style={styles.ambientLayer}>
        <View style={[styles.ambientBlob, styles.ambientBlobA]} />
        <View style={[styles.ambientBlobSmall, styles.ambientBlobB]} />
      </View>

      {/* DETAIL HEADER */}
      <View style={styles.detailHeader}>
        <TouchableOpacity
          style={styles.headerIconBtn}
          onPress={() => {
            setSelectedTrain(null);
            setLive(null);
          }}
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-back" size={21} color={c.text} />
        </TouchableOpacity>

        <View style={styles.detailTitleWrap}>
          <View style={styles.detailTitleRow}>
            <View style={styles.detailNumChip}>
              <Text style={styles.detailNumText}>{trainNum}</Text>
            </View>
            <Text style={styles.detailTitle} numberOfLines={1}>
              {trainName}
            </Text>
          </View>
          <Text style={styles.detailSub} numberOfLines={1}>
            {live?.source || selectedTrain.sourceName || 'Origin'} →{' '}
            {live?.destination || selectedTrain.destName || 'Destination'}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.headerIconBtn}
          onPress={() => loadTrainStatus(trainNum, selectedDateOffset)}
          activeOpacity={0.8}
        >
          <Animated.View
            style={{
              transform: [
                {
                  rotate: refreshAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', '360deg'],
                  }),
                },
              ],
            }}
          >
            <Ionicons name="refresh" size={18} color={c.amber} />
          </Animated.View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.headerIconBtn} onPress={handleShareStatus} activeOpacity={0.8}>
          <Ionicons name="share-social-outline" size={18} color={c.text} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.detailScrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* HONESTY BANNER — never present simulated data as live */}
        {isSimulated && (
          <View style={styles.demoBanner}>
            <Ionicons name="information-circle-outline" size={16} color={c.amber} />
            <Text style={styles.demoBannerText}>{t.demoBanner}</Text>
          </View>
        )}

        {/* DATE SELECTOR */}
        <View style={styles.dateTabs}>
          {[-1, 0, 1].map((offset) => {
            const isSelected = selectedDateOffset === offset;
            const label = offset === -1 ? t.yesterday : offset === 0 ? t.today : t.tomorrow;
            const dateStr = getISTDateLabel(offset, lang);

            return (
              <TouchableOpacity
                key={offset}
                style={[styles.dateTab, isSelected && styles.dateTabActive]}
                onPress={() => {
                  if (selectedDateOffset !== offset) {
                    setSelectedDateOffset(offset);
                    loadTrainStatus(trainNum, offset);
                  }
                }}
                activeOpacity={0.85}
              >
                <Text style={[styles.dateTabTitle, isSelected && styles.dateTabTitleActive]}>
                  {label}
                </Text>
                <Text style={[styles.dateTabSub, isSelected && styles.dateTabSubActive]}>
                  {dateStr}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* TELEMETRY HUD */}
        {isLoadingLive && !live ? (
          <View style={styles.liveLoading}>
            <Text style={styles.emptyEmoji}>🚄</Text>
            <ActivityIndicator size="large" color={c.amber} style={{ marginVertical: 8 }} />
            <Text style={styles.liveLoadingTitle}>{t.connectingSignal}</Text>
            <Text style={styles.liveLoadingSub}>{t.syncingTelemetry}</Text>
          </View>
        ) : (
          <TelemetryHud
            speed={live?.speedKmh || 0}
            delayMin={delayMinutes}
            statusHeadline={headline}
            statusSub={subdetail}
            hornTrigger={hornCount}
            onHonk={() => setHornCount((count) => count + 1)}
            lang={lang}
            currentStationName={currentStationName}
            progress={progress}
            hasProgress={hasProgress}
            speedBasis={live?.speedBasis}
            isSimulated={isSimulated}
            styles={styles}
            c={c}
          />
        )}

        {/* FILTERS + COACH CHIP */}
        <View style={styles.filterRow}>
          <View style={styles.filterSegment}>
            <TouchableOpacity
              style={[styles.filterPill, filterMode === 'halts' && styles.filterPillActive]}
              onPress={() => setFilterMode('halts')}
              activeOpacity={0.85}
            >
              <Text
                style={[styles.filterText, filterMode === 'halts' && styles.filterTextActive]}
              >
                {t.majorHalts(live?.totalHalts || live?.haltsOnly?.length || 0)}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.filterPill, filterMode === 'all' && styles.filterPillActive]}
              onPress={() => setFilterMode('all')}
              activeOpacity={0.85}
            >
              <Text style={[styles.filterText, filterMode === 'all' && styles.filterTextActive]}>
                {t.allStations(live?.allStationsCount || live?.route?.length || 0)}
              </Text>
            </TouchableOpacity>
          </View>

          {live?.coachPosition && (
            <View style={styles.coachChip}>
              <MaterialCommunityIcons name="train-car" size={14} color={c.amber} />
              <Text style={styles.coachChipText}>{t.coachOrder}</Text>
            </View>
          )}
        </View>

        {/* COACH LAYOUT STRIP */}
        {live?.coachPosition && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.coachScroll}
          >
            <View style={styles.coachLoco}>
              <Text style={styles.coachLocoText}>🚂 {t.engine}</Text>
            </View>
            {live.coachPosition.split('-').map((coach, cIdx) => (
              <View key={cIdx} style={styles.coachItem}>
                <View style={styles.coachWindowRow}>
                  <View style={styles.coachWindow} />
                  <View style={styles.coachWindow} />
                </View>
                <Text style={styles.coachItemText}>{coach}</Text>
              </View>
            ))}
          </ScrollView>
        )}

        {/* TIMELINE */}
        <View style={styles.timelineCard}>
          <View style={styles.timelineHeader}>
            <MaterialCommunityIcons name="railroad-light" size={17} color={c.amber} />
            <Text style={styles.timelineTitle}>{t.trackJourney}</Text>
            <View style={styles.timelineSpacer} />
            <Text style={styles.timelineCount}>{timelineItems.length}</Text>
          </View>
          {!!live?.sourceCredit && (
            <Text style={styles.timelineCredit}>{live.sourceCredit}</Text>
          )}

          {timelineItems.map((item, idx) => {
            const { station: st, nonHalts, key } = item;
            const isFirst = idx === 0;
            const isLast = idx === timelineItems.length - 1;

            // timelineItems may be a filtered list (halts only) while
            // currentStationIndex points into the full live.route. Compare
            // positions inside live.route instead of the filtered index,
            // otherwise a second unrelated station also shows as "current".
            const routePos = Array.isArray(live?.route) ? live.route.indexOf(st) : -1;
            const currentIdx =
              typeof live?.currentStationIndex === 'number' ? live.currentStationIndex : -1;

            // The train can be at a non-halting station between two halts. In
            // that case light up the halt whose segment contains the train so
            // the live node never disappears from the track journey.
            const nextHaltPos = routePos + nonHalts.length + 1;
            const isActiveSegment =
              filterMode === 'halts' &&
              currentIdx >= 0 &&
              routePos >= 0 &&
              currentIdx >= routePos &&
              currentIdx < nextHaltPos;

            const exactlyHere =
              !!currentStation &&
              (st === currentStation ||
                (currentIdx >= 0 && routePos === currentIdx) ||
                (currentStation.sequence != null &&
                  st.sequence === currentStation.sequence));
            const isCurrent = isActiveSegment || exactlyHere;

            const isDeparted =
              !isCurrent &&
              (st.status === 'departed' ||
                (currentIdx >= 0 && routePos >= 0 && routePos < currentIdx));

            const isExpanded = !!expandedHalts[key];

            return (
              <React.Fragment key={key}>
                <StationRow
                  station={st}
                  isFirst={isFirst}
                  isLast={isLast && nonHalts.length === 0}
                  isCurrent={isCurrent}
                  isDeparted={isDeparted}
                  pulseAnim={pulseAnim}
                  hasNonHalts={nonHalts.length}
                  isExpanded={isExpanded}
                  onToggle={() => toggleHalt(key)}
                  sectionLive={isActiveSegment && !exactlyHere}
                  lang={lang}
                  styles={styles}
                  c={c}
                />
                {isExpanded &&
                  nonHalts.map((ns) => {
                    const nsPos = Array.isArray(live?.route) ? live.route.indexOf(ns) : -1;
                    const nsCurrent =
                      !!currentStation &&
                      (ns === currentStation ||
                        (currentIdx >= 0 && nsPos === currentIdx) ||
                        (currentStation.sequence != null &&
                          ns.sequence === currentStation.sequence));
                    const nsDeparted =
                      !nsCurrent &&
                      (ns.status === 'departed' ||
                        (currentIdx >= 0 && nsPos >= 0 && nsPos < currentIdx));

                    return (
                      <StationRow
                        key={`pass-${ns.sequence ?? nsPos}-${ns.stationCode}`}
                        station={ns}
                        isFirst={false}
                        isLast={false}
                        isCurrent={nsCurrent}
                        isDeparted={nsDeparted}
                        pulseAnim={pulseAnim}
                        lang={lang}
                        styles={styles}
                        c={c}
                      />
                    );
                  })}
              </React.Fragment>
            );
          })}
        </View>

        {/* CROSSING TRAINS */}
        {crossings.length > 0 && (
          <View style={styles.crossingsWrap}>
            <View style={styles.crossingsHeader}>
              <MaterialCommunityIcons name="alert-decagram" size={19} color={c.rose} />
              <Text style={styles.crossingsTitle}>{t.crossingTrains(crossings.length)}</Text>
            </View>
            <Text style={styles.crossingsSub}>{t.crossingSub}</Text>

            <View style={styles.crossingsList}>
              {crossings.map((item, cIdx) => (
                <CrossingTrainAlert
                  key={cIdx}
                  crossing={item}
                  onPress={() => {
                    if (item.train) handleSelectTrain(item.train);
                  }}
                />
              ))}
            </View>
          </View>
        )}

        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}
