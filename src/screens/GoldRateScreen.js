import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Animated,
  Easing,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../theme/colors';
import ScreenHeader from '../components/ScreenHeader';

// ---- Live prices: IBJA on native, gold-api.com on web ----
// IBJA (India Bullion & Jewellers Association) publishes India's official daily
// benchmark gold/silver rates — the benchmark bullion dealers (like the
// Brijwasi-style Kanpur shops) price off. We read it via the free, open-source
// IBJA-API mirror on Vercel (no key). IBJA is ALREADY an INR Indian benchmark,
// so we only add each city's small local difference (haldi) on top.
//   gold  → GET /latest        : per 10 grams (lblGold999_AM / lblGold999_PM)
//   silver→ GET /silver/latest  : per 1 kg (lblSilver999_AM / lblSilver999_PM)
// The IBJA mirror sends no CORS headers, so a desktop browser (Expo web preview)
// cannot fetch it directly. Native (Android/iOS) has no CORS, so it uses IBJA.
// On web we fall back to gold-api.com (international spot, CORS-enabled) lifted
// to Indian retail with the base premium, so the preview still shows a live rate.
const IBJA_BASE = 'https://ibja-api.vercel.app';
const GOLD_API_BASE = 'https://api.gold-api.com/price';
const TROY_OZ_GRAMS = 31.1035;
const CACHE_KEY = '@gold_rates_cache';
// IBJA fixes rates only twice a day (AM/PM), so a slower auto-refresh is plenty
// and kinder to the free mirror.
const REFRESH_INTERVAL_MS = 5 * 60000; // 5 min auto refresh

// Which source is active on this platform. Native → IBJA (real Indian benchmark);
// web preview → gold-api.com (CORS-friendly fallback).
const USE_IBJA = Platform.OS !== 'web';

// Only applied on the gold-api.com fallback path: lifts the international spot to
// Indian retail (import duty + taxes). IBJA is already Indian, so it uses 0.
const INDIA_GOLD_PREMIUM_PCT = 15.6;
const INDIA_SILVER_PREMIUM_PCT = 19.2;
// Effective base premium for the active source (IBJA → 0, gold-api → India lift).
const GOLD_BASE_PREMIUM_PCT = USE_IBJA ? 0 : INDIA_GOLD_PREMIUM_PCT;
const SILVER_BASE_PREMIUM_PCT = USE_IBJA ? 0 : INDIA_SILVER_PREMIUM_PCT;

// Default GST on gold jewellery (levied on gold value + making charges).
// Shown in an editable field, so the user can override for future rate changes.


// Carats offered on a jeweller's rate board. Each has its own manual ₹/gram rate
// because every shop quotes its own 24K / 22K / 20K / 18K price.
const KARAT_OPTIONS = [18, 20, 22, 24];

// Full retail multiplier for a city = India base premium × city's local markup.
const cityMultiplier = (city, basePct) =>
  (1 + basePct / 100) * (1 + city.haldi / 100);

const CITIES = [
  { name: 'Kanpur', haldi: 0.85 },
  { name: 'Delhi', haldi: 0.80 },
  { name: 'Mumbai', haldi: 0.70 },
  { name: 'Lucknow', haldi: 0.90 },
  { name: 'Jaipur', haldi: 0.95 },
  { name: 'Chennai', haldi: 0.60 },
  { name: 'Kolkata', haldi: 0.75 },
];

const formatRupee = (num) => '₹' + Math.round(num).toLocaleString('en-IN');

// Same but keeps paise — milligram-level weights give fractional rupees.
const formatMoney = (num) =>
  '₹' +
  (Math.round(num * 100) / 100).toLocaleString('en-IN', { maximumFractionDigits: 2 });

// The two linked making fields store their derived value as editable text, so
// round it once and keep it stable (re-deriving a rounded figure must not creep).
const round2 = (n) => (Math.round(n * 100) / 100).toString();

// Weight is always typed in grams; anything under 1 g reads better in milligrams,
// so the unit is derived from the number instead of being toggled by the user.
const weightUnit = (grams) => (grams > 0 && grams < 1 ? 'मि.ग्रा' : 'ग्राम');

const formatWeight = (grams) => {
  if (!(grams > 0)) return 'ग्राम';
  if (grams < 1) {
    // keep 2 decimals in mg so tiny weights (0.0004 g = 0.4 mg) don't round to 0
    const mg = Math.round(grams * 100000) / 100;
    return `${mg.toLocaleString('en-IN', { maximumFractionDigits: 2 })} ${weightUnit(grams)}`;
  }
  return `${(Math.round(grams * 1000) / 1000).toLocaleString('en-IN')} ${weightUnit(grams)}`;
};

const timeAgoText = (isoString) => {
  if (!isoString) return '';
  const secs = Math.max(Math.round((Date.now() - new Date(isoString).getTime()) / 1000), 0);
  if (secs < 60) return 'abhi';
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins} मिनट पहले`;
  const hrs = Math.floor(mins / 60);
  return `${hrs} घंटे पहले`;
};

export default function GoldRateScreen({ onBack }) {
  const [rates, setRates] = useState(null); // { goldPerGram, silverPerGram, updatedAt }
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [change, setChange] = useState('flat'); // up | down | flat
  const [selectedCity, setSelectedCity] = useState(CITIES[0]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [metal, setMetal] = useState('gold'); // 'gold' | 'silver'

  // ---- jewellery bill estimator (gold tab only) ----
  const [jewelKarat, setJewelKarat] = useState(18);
  const [rateByKarat, setRateByKarat] = useState({}); // manual ₹/gram per carat
  const [jewelWt, setJewelWt] = useState(''); // grams
  // Shops quote making either as "% on gold value" or as "₹2,250.00 Wt" (per
  // gram). Both are the same charge at the shop's rate, so only the typed figure
  // is stored and the other unit is back-solved at render time — that also keeps
  // both fields aligned when the rate or the carat changes underneath them.
  const [makingSrc, setMakingSrc] = useState('pct'); // 'pct' | 'perGram'
  const [makingInput, setMakingInput] = useState('');
  const [gstVal, setGstVal] = useState('');
  // add/remove karne wali ₹ lines (पत्थर, मोती, हॉलमार्क, कुछ भी)
  const [otherCharges, setOtherCharges] = useState([]); // [{ id, amount }]
  const otherChargeIdRef = useRef(1);

  const addOtherCharge = () => {
    setOtherCharges((prev) => [
      ...prev,
      { id: otherChargeIdRef.current++, amount: '' },
    ]);
  };

  const updateOtherCharge = (id, field, text) => {
    setOtherCharges((prev) =>
      prev.map((c) => (c.id === id ? { ...c, [field]: text } : c)),
    );
  };

  const removeOtherCharge = (id) => {
    setOtherCharges((prev) => prev.filter((c) => c.id !== id));
  };

  // ---- 10-gram rate → per-gram converter ----
  // value is stored per metal so switching gold↔silver doesn't carry the other
  // metal's typed figure over (each tab keeps its own 10-gram rate).
  const [tenRateByMetal, setTenRateByMetal] = useState({ gold: '', silver: '' });
  const [convOpen, setConvOpen] = useState(false); // accordion stays closed by default
  const [convBodyH, setConvBodyH] = useState(0); // measured height that the animation grows to
  const [convAnim] = useState(() => new Animated.Value(0));

  const prevGoldRef = useRef(null);
  const mountedRef = useRef(true);

  const fetchRates = useCallback(async () => {
    try {
      let goldPerGram;
      let silverPerGram;

      if (USE_IBJA) {
        // Native: real Indian benchmark from IBJA. It quotes gold per 10 g and
        // silver per 1 kg; the app works in ₹/gram. Prefer the PM (closing)
        // fixing, fall back to the AM (opening) one.
        const [goldRes, silverRes] = await Promise.all([
          fetch(`${IBJA_BASE}/latest`),
          fetch(`${IBJA_BASE}/silver/latest`),
        ]);
        if (!goldRes.ok || !silverRes.ok) throw new Error('IBJA error');
        const gold = await goldRes.json();
        const silver = await silverRes.json();
        const gold999Per10g = parseFloat(gold.lblGold999_PM ?? gold.lblGold999_AM);
        const silver999PerKg = parseFloat(silver.lblSilver999_PM ?? silver.lblSilver999_AM);
        if (!Number.isFinite(gold999Per10g) || !Number.isFinite(silver999PerKg)) {
          throw new Error('IBJA parse error');
        }
        goldPerGram = gold999Per10g / 10;
        silverPerGram = silver999PerKg / 1000;
      } else {
        // Web preview: gold-api.com international spot (CORS-enabled), converted
        // USD→INR and Troy oz→gram. India base premium is applied downstream.
        const [goldRes, silverRes, fxRes] = await Promise.all([
          fetch(`${GOLD_API_BASE}/XAU`),
          fetch(`${GOLD_API_BASE}/XAG`),
          fetch('https://api.frankfurter.app/latest?from=USD&to=INR'),
        ]);
        if (!goldRes.ok || !silverRes.ok || !fxRes.ok) throw new Error('API error');
        const gold = await goldRes.json();
        const silver = await silverRes.json();
        const fx = await fxRes.json();
        const usdInr = fx.rates?.INR;
        const goldUsdPerOz = gold.price;
        const silverUsdPerOz = silver.price;
        if (!Number.isFinite(goldUsdPerOz) || !Number.isFinite(silverUsdPerOz) || !Number.isFinite(usdInr)) {
          throw new Error('parse error');
        }
        goldPerGram = (goldUsdPerOz / TROY_OZ_GRAMS) * usdInr;
        silverPerGram = (silverUsdPerOz / TROY_OZ_GRAMS) * usdInr;
      }

      if (!mountedRef.current) return;

      // Compare with previous fetch to show ▲ / ▼ tick
      if (prevGoldRef.current != null) {
        if (goldPerGram > prevGoldRef.current * 1.0002) setChange('up');
        else if (goldPerGram < prevGoldRef.current * 0.9998) setChange('down');
        else setChange('flat');
      }
      prevGoldRef.current = goldPerGram;

      const data = {
        goldPerGram,
        silverPerGram,
        updatedAt: new Date().toISOString(),
      };
      setRates(data);
      setError(null);
      setLoading(false);
      setRefreshing(false);
      AsyncStorage.setItem(CACHE_KEY, JSON.stringify(data)).catch(() => { });
    } catch {
      if (mountedRef.current) {
        setError('इंटरनेट कनेक्शन चेक करें');
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  // Manual refresh: flag spinner then fetch (setState happens off the effect path)
  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchRates();
  }, [fetchRates]);

  // Load cached rates instantly on open (offline still shows last prices)
  useEffect(() => {
    mountedRef.current = true;
    (async () => {
      try {
        const cached = await AsyncStorage.getItem(CACHE_KEY);
        if (cached && mountedRef.current) {
          const parsed = JSON.parse(cached);
          setRates(parsed);
          prevGoldRef.current = parsed.goldPerGram;
        }
      } catch {
        // ignore corrupt cache
      }
    })();
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // First fetch + auto refresh every minute while screen is open
  useEffect(() => {
    // Defer initial fetch into a callback (keeps setState off the effect's
    // synchronous path); auto-refresh reuses the manual handler.
    const kick = setTimeout(fetchRates, 0);
    const timer = setInterval(handleRefresh, REFRESH_INTERVAL_MS);
    return () => {
      clearTimeout(kick);
      clearInterval(timer);
    };
  }, [fetchRates, handleRefresh]);

  // ---- derived city rates (global spot -> Indian retail via premium) ----
  const goldMult = cityMultiplier(selectedCity, GOLD_BASE_PREMIUM_PCT);
  const silverMult = cityMultiplier(selectedCity, SILVER_BASE_PREMIUM_PCT);
  const gold24 = rates ? rates.goldPerGram * goldMult : 0;
  const gold22 = gold24 * (22 / 24);
  const gold18 = gold24 * (18 / 24);
  const gold14 = gold24 * (14 / 24);
  const silverRate = rates ? rates.silverPerGram * silverMult : 0;

  const isGold = metal === 'gold';
  // Hero big number: gold shows the 10-gram rate, silver shows 1 किलो.
  const heroMain = isGold ? gold24 * 10 : silverRate * 1000;
  const heroTitle = isGold ? '24K सोना · 10 ग्राम' : 'चांदी 999 · 1 किलो';
  const heroStats = isGold
    ? [{ k: '22K /ग्राम', v: gold22 }, { k: '18K /ग्राम', v: gold18 }, { k: '14K /ग्राम', v: gold14 }]
    : [{ k: '1 ग्राम', v: silverRate }, { k: '10 ग्राम', v: silverRate * 10 }, { k: '100 ग्राम', v: silverRate * 100 }];

  // stable ko white rakha hai — muted slate hero ke amber bg par visible nahi tha
  const changeColor = change === 'up' ? Colors.success : change === 'down' ? Colors.danger : Colors.text;
  const changeIcon = change === 'up' ? 'trending-up' : change === 'down' ? 'trending-down' : 'remove';

  // ---- jewellery bill, the way a shopkeeper works it out ----
  // shop's own ₹/gram for the chosen carat (manual), else today's live rate
  const liveKaratRate = gold24 * (jewelKarat / 24);
  const manualRateRaw = rateByKarat[jewelKarat];
  const manualRate = parseFloat(manualRateRaw);
  const hasManualRate =
    manualRateRaw !== undefined && manualRateRaw !== '' && manualRate > 0;
  const karatRate = hasManualRate ? manualRate : liveKaratRate;

  // weight typed in grams (small figures auto-display as milligrams)
  const jewelWeight = parseFloat(jewelWt) || 0;

  const goldValue = karatRate * jewelWeight;

  // ---- making charge: % and ₹/ग्राम are two faces of the same number ----
  // Whatever was typed is the source; the other unit is solved through the
  // shop's ₹/gram rate. So "19% making" and "₹2,250 प्रति ग्राम" land on one total,
  // and a per-gram quote instantly reveals what % of the भाव it really is.
  const makingTyped = parseFloat(makingInput) || 0;
  const makingRatePerGram =
    makingSrc === 'pct' ? (karatRate * makingTyped) / 100 : makingTyped;
  const makingPctEquiv = karatRate > 0 ? (makingRatePerGram / karatRate) * 100 : 0;
  // bills always run making on the total weight ("2250.00 Wt" → × 3.523)
  const makingAmount = makingRatePerGram * jewelWeight;

  // each field shows its own typed text, or the derived figure when it was the
  // other field that got filled (empty rate/carats → nothing to derive from yet)
  const canDerive = karatRate > 0 && makingTyped > 0;

  const gstInput = parseFloat(gstVal) || 0;
  // only the charges that actually have an ₹ figure count toward the bill
  const chargedOtherRows = otherCharges
    .map((c) => ({ ...c, value: parseFloat(c.amount) || 0 }))
    .filter((c) => c.value > 0);
  const otherChargesTotal = chargedOtherRows.reduce((sum, c) => sum + c.value, 0);
  const billSubtotal = goldValue + makingAmount + otherChargesTotal;
  const gstAmount = (billSubtotal * gstInput) / 100;
  const billTotal = billSubtotal + gstAmount;
  // What the customer effectively pays per gram — the number shops quote as "भावर".
  const effectivePerGram = jewelWeight > 0 ? billTotal / jewelWeight : 0;

  // Making line on the bill: rate, its % of the shop's भाव, and the weight it ran
  // on — the three numbers a "2250.00 Wt" invoice column actually stands for.
  const makingBillLabel = `मेकिंग · ${formatRupee(makingRatePerGram)}/ग्राम (${round2(makingPctEquiv)}%) × ${formatWeight(jewelWeight)}`;

  // ---- 10-gram rate splitter ----
  // Newspapers & rate boards quote gold as a 10-gram figure; split it to per gram.
  const live10gRate = isGold ? gold24 * 10 : silverRate * 10;
  const tenRate = tenRateByMetal[metal];
  const tenRateInput = parseFloat(tenRate) || 0;
  const perGramSplit = tenRateInput / 10;

  // ---- converter accordion: one Animated.Value drives height, fade + chevron ----
  const convHeight = convAnim.interpolate({ inputRange: [0, 1], outputRange: [0, convBodyH] });
  const convFade = convAnim.interpolate({ inputRange: [0, 0.6, 1], outputRange: [0, 0, 1] });
  const chevronRotate = convAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  const toggleConverter = useCallback(() => {
    const next = !convOpen;
    setConvOpen(next);
    Animated.timing(convAnim, {
      toValue: next ? 1 : 0,
      duration: 300,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: false, // height can't be animated on the native driver
    }).start();
  }, [convAnim, convOpen]);

  // result rows appear while typing, so re-measure and stay pinned open
  const handleConvBodyLayout = useCallback(
    (e) => {
      setConvBodyH(e.nativeEvent.layout.height);
      if (convOpen) convAnim.setValue(1);
    },
    [convAnim, convOpen],
  );

  return (
    <View style={styles.container}>
      {/* Fixed Header with subtle shadow fade */}
      <ScreenHeader
        title="Live Gold-Silver Rates"
        subtitle="सोना-चांदी का लाइव भाव · प्रति ग्राम दाम"
        icon="cash"
        onBack={onBack}
        onReset={handleRefresh}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Status row: LIVE dot + last updated + city dropdown selector */}
        <View style={styles.statusRow}>
          <View style={styles.livePill}>
            {refreshing ? (
              <ActivityIndicator size="small" color={Colors.success} style={styles.liveSpinner} />
            ) : (
              <View style={styles.liveDot} />
            )}
            {rates && (
              <Text style={styles.updatedText}>{timeAgoText(rates.updatedAt)}</Text>
            )}
          </View>

          <TouchableOpacity
            style={styles.citySelectBtn}
            onPress={() => setDropdownOpen((o) => !o)}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="map-marker-outline" size={16} color={Colors.amber} />
            <Text style={styles.citySelectText}>{selectedCity.name}</Text>
            <Ionicons
              name={dropdownOpen ? 'chevron-up' : 'chevron-down'}
              size={16}
              color={Colors.amber}
              style={{ fontWeight: '800' }}
            />
          </TouchableOpacity>
        </View>

        {/* City dropdown list */}
        {dropdownOpen && (
          <View style={styles.dropdown}>
            {CITIES.map((city) => {
              const isSelected = city.name === selectedCity.name;
              return (
                <TouchableOpacity
                  key={city.name}
                  style={styles.dropdownItem}
                  onPress={() => {
                    setSelectedCity(city);
                    setDropdownOpen(false);
                  }}
                  activeOpacity={0.8}
                >
                  {isSelected ? (
                    <LinearGradient
                      colors={Colors.gradientColors}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.dropdownSelectedBg}
                    >
                      <Text style={styles.dropdownSelectedText}>{city.name}</Text>
                    </LinearGradient>
                  ) : (
                    <Text style={styles.dropdownItemText}>{city.name}</Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Loading state (first fetch, no cache) */}
        {loading && !rates && (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color={Colors.amber} />
            <Text style={styles.loadingText}>लाइव भाव लोड हो रहे हैं...</Text>
          </View>
        )}

        {/* Network error notice */}
        {error && rates && (
          <View style={styles.errorBanner}>
            <Ionicons name="cloud-offline-outline" size={16} color="#FCA5A5" />
            <Text style={styles.errorBannerText}>
              {error} · आखिरी भाव दिखाए जा रहे हैं
            </Text>
          </View>
        )}
        {error && !rates && !loading && (
          <View style={styles.centerBox}>
            <Ionicons name="cloud-offline-outline" size={42} color={Colors.textDim} />
            <Text style={styles.loadingText}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={() => fetchRates()} activeOpacity={0.8}>
              <Ionicons name="refresh" size={16} color="#FFFFFF" />
              <Text style={styles.retryText}>फिर से कोशिश करें</Text>
            </TouchableOpacity>
          </View>
        )}

        {rates && (
          <>
            {/* Gold / Silver toggle */}
            <View style={styles.metalToggle}>
              {[
                { id: 'gold', label: 'सोना · Gold', icon: 'gold' },
                { id: 'silver', label: 'चांदी · Silver', icon: 'cube-outline' },
              ].map((m) => {
                const active = metal === m.id;
                return (
                  <TouchableOpacity
                    key={m.id}
                    style={styles.metalToggleBtn}
                    onPress={() => setMetal(m.id)}
                    activeOpacity={0.85}
                  >
                    {active ? (
                      <LinearGradient
                        colors={m.id === 'gold' ? ['#F59E0B', '#EA580C'] : ['#94A3B8', '#64748B']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.metalToggleActiveBg}
                      >
                        <MaterialCommunityIcons name={m.icon} size={18} color="#FFFFFF" />
                        <Text style={styles.metalToggleTextActive}>{m.label}</Text>
                      </LinearGradient>
                    ) : (
                      <View style={styles.metalToggleIdle}>
                        <MaterialCommunityIcons name={m.icon} size={18} color={Colors.textDim} />
                        <Text style={styles.metalToggleTextIdle}>{m.label}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Hero card — big rate for selected metal + city */}
            <View style={styles.heroCard}>
              <LinearGradient
                colors={isGold ? ['#7C2D12', '#B45309', '#F59E0B'] : ['#0F172A', '#334155', '#94A3B8']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              <MaterialCommunityIcons
                name={isGold ? 'gold' : 'cube-outline'}
                size={130}
                color="rgba(255,255,255,0.08)"
                style={styles.heroWatermark}
              />

              <View style={styles.heroTopRow}>
                <Text style={styles.heroCityLabel}>{heroTitle}</Text>
                <View style={[styles.tickPill, { backgroundColor: changeColor + '33' }]}>
                  <Ionicons name={changeIcon} size={14} color={changeColor} />
                  <Text style={[styles.tickText, { color: changeColor }]}>
                    {change === 'up' ? 'उछाल' : change === 'down' ? 'गिरावट' : 'Stable'}
                  </Text>
                </View>
              </View>

              <Text style={styles.heroMain}>{formatRupee(heroMain)}</Text>

              <View style={styles.heroDivider} />

              <View style={styles.heroStatsRow}>
                {heroStats.map((s) => (
                  <View key={s.k} style={styles.heroStat}>
                    <Text style={styles.statLabel}>{s.k}</Text>
                    <Text style={styles.statVal}>{formatRupee(s.v)}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* ---------- 10 gram → 1 gram rate converter ---------- */}
            <View style={styles.calcCard}>
              {/* header stays visible; tap it to expand / collapse */}
              <TouchableOpacity
                style={styles.accHeadRow}
                activeOpacity={0.75}
                onPress={toggleConverter}
              >
                <MaterialCommunityIcons
                  name="scale-balance"
                  size={22}
                  color={isGold ? Colors.amber : Colors.textMuted}
                />
                <Text style={[styles.calcTitle, styles.accTitle]}>
                  10 ग्राम का भाव → 1 ग्राम का भाव
                </Text>
                <Animated.View
                  style={[styles.accChevronBox, { transform: [{ rotate: chevronRotate }] }]}
                >
                  <Ionicons name="chevron-down" size={17} color={Colors.amber} />
                </Animated.View>
              </TouchableOpacity>

              <Animated.View
                pointerEvents={convOpen ? 'auto' : 'none'}
                style={[styles.accBody, { height: convHeight, opacity: convFade }]}
              >
                <View style={styles.accBodyInner} onLayout={handleConvBodyLayout}>
                  <Text style={styles.calcLabel}>10 ग्राम का भाव (₹)</Text>
                  <View style={styles.calcPrefixWrap}>
                    <Text style={styles.calcPrefix}>₹</Text>
                    <TextInput
                      style={styles.calcInputBare}
                      value={tenRate}
                      onChangeText={(t) =>
                        setTenRateByMetal((prev) => ({ ...prev, [metal]: t }))
                      }
                      keyboardType="decimal-pad"
                      placeholder={rates ? formatRupee(live10gRate) : '—'}
                      placeholderTextColor={Colors.placeholderHint}
                    />
                  </View>

                  {perGramSplit > 0 && (
                    <>
                      <View style={styles.convRows}>
                        <View style={styles.convHeroRow}>
                          <Text style={styles.convHeroLabel}>1 ग्राम का भाव</Text>
                          <Text style={styles.convHeroValue}>{formatMoney(perGramSplit)}</Text>
                        </View>
                        <View style={styles.billLine}>
                          <Text style={styles.billLineLabel}>1 मिलीग्राम</Text>
                          <Text style={styles.billLineValue}>
                            {formatMoney(perGramSplit / 1000)}
                          </Text>
                        </View>
                        <View style={styles.billLine}>
                          <Text style={styles.billLineLabel}>1 किलो</Text>
                          <Text style={styles.billLineValue}>
                            {formatRupee(perGramSplit * 1000)}
                          </Text>
                        </View>
                      </View>
                    </>
                  )}
                </View>
              </Animated.View>
            </View>

            {/* ---------- jewellery bill estimator (gold tab) ---------- */}
            {isGold && (
              <View style={styles.calcCard}>
                <View style={styles.calcHeadRow}>
                  <MaterialCommunityIcons name="gold" size={22} color={Colors.amber} />
                  <Text style={styles.calcTitle}>Gold Price Calculator</Text>
                </View>

                <Text style={styles.calcLabel}>Purity (शुद्धता)</Text>
                <View style={styles.segRow}>
                  {KARAT_OPTIONS.map((c) => (
                    <TouchableOpacity
                      key={c}
                      style={[styles.segBtn, jewelKarat === c && styles.segBtnActive]}
                      activeOpacity={0.85}
                      onPress={() => setJewelKarat(c)}
                    >
                      <Text style={[styles.segText, jewelKarat === c && styles.segTextActive]}>
                        {c}K
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.calcLabel}>Gold Price (₹/ग्राम)</Text>
                <View style={styles.calcPrefixWrap}>
                  <Text style={styles.calcPrefix}>₹</Text>
                  <TextInput
                    style={styles.calcInputBare}
                    value={rateByKarat[jewelKarat] ?? ''}
                    onChangeText={(t) =>
                      setRateByKarat((prev) => ({ ...prev, [jewelKarat]: t }))
                    }
                    keyboardType="decimal-pad"
                    placeholder={rates ? formatRupee(liveKaratRate) : '—'}
                    placeholderTextColor={Colors.placeholderHint}
                  />
                  <Text style={styles.calcUnitSuffix}>{jewelKarat}K</Text>
                </View>

                <Text style={styles.calcLabel}>Gold ka Weight</Text>
                <View style={styles.calcPrefixWrap}>
                  <TextInput
                    style={[styles.calcInputBare, { paddingLeft: 12 }]}
                    value={jewelWt}
                    onChangeText={setJewelWt}
                    keyboardType="decimal-pad"
                    placeholder="जैसे: 10 या 0.523"
                    placeholderTextColor={Colors.placeholderHint}
                  />
                  {/* unit picks itself from the entered weight */}
                  <Text style={styles.unitAutoText}>{weightUnit(jewelWeight)}</Text>
                </View>

                <Text style={styles.calcLabel}>मेकिंग चार्ज</Text>

                {/* Folder-tab unified container matching screenshot */}
                <View style={styles.makingFolderCard}>
                  {/* Folder Tab Header Bar */}
                  <View style={styles.folderTabBar}>
                    <TouchableOpacity
                      style={[
                        styles.folderTab,
                        makingSrc === 'pct'
                          ? styles.folderTabActiveLeft
                          : styles.folderTabInactive,
                      ]}
                      activeOpacity={0.85}
                      onPress={() => {
                        if (canDerive) {
                          setMakingInput(round2(makingPctEquiv));
                        }
                        setMakingSrc('pct');
                      }}
                    >
                      <Text
                        style={[
                          styles.folderTabText,
                          makingSrc === 'pct' && styles.folderTabTextActive,
                        ]}
                      >
                        प्रतिशत (%)
                      </Text>
                      {makingSrc === 'pct' && (
                        <View style={styles.folderTabIndicator} />
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.folderTab,
                        makingSrc === 'perGram'
                          ? styles.folderTabActiveRight
                          : styles.folderTabInactive,
                      ]}
                      activeOpacity={0.85}
                      onPress={() => {
                        if (canDerive) {
                          setMakingInput(round2(makingRatePerGram));
                        }
                        setMakingSrc('perGram');
                      }}
                    >
                      <Text
                        style={[
                          styles.folderTabText,
                          makingSrc === 'perGram' && styles.folderTabTextActive,
                        ]}
                      >
                        ₹ प्रति ग्राम
                      </Text>
                      {makingSrc === 'perGram' && (
                        <View style={styles.folderTabIndicator} />
                      )}
                    </TouchableOpacity>
                  </View>

                  {/* Connected Input Body */}
                  <View style={styles.folderTabBody}>
                    <View style={styles.folderInputRow}>
                      <Text style={styles.calcPrefix}>
                        {makingSrc === 'pct' ? '%' : '₹'}
                      </Text>
                      <TextInput
                        style={styles.calcInputBare}
                        value={makingInput}
                        onChangeText={setMakingInput}
                        keyboardType="decimal-pad"
                        placeholder="0"
                        placeholderTextColor={Colors.placeholderHint}
                      />
                      {makingSrc === 'perGram' && (
                        <Text style={styles.calcUnitSuffix}>/ग्राम</Text>
                      )}
                    </View>

                    {canDerive && (
                      <View style={styles.folderFooter}>
                        <View style={styles.folderDivider} />
                        <View style={styles.folderFooterContent}>
                          <Ionicons
                            name="information-circle-outline"
                            size={15}
                            color={Colors.amber}
                          />
                          <Text style={styles.folderFooterText}>
                            {makingSrc === 'pct'
                              ? `${makingTyped}% = ${formatRupee(makingRatePerGram)}/ग्राम के बराबर`
                              : `${formatRupee(makingRatePerGram)}/ग्राम = ${round2(makingPctEquiv)}% मेकिंग`}
                            {jewelWeight > 0 ? ` (कुल: ${formatRupee(makingAmount)})` : ''}
                          </Text>
                        </View>
                      </View>
                    )}
                  </View>
                </View>

                <Text style={styles.calcLabel}>GST (%) — ज़रूरत हो तो बदलें</Text>
                <View style={styles.calcPrefixWrap}>
                  <Text style={styles.calcPrefix}>%</Text>
                  <TextInput
                    style={styles.calcInputBare}
                    value={gstVal}
                    onChangeText={setGstVal}
                    keyboardType="decimal-pad"
                    placeholder="0"
                    placeholderTextColor={Colors.placeholderHint}
                  />
                  <Text style={styles.calcUnitSuffix}>0 = बिना GST</Text>
                </View>

                {/* Other Charges — sirf amount field + remove button */}
                {otherCharges.map((charge) => (
                  <View key={charge.id} style={styles.chargeRow}>
                    <View style={styles.chargeAmountWrap}>
                      <Text style={styles.calcPrefix}>₹</Text>
                      <TextInput
                        style={styles.chargeAmountInput}
                        value={charge.amount}
                        onChangeText={(t) => updateOtherCharge(charge.id, 'amount', t)}
                        keyboardType="decimal-pad"
                        placeholder="अन्य चार्ज का दाम"
                        placeholderTextColor={Colors.placeholderHint}
                      />
                    </View>
                    <TouchableOpacity
                      style={styles.chargeRemoveBtn}
                      activeOpacity={0.85}
                      onPress={() => removeOtherCharge(charge.id)}
                    >
                      <Ionicons name="close" size={15} color="#FCA5A5" />
                    </TouchableOpacity>
                  </View>
                ))}

                <TouchableOpacity
                  style={styles.addChargeBtn}
                  activeOpacity={0.85}
                  onPress={addOtherCharge}
                >
                  <Ionicons name="add" size={16} color={Colors.amber} />
                  <Text style={styles.addChargeBtnText}>Other Charges</Text>
                </TouchableOpacity>

                {jewelWeight > 0 && billTotal > 0 ? (
                  <View style={styles.billCard}>
                    <View style={styles.billBreakdown}>
                      <View style={styles.billLine}>
                        <Text style={styles.billLineLabel}>
                          सोने का भाव ({jewelKarat}K × {formatWeight(jewelWeight)})
                        </Text>
                        <Text style={styles.billLineValue}>{formatRupee(goldValue)}</Text>
                      </View>
                      {makingAmount > 0 && (
                        <View style={styles.billLine}>
                          <Text style={styles.billLineLabel}>{makingBillLabel}</Text>
                          <Text style={styles.billLineValue}>{formatRupee(makingAmount)}</Text>
                        </View>
                      )}
                      {chargedOtherRows.map((c, i) => (
                        <View key={c.id} style={styles.billLine}>
                          <Text style={styles.billLineLabel}>
                            {chargedOtherRows.length > 1 ? `अन्य चार्ज ${i + 1}` : 'अन्य चार्ज'}
                          </Text>
                          <Text style={styles.billLineValue}>{formatRupee(c.value)}</Text>
                        </View>
                      ))}
                      {gstAmount > 0 && (
                        <View style={styles.billLine}>
                          <Text style={styles.billLineLabel}>GST ({gstInput}%)</Text>
                          <Text style={styles.billLineValue}>{formatRupee(gstAmount)}</Text>
                        </View>
                      )}
                    </View>

                    <View style={styles.billDivider} />

                    <View style={styles.billTotalRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.billTotalLabel}>कुल देना होगा</Text>
                        <Text style={styles.billEffective}>
                          असरदार भाव · {formatRupee(effectivePerGram)} /ग्राम
                        </Text>
                      </View>
                      <Text style={styles.billTotalValue}>{formatRupee(billTotal)}</Text>
                    </View>
                  </View>
                ) : (
                  <Text style={styles.calcHintSmall}>
                    वज़न डालें — आज के भाव पर पूरा हिसाब दिखेगा।
                  </Text>
                )}
              </View>
            )}

            {/* ---------- silver bill estimator (silver tab) ---------- */}
            {!isGold && <SilverPriceCalculator liveRatePerGram={silverRate} />}
          </>
        )}
      </ScrollView>
    </View>
  );
}

// ---- silver bill estimator (silver tab) ----
// Silver doesn't trade in carats — shops stamp purity as 999 (चांदी), 970,
// 925 (sterling) or 800, so the same भाव × वज़न + मेकिंग + अन्य चार्ज + GST
// maths runs on a per-gram rate scaled by purity/1000 instead of karat/24.
const SILVER_PURITY_OPTIONS = [999, 970, 925, 800];

function SilverPriceCalculator({ liveRatePerGram }) {
  const [purity, setPurity] = useState(999);
  const [rateByPurity, setRateByPurity] = useState({}); // manual ₹/gram per purity
  const [wt, setWt] = useState(''); // grams
  const [makingSrc, setMakingSrc] = useState('pct'); // 'pct' | 'perGram'
  const [makingInput, setMakingInput] = useState('');
  const [gstVal, setGstVal] = useState('');
  // add/remove karne wali ₹ lines (पत्थर, मोती, हॉलमार्क, कुछ भी)
  const [otherCharges, setOtherCharges] = useState([]); // [{ id, amount }]
  const otherChargeIdRef = useRef(1);

  const addOtherCharge = () => {
    setOtherCharges((prev) => [
      ...prev,
      { id: otherChargeIdRef.current++, amount: '' },
    ]);
  };

  const updateOtherCharge = (id, field, text) => {
    setOtherCharges((prev) =>
      prev.map((c) => (c.id === id ? { ...c, [field]: text } : c)),
    );
  };

  const removeOtherCharge = (id) => {
    setOtherCharges((prev) => prev.filter((c) => c.id !== id));
  };

  // shop's own ₹/gram for the chosen purity (manual), else today's live rate
  const livePurityRate = liveRatePerGram * (purity / 1000);
  const manualRateRaw = rateByPurity[purity];
  const manualRate = parseFloat(manualRateRaw);
  const hasManualRate =
    manualRateRaw !== undefined && manualRateRaw !== '' && manualRate > 0;
  const purityRate = hasManualRate ? manualRate : livePurityRate;

  const weight = parseFloat(wt) || 0;
  const silverValue = purityRate * weight;

  // making: % and ₹/ग्राम remain two faces of the same number (gold का rule)
  const makingTyped = parseFloat(makingInput) || 0;
  const makingRatePerGram =
    makingSrc === 'pct' ? (purityRate * makingTyped) / 100 : makingTyped;
  const makingPctEquiv = purityRate > 0 ? (makingRatePerGram / purityRate) * 100 : 0;
  const makingAmount = makingRatePerGram * weight;
  const canDerive = purityRate > 0 && makingTyped > 0;

  const gstInput = parseFloat(gstVal) || 0;
  const chargedOtherRows = otherCharges
    .map((c) => ({ ...c, value: parseFloat(c.amount) || 0 }))
    .filter((c) => c.value > 0);
  const otherChargesTotal = chargedOtherRows.reduce((sum, c) => sum + c.value, 0);
  const billSubtotal = silverValue + makingAmount + otherChargesTotal;
  const gstAmount = (billSubtotal * gstInput) / 100;
  const billTotal = billSubtotal + gstAmount;
  const effectivePerGram = weight > 0 ? billTotal / weight : 0;

  const makingBillLabel = `मेकिंग · ${formatRupee(makingRatePerGram)}/ग्राम (${round2(makingPctEquiv)}%) × ${formatWeight(weight)}`;

  return (
    <View style={styles.calcCard}>
      <View style={styles.calcHeadRow}>
        <MaterialCommunityIcons name="cube-outline" size={22} color={Colors.textMuted} />
        <Text style={styles.calcTitle}>Silver Price Calculator</Text>
      </View>

      <Text style={styles.calcLabel}>Purity (शुद्धता)</Text>
      <View style={styles.segRow}>
        {SILVER_PURITY_OPTIONS.map((p) => (
          <TouchableOpacity
            key={p}
            style={[styles.segBtn, purity === p && styles.segBtnActive]}
            activeOpacity={0.85}
            onPress={() => setPurity(p)}
          >
            <Text style={[styles.segText, purity === p && styles.segTextActive]}>
              {p}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.calcLabel}>Silver Price (₹/ग्राम)</Text>
      <View style={styles.calcPrefixWrap}>
        <Text style={styles.calcPrefix}>₹</Text>
        <TextInput
          style={styles.calcInputBare}
          value={rateByPurity[purity] ?? ''}
          onChangeText={(t) => setRateByPurity((prev) => ({ ...prev, [purity]: t }))}
          keyboardType="decimal-pad"
          placeholder={liveRatePerGram > 0 ? formatRupee(livePurityRate) : '—'}
          placeholderTextColor={Colors.placeholderHint}
        />
        <Text style={styles.calcUnitSuffix}>{purity}</Text>
      </View>

      <Text style={styles.calcLabel}>Silver ka Weight</Text>
      <View style={styles.calcPrefixWrap}>
        <TextInput
          style={[styles.calcInputBare, { paddingLeft: 12 }]}
          value={wt}
          onChangeText={setWt}
          keyboardType="decimal-pad"
          placeholder="जैसे: 10 या 0.523"
          placeholderTextColor={Colors.placeholderHint}
        />
        {/* unit picks itself from the entered weight */}
        <Text style={styles.unitAutoText}>{weightUnit(weight)}</Text>
      </View>

      <Text style={styles.calcLabel}>मेकिंग चार्ज</Text>

      <View style={styles.makingFolderCard}>
        {/* Folder Tab Header Bar */}
        <View style={styles.folderTabBar}>
          <TouchableOpacity
            style={[
              styles.folderTab,
              makingSrc === 'pct' ? styles.folderTabActiveLeft : styles.folderTabInactive,
            ]}
            activeOpacity={0.85}
            onPress={() => {
              if (canDerive) {
                setMakingInput(round2(makingPctEquiv));
              }
              setMakingSrc('pct');
            }}
          >
            <Text
              style={[
                styles.folderTabText,
                makingSrc === 'pct' && styles.folderTabTextActive,
              ]}
            >
              प्रतिशत (%)
            </Text>
            {makingSrc === 'pct' && <View style={styles.folderTabIndicator} />}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.folderTab,
              makingSrc === 'perGram' ? styles.folderTabActiveRight : styles.folderTabInactive,
            ]}
            activeOpacity={0.85}
            onPress={() => {
              if (canDerive) {
                setMakingInput(round2(makingRatePerGram));
              }
              setMakingSrc('perGram');
            }}
          >
            <Text
              style={[
                styles.folderTabText,
                makingSrc === 'perGram' && styles.folderTabTextActive,
              ]}
            >
              ₹ प्रति ग्राम
            </Text>
            {makingSrc === 'perGram' && <View style={styles.folderTabIndicator} />}
          </TouchableOpacity>
        </View>

        {/* Connected Input Body */}
        <View style={styles.folderTabBody}>
          <View style={styles.folderInputRow}>
            <Text style={styles.calcPrefix}>
              {makingSrc === 'pct' ? '%' : '₹'}
            </Text>
            <TextInput
              style={styles.calcInputBare}
              value={makingInput}
              onChangeText={setMakingInput}
              keyboardType="decimal-pad"
              placeholder="0"
              placeholderTextColor={Colors.placeholderHint}
            />
            {makingSrc === 'perGram' && (
              <Text style={styles.calcUnitSuffix}>/ग्राम</Text>
            )}
          </View>

          {canDerive && (
            <View style={styles.folderFooter}>
              <View style={styles.folderDivider} />
              <View style={styles.folderFooterContent}>
                <Ionicons
                  name="information-circle-outline"
                  size={15}
                  color={Colors.amber}
                />
                <Text style={styles.folderFooterText}>
                  {makingSrc === 'pct'
                    ? `${makingTyped}% = ${formatRupee(makingRatePerGram)}/ग्राम के बराबर`
                    : `${formatRupee(makingRatePerGram)}/ग्राम = ${round2(makingPctEquiv)}% मेकिंग`}
                  {weight > 0 ? ` (कुल: ${formatRupee(makingAmount)})` : ''}
                </Text>
              </View>
            </View>
          )}
        </View>
      </View>

      <Text style={styles.calcLabel}>GST (%) — ज़रूरत हो तो बदलें</Text>
      <View style={styles.calcPrefixWrap}>
        <Text style={styles.calcPrefix}>%</Text>
        <TextInput
          style={styles.calcInputBare}
          value={gstVal}
          onChangeText={setGstVal}
          keyboardType="decimal-pad"
          placeholder="0"
          placeholderTextColor={Colors.placeholderHint}
        />
        <Text style={styles.calcUnitSuffix}>0 = बिना GST</Text>
      </View>

      {/* Other Charges — sirf amount field + remove button */}
      {otherCharges.map((charge) => (
        <View key={charge.id} style={styles.chargeRow}>
          <View style={styles.chargeAmountWrap}>
            <Text style={styles.calcPrefix}>₹</Text>
            <TextInput
              style={styles.chargeAmountInput}
              value={charge.amount}
              onChangeText={(t) => updateOtherCharge(charge.id, 'amount', t)}
              keyboardType="decimal-pad"
              placeholder="अन्य चार्ज का दाम"
              placeholderTextColor={Colors.placeholderHint}
            />
          </View>
          <TouchableOpacity
            style={styles.chargeRemoveBtn}
            activeOpacity={0.85}
            onPress={() => removeOtherCharge(charge.id)}
          >
            <Ionicons name="close" size={15} color="#FCA5A5" />
          </TouchableOpacity>
        </View>
      ))}

      <TouchableOpacity
        style={styles.addChargeBtn}
        activeOpacity={0.85}
        onPress={addOtherCharge}
      >
        <Ionicons name="add" size={16} color={Colors.amber} />
        <Text style={styles.addChargeBtnText}>Other Charges</Text>
      </TouchableOpacity>

      {weight > 0 && billTotal > 0 ? (
        <View style={styles.billCard}>
          <View style={styles.billBreakdown}>
            <View style={styles.billLine}>
              <Text style={styles.billLineLabel}>
                चांदी का भाव ({purity} × {formatWeight(weight)})
              </Text>
              <Text style={styles.billLineValue}>{formatRupee(silverValue)}</Text>
            </View>
            {makingAmount > 0 && (
              <View style={styles.billLine}>
                <Text style={styles.billLineLabel}>{makingBillLabel}</Text>
                <Text style={styles.billLineValue}>{formatRupee(makingAmount)}</Text>
              </View>
            )}
            {chargedOtherRows.map((c, i) => (
              <View key={c.id} style={styles.billLine}>
                <Text style={styles.billLineLabel}>
                  {chargedOtherRows.length > 1 ? `अन्य चार्ज ${i + 1}` : 'अन्य चार्ज'}
                </Text>
                <Text style={styles.billLineValue}>{formatRupee(c.value)}</Text>
              </View>
            ))}
            {gstAmount > 0 && (
              <View style={styles.billLine}>
                <Text style={styles.billLineLabel}>GST ({gstInput}%)</Text>
                <Text style={styles.billLineValue}>{formatRupee(gstAmount)}</Text>
              </View>
            )}
          </View>

          <View style={styles.billDivider} />

          <View style={styles.billTotalRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.billTotalLabel}>कुल देना होगा</Text>
              <Text style={styles.billEffective}>
                असरदार भाव · {formatRupee(effectivePerGram)} /ग्राम
              </Text>
            </View>
            <Text style={styles.billTotalValue}>{formatRupee(billTotal)}</Text>
          </View>
        </View>
      ) : (
        <Text style={styles.calcHintSmall}>
          वज़न डालें — आज के भाव पर पूरा हिसाब दिखेगा।
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgDark,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 28,
    gap: 12,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metalToggle: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: 'rgba(30, 41, 59, 0.45)',
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderRadius: 14,
    padding: 5,
  },
  metalToggleBtn: {
    flex: 1,
  },
  metalToggleActiveBg: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    borderRadius: 10,
    paddingVertical: 10,
  },
  metalToggleIdle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    borderRadius: 10,
    paddingVertical: 10,
  },
  metalToggleTextActive: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  metalToggleTextIdle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: Colors.textDim,
  },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.success,
  },
  liveSpinner: {
    transform: [{ scale: 0.6 }],
  },
  liveText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.success,
    letterSpacing: 0.6,
  },
  updatedText: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  citySelectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.4)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  citySelectText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
  },
  dropdown: {
    backgroundColor: Colors.cardBgSolid,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderRadius: 14,
    paddingVertical: 6,
  },
  dropdownItem: {
    paddingHorizontal: 10,
  },
  dropdownSelectedBg: {
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginVertical: 1,
  },
  dropdownSelectedText: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  dropdownItemText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: Colors.textSecondary,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  centerBox: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.amber,
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  retryText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.35)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  errorBannerText: {
    fontSize: 12,
    color: '#FCA5A5',
    fontWeight: '600',
    flex: 1,
  },
  heroCard: {
    borderRadius: 22,
    padding: 18,
    overflow: 'hidden',
    position: 'relative',
  },
  heroWatermark: {
    position: 'absolute',
    right: -14,
    bottom: -18,
    transform: [{ rotate: '-12deg' }],
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroCityLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.9)',
  },
  tickPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  tickText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  heroMain: {
    fontSize: 34,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.3,
    marginTop: 8,
  },
  heroDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    marginVertical: 14,
  },
  heroStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  heroStat: {
    flex: 1,
  },
  statLabel: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.78)',
    fontWeight: '600',
    marginBottom: 3,
  },
  statVal: {
    fontSize: 15,
    color: '#FFFFFF',
    fontWeight: '800',
  },

  // ---- jewellery bill estimator ----
  calcCard: {
    backgroundColor: Colors.cardBg,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderRadius: 18,
    padding: 16,
    gap: 2,
  },
  calcHeadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  // ---- converter accordion ----
  accHeadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  accTitle: {
    flex: 1,
  },
  accChevronBox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    backgroundColor: 'rgba(11, 15, 25, 0.7)',
  },
  // height + opacity come from the animated values at runtime
  accBody: {
    overflow: 'hidden',
  },
  accBodyInner: {
    paddingTop: 14,
    width: '100%',
    flexShrink: 0, // keeps the real height while the parent is collapsed to 0
  },
  calcTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.text,
  },
  calcSub: {
    fontSize: 11.5,
    color: Colors.textMuted,
    marginBottom: 14,
    lineHeight: 17,
  },
  calcLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textDim,
    marginBottom: 6,
    marginTop: 12,
  },
  calcLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    marginBottom: 6,
  },
  calcPrefixWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(11, 15, 25, 0.7)',
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderRadius: 12,
    paddingLeft: 14,
    paddingRight: 4,
  },
  calcPrefix: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.amber,
    width: 22,
  },
  calcInputBare: {
    flex: 1,
    paddingVertical: 11,
    paddingLeft: 4,
    paddingRight: 10,
    color: Colors.text,
    fontSize: 15,
    fontWeight: '600',
  },
  calcUnitSuffix: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textMuted,
    paddingRight: 12,
  },
  unitAutoText: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.amber,
    paddingRight: 12,
  },
  // the making maths — rate × weight — in the app's amber gradient, no box
  // ---- Folder Tab Container (Unified card matching screenshot) ----
  makingFolderCard: {
    backgroundColor: 'rgba(11, 15, 25, 0.7)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    overflow: 'hidden',
  },
  folderTabBar: {
    flexDirection: 'row',
    backgroundColor: '#070A11',
    borderBottomWidth: 1,
    borderBottomColor: Colors.cardBorder,
  },
  folderTab: {
    flex: 1,
    paddingVertical: 11,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  folderTabActiveLeft: {
    backgroundColor: 'rgba(21, 29, 48, 0.95)',
    borderTopLeftRadius: 13,
    borderTopRightRadius: 12,
    borderBottomColor: 'transparent',
    marginBottom: -1,
  },
  folderTabActiveRight: {
    backgroundColor: 'rgba(21, 29, 48, 0.95)',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 13,
    borderBottomColor: 'transparent',
    marginBottom: -1,
  },
  folderTabInactive: {
    backgroundColor: 'transparent',
  },
  folderTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textDim,
  },
  folderTabTextActive: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  folderTabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: '20%',
    right: '20%',
    height: 3,
    backgroundColor: Colors.amber,
    borderRadius: 2,
  },
  folderTabBody: {
    backgroundColor: 'rgba(21, 29, 48, 0.95)',
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  folderInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  folderFooter: {
    paddingBottom: 8,
  },
  folderDivider: {
    height: 1,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    marginBottom: 8,
  },
  folderFooterContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 4,
  },
  folderFooterText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.amber,
    flexShrink: 1,
  },
  convRows: {
    marginTop: 14,
    gap: 8,
  },
  convHeroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    backgroundColor: Colors.cardBgSolid,
    borderRadius: 12,
    padding: 13,
    marginBottom: 4,
  },
  convHeroLabel: {
    fontSize: 12.5,
    fontWeight: '700',
    color: Colors.textMuted,
  },
  convHeroValue: {
    fontSize: 21,
    fontWeight: '900',
    color: Colors.text,
  },
  convTotalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 14,
    backgroundColor: Colors.cardBgSolid,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderRadius: 12,
    padding: 14,
  },
  convTotalValue: {
    fontSize: 24,
    fontWeight: '900',
    color: Colors.text,
  },
  segRow: {
    flexDirection: 'row',
    gap: 8,
  },
  segBtn: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    backgroundColor: 'rgba(11, 15, 25, 0.7)',
    paddingVertical: 9,
    alignItems: 'center',
  },
  segBtnActive: {
    backgroundColor: Colors.amber,
    borderColor: Colors.amber,
  },
  segText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: Colors.textDim,
  },
  segTextActive: {
    color: '#2A1A08',
  },
  calcHintSmall: {
    fontSize: 11.5,
    color: Colors.textMuted,
    marginTop: 8,
    lineHeight: 17,
  },
  // ---- other charges (add / remove ₹ lines) ----
  addChargeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    width: '100%',
    marginTop: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(245, 158, 11, 0.5)',
    borderRadius: 12,
    paddingVertical: 11,
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
  },
  addChargeBtnText: {
    fontSize: 13.5,
    fontWeight: '800',
    color: Colors.amber,
  },
  chargeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  chargeAmountWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(11, 15, 25, 0.7)',
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderRadius: 12,
    paddingLeft: 12,
  },
  chargeAmountInput: {
    flex: 1,
    paddingVertical: 10,
    paddingRight: 8,
    color: Colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  chargeRemoveBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.35)',
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
  },
  billCard: {
    marginTop: 16,
    backgroundColor: Colors.orangeGlow,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    borderRadius: 14,
    padding: 14,
  },
  billBreakdown: {
    gap: 7,
  },
  billLine: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  billLineLabel: {
    flex: 1,
    fontSize: 12.5,
    color: Colors.textDim,
    lineHeight: 18,
  },
  billLineValue: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
  },
  billDivider: {
    height: 1,
    backgroundColor: 'rgba(245, 158, 11, 0.25)',
    marginVertical: 12,
  },
  billTotalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  billTotalLabel: {
    fontSize: 12.5,
    fontWeight: '700',
    color: Colors.amber,
  },
  billEffective: {
    fontSize: 11.5,
    color: Colors.textMuted,
    marginTop: 3,
  },
  billTotalValue: {
    fontSize: 23,
    fontWeight: '900',
    color: '#FDE68A',
  },
});
