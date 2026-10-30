import React, { useState, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Modal,
  Platform,
  ActivityIndicator,
  TouchableWithoutFeedback,
  Animated,
  Easing,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../theme/colors';
import ScreenHeader from '../components/ScreenHeader';
import MuhurtSearch from '../components/MuhurtSearch';
import GrahaRashiChakra from '../components/GrahaRashiChakra';
import FestivalIcon from '../components/FestivalIcon';
import FestivalArt, { festivalArt } from '../components/FestivalArt';
import webPrintHtml from '../utils/webPrintHtml';
import {
  CITIES,
  CITY_STORAGE_KEY,
  DEFAULT_CITY,
  findCity,
  getDayPanchang,
  getMonthDays,
  buildDayDetail,
  buildMonthPrintHtml,
  festivalColor,
  monthNameHi,
  monthNameEn,
  WEEKDAYS_HI,
  weekdayOf,
} from '../utils/hinduPanchang';

// Engine covers 1900-2100; a ±15 year window is plenty for a phone calendar
const TODAY = new Date();
const THIS_YEAR = TODAY.getFullYear();
const THIS_MONTH = TODAY.getMonth() + 1;
const THIS_DAY = TODAY.getDate();

const YEARS = [];
for (let y = THIS_YEAR - 15; y <= THIS_YEAR + 15; y++) YEARS.push(y);

const MONTH_INDEXES = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
const monthIndex = (y, m) => y * 12 + (m - 1);
const IDX_MIN = monthIndex(YEARS[0], 1);
const IDX_MAX = monthIndex(YEARS[YEARS.length - 1], 12);

const isToday = (d) =>
  d.year === THIS_YEAR && d.month === THIS_MONTH && d.day === THIS_DAY;

// Section accent colors for the day-detail sheet
const TONE = {
  gold: '#FCD34D',
  sky: '#7DD3FC',
  emerald: '#6EE7B7',
  rose: '#FDA4AF',
  violet: '#C4B5FD',
};

const LEGEND = [
  { label: 'प्रमुख त्योहार', color: festivalColor('major') },
  { label: 'एकादशी', color: festivalColor('ekadashi') },
  { label: 'संक्रांति', color: festivalColor('sankranti') },
  { label: 'प्रदोष', color: festivalColor('pradosha') },
  { label: 'ग्रहण', color: festivalColor('eclipse') },
  { label: 'अन्य व्रत', color: festivalColor('minor') },
];

export default function TyohaarCalendarScreen({ onBack }) {
  const [selYear, setSelYear] = useState(THIS_YEAR);
  const [selMonth, setSelMonth] = useState(THIS_MONTH);
  const [cityId, setCityId] = useState(DEFAULT_CITY.id);
  const [openDropdown, setOpenDropdown] = useState(null); // 'month' | 'year' | 'city'
  const [detailDay, setDetailDay] = useState(null);
  const [heroIdx, setHeroIdx] = useState(0); // which upcoming त्योहार the banner shows
  const [modalVisible, setModalVisible] = useState(false);
  const [sheetAnim] = useState(() => new Animated.Value(0));
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState(false);

  // Selected city is remembered across app launches
  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(CITY_STORAGE_KEY);
        if (saved && CITIES.some((c) => c.id === saved)) setCityId(saved);
      } catch {
        // first run — keep the default city
      }
    })();
  }, []);

  const handlePickCity = (id) => {
    setCityId(id);
    setOpenDropdown(null);
    AsyncStorage.setItem(CITY_STORAGE_KEY, id).catch(() => { });
  };

  const city = useMemo(() => findCity(cityId), [cityId]);

  // ~30 offline panchang calculations, cached per month+city in the util layer
  const days = useMemo(() => getMonthDays(selYear, selMonth, city), [selYear, selMonth, city]);
  const leadingBlanks = weekdayOf(selYear, selMonth, 1);

  // Rows of 7 cells (null = empty slot) so columns always line up with the
  // weekday header instead of relying on percentage widths
  const gridRows = useMemo(() => {
    const cells = Array.from({ length: leadingBlanks }, () => null).concat(days);
    while (cells.length % 7 !== 0) cells.push(null);
    const rows = [];
    for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));
    return rows;
  }, [days, leadingBlanks]);

  // Hero banner always shows *today* — computed from the real date, so browsing
  // another month never relabels the 1st of that month as "आज"
  const todayInfo = useMemo(
    () => getDayPanchang(THIS_YEAR, THIS_MONTH, THIS_DAY, city),
    [city],
  );

  // Upcoming festivals for the hero card, today first. एकादशी / प्रदोष /
  // पूर्णिमा are never more than ~16 days apart, so five of them always turn up
  // inside 40 steps, and every step is a per-day calculation the util caches —
  // the rest of this month is already computed by the grid.
  const upcomingEvents = useMemo(() => {
    const out = [];
    for (let i = 0; i <= 40 && out.length < 5; i++) {
      const d = new Date(THIS_YEAR, THIS_MONTH - 1, THIS_DAY + i);
      const p = getDayPanchang(d.getFullYear(), d.getMonth() + 1, d.getDate(), city);
      const f = p && p.festivals[0];
      if (f) {
        out.push({
          festival: f,
          day: p,
          isToday: i === 0,
          inDays: i,
          dateHi: `${p.day} ${monthNameHi(p.month)} ${d.getFullYear()}`,
        });
      }
    }
    return out;
  }, [city]);

  const heroEvent = upcomingEvents[Math.min(heroIdx, upcomingEvents.length - 1)] || null;
  // Falls back to the plain maroon palette when there is nothing to show
  const heroPalette = festivalArt(
    heroEvent ? heroEvent.festival.name : '',
    heroEvent ? heroEvent.festival.type : 'minor',
  );

  const stepHero = (delta) =>
    setHeroIdx((i) => Math.min(Math.max(i + delta, 0), Math.max(upcomingEvents.length - 1, 0)));

  const monthFestivals = useMemo(() => {
    const rows = [];
    days.forEach((d) => {
      d.festivals.forEach((f) => rows.push({ day: d, festival: f }));
    });
    return rows;
  }, [days]);

  const currentIdx = monthIndex(selYear, selMonth);
  const canGoPrev = currentIdx > IDX_MIN;
  const canGoNext = currentIdx < IDX_MAX;

  const goMonth = (step) => {
    const next = Math.min(Math.max(currentIdx + step, IDX_MIN), IDX_MAX);
    setSelYear(Math.floor(next / 12));
    setSelMonth((next % 12) + 1);
  };

  const goToday = () => {
    setSelYear(THIS_YEAR);
    setSelMonth(THIS_MONTH);
  };

  const openDay = (day) => {
    setDetailDay(day);
    setModalVisible(true);
    sheetAnim.setValue(0);
    Animated.timing(sheetAnim, {
      toValue: 1,
      duration: 300,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  };

  const closeDay = () => {
    Animated.timing(sheetAnim, {
      toValue: 0,
      duration: 220,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: Platform.OS !== 'web',
    }).start(() => {
      setModalVisible(false);
      setDetailDay(null);
    });
  };

  const screenH = Dimensions.get('window').height || 750;

  const backdropOpacity = sheetAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const panelTranslateY = sheetAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [screenH * 0.9, 0],
  });

  // The viewed month -> PDF (native) or print dialog (web) -> share sheet
  const shareMonth = async () => {
    if (!days.length || exporting) return;
    setExporting(true);
    setExportError(false);

    const html = buildMonthPrintHtml(selYear, selMonth, city, days);
    try {
      if (Platform.OS === 'web') {
        webPrintHtml(html);
      } else {
        // Loaded on demand: expo-print resolves its native module at import
        // time, so a top-level import would blank the whole app on an Expo Go
        // build that has no ExpoPrint module. Only this button should fail.
        const Print = require('expo-print');
        const Sharing = require('expo-sharing');
        // A4 at 72 PPI; expo-print keeps the file in the app cache
        const { uri } = await Print.printToFileAsync({ html, width: 595, height: 842 });
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(uri, {
            mimeType: 'application/pdf',
            UTI: 'com.adobe.pdf',
            dialogTitle: `${monthNameHi(selMonth)} ${selYear} पंचांग · ${city.hi}`,
          });
        } else {
          await Print.printAsync({ html });
        }
      }
    } catch (e) {
      console.warn('Tyohaar PDF export failed:', e && e.message ? e.message : e);
      setExportError(true);
    } finally {
      setExporting(false);
    }
  };

  const detailSections = detailDay ? buildDayDetail(detailDay) : [];

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Calendar"
        subtitle="पंचांग · त्योहार व शुभ मुहूर्त"
        icon="calendar-month"
        theme="maroon"
        onBack={onBack}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Month navigation ─────────────────────────────── */}
        <View style={styles.navRow}>
          <TouchableOpacity
            style={[styles.navBtn, !canGoPrev && styles.navBtnOff]}
            onPress={() => goMonth(-1)}
            disabled={!canGoPrev}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={19} color={canGoPrev ? '#FDBA74' : Colors.textDim} />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.navChip, styles.navChipMonth]} onPress={() => setOpenDropdown('month')} activeOpacity={0.8}>
            <Text style={styles.navChipText} numberOfLines={1}>{monthNameHi(selMonth)}</Text>
            <MaterialCommunityIcons name="menu-down" size={18} color="#FDBA74" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.navChip} onPress={() => setOpenDropdown('year')} activeOpacity={0.8}>
            <Text style={styles.navChipText}>{selYear}</Text>
            <MaterialCommunityIcons name="menu-down" size={18} color="#FDBA74" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navBtn, !canGoNext && styles.navBtnOff]}
            onPress={() => goMonth(1)}
            disabled={!canGoNext}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-forward" size={19} color={canGoNext ? '#FDBA74' : Colors.textDim} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.todayBtn} onPress={goToday} activeOpacity={0.8}>
            <Text style={styles.todayBtnText}>आज</Text>
          </TouchableOpacity>
        </View>

        {/* ── City selector ────────────────────────────────── */}
        <TouchableOpacity style={styles.cityRow} onPress={() => setOpenDropdown('city')} activeOpacity={0.8}>
          <View style={styles.cityLeft}>
            <Ionicons name="location" size={15} color="#FB923C" />
            <Text style={styles.cityLabel}>{city.hi}</Text>
            <Text style={styles.cityEn}>· {city.en}</Text>
          </View>
          <View style={styles.cityRight}>
            <MaterialCommunityIcons name="menu-down" size={18} color="#FB923C" />
          </View>
        </TouchableOpacity>

        {/* ── Hero holiday card ───────────────────────────── */}
        <LinearGradient
          colors={heroPalette.bg}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroBanner}
        >
          {/* The festival's own scene, hanging off the right edge */}
          {heroEvent ? (
            <FestivalArt
              name={heroEvent.festival.name}
              type={heroEvent.festival.type}
              width={104}
              height={98}
              style={styles.heroArt}
            />
          ) : null}

          <View style={styles.heroLeft}>
            <Text
              style={[styles.heroKicker, { color: heroPalette.ink }]}
              allowFontScaling={false}
              numberOfLines={1}
            >
              {heroEvent ? (heroEvent.isToday ? 'आज का त्योहार' : 'अगला त्योहार') : 'अभी कोई त्योहार नहीं'}
            </Text>
            <Text
              style={[styles.heroName, { color: heroPalette.ink }]}
              allowFontScaling={false}
              numberOfLines={2}
            >
              {heroEvent ? heroEvent.festival.name : 'पंचांग'}
            </Text>
            {heroEvent ? (
              <Text
                style={[styles.heroDate, { color: heroPalette.ink }]}
                allowFontScaling={false}
                numberOfLines={1}
              >
                {`${heroEvent.day.weekdayHi}, ${heroEvent.dateHi}`}
                {heroEvent.isToday ? '' : ` · ${heroEvent.inDays} दिन बाद`}
              </Text>
            ) : null}
            <Text style={[styles.heroFoot, { color: heroPalette.ink }]} allowFontScaling={false} numberOfLines={2}>
              {`पौर्णिमान्त पंचांग · ${todayInfo ? todayInfo.masa : ''} मास · संवत् ${todayInfo ? todayInfo.vikramSamvat : ''} · ${monthNameEn(selMonth)} ${selYear}`}
              {todayInfo ? ` · आज ${todayInfo.weekdayHi}, ${todayInfo.tithiName}` : ''}
            </Text>
          </View>

          {/* ‹ › walk the list of upcoming festivals */}
          {upcomingEvents.length > 1 && heroIdx > 0 ? (
            <TouchableOpacity style={styles.heroNavLeft} onPress={() => stepHero(-1)} activeOpacity={0.7}>
              <Ionicons name="chevron-back" size={21} color={heroPalette.ink} />
            </TouchableOpacity>
          ) : null}
          {upcomingEvents.length > 1 && heroIdx < upcomingEvents.length - 1 ? (
            <TouchableOpacity style={styles.heroNavRight} onPress={() => stepHero(1)} activeOpacity={0.7}>
              <Ionicons name="chevron-forward" size={21} color={heroPalette.ink} />
            </TouchableOpacity>
          ) : null}
        </LinearGradient>

        {/* ── Weekday header ───────────────────────────────── */}
        <View style={styles.calendarWrap}>
          <View style={styles.gridRow}>
            {WEEKDAYS_HI.map((w, i) => (
              <Text
                key={w}
                style={[styles.weekText, i === 0 && styles.weekTextSunday]}
                allowFontScaling={false}
                numberOfLines={1}
              >
                {w}
              </Text>
            ))}
          </View>

          {/* ── Month grid ───────────────────────────────────── */}
          <View style={styles.grid}>
            {gridRows.map((row, rowIdx) => (
              <View key={`row-${rowIdx}`} style={styles.gridRow}>
                {row.map((d, i) => {
                  if (!d) return <View key={`e-${i}`} style={styles.cellEmpty} />;

                  const top = d.festivals[0];
                  const sunday = d.weekday === 0;
                  const today = isToday(d);
                  return (
                    <TouchableOpacity
                      key={d.day}
                      style={[
                        styles.cell,
                        sunday && styles.cellSunday,
                        today && styles.cellToday,
                      ]}
                      onPress={() => openDay(d)}
                      activeOpacity={0.75}
                    >
                      {top ? (
                        <View style={styles.cellIcon}>
                          <FestivalIcon name={top.name} type={top.type} seed={d.day} size={20} />
                        </View>
                      ) : null}

                      <View style={styles.cellTopRow}>
                        <Text
                          style={[
                            styles.cellNum,
                            sunday && styles.cellNumSunday,
                            today && styles.cellNumToday,
                          ]}
                          allowFontScaling={false}
                          numberOfLines={1}
                        >
                          {d.day}
                        </Text>
                      </View>

                      <Text style={styles.cellTithi} allowFontScaling={false} numberOfLines={1}>
                        {d.tithiShort.paksha ? `${d.tithiShort.paksha}० ` : ''}
                        {d.tithiShort.rest}
                      </Text>

                      {top ? (
                        <Text
                          style={[styles.cellFestival, { color: festivalColor(top.type) }]}
                          allowFontScaling={false}
                          numberOfLines={1}
                        >
                          {top.name}
                        </Text>
                      ) : null}

                      {today ? <View style={styles.todayDot} /> : null}
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
          </View>
        </View>

        {/* ── Legend ───────────────────────────────────────── */}
        <View style={styles.legendWrap}>
          {LEGEND.map((l) => (
            <View key={l.label} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: l.color }]} />
              <Text style={styles.legendText} allowFontScaling={false}>{l.label}</Text>
            </View>
          ))}
        </View>

        {/* ── Month festival list ──────────────────────────── */}
        <View style={styles.card}>
          <View style={styles.cardHead}>
            <MaterialCommunityIcons name="fire" size={17} color="#FDBA74" />
            <Text style={styles.cardTitle}>{monthNameHi(selMonth)} {selYear} के त्योहार</Text>
          </View>

          {monthFestivals.length === 0 ? (
            <Text style={styles.emptyText}>इस महीने कोई त्योहार नहीं।</Text>
          ) : (
            monthFestivals.map(({ day, festival }) => (
              <TouchableOpacity
                key={`${day.day}-${festival.key}`}
                style={styles.festRow}
                onPress={() => openDay(day)}
                activeOpacity={0.75}
              >
                <View style={styles.festDateBox}>
                  <Text style={styles.festDateNum} allowFontScaling={false}>{day.day}</Text>
                  <Text style={styles.festDateVar} allowFontScaling={false}>
                    {WEEKDAYS_HI[day.weekday]}
                  </Text>
                </View>
                <View style={styles.festBody}>
                  <Text style={[styles.festName, { color: festivalColor(festival.type) }]}>
                    {festival.name}
                  </Text>
                  <Text style={styles.festMasa} numberOfLines={1}>
                    {festival.description || day.tithiName}
                  </Text>
                </View>
                <Text style={styles.festTithi}>{day.tithiShort.rest}</Text>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* ── Month PDF / share ────────────────────────────── */}
        <TouchableOpacity
          style={styles.exportWrap}
          onPress={shareMonth}
          disabled={exporting}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={['#7C2D12', '#C2410C', '#F59E0B']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.exportBtn}
          >
            {exporting ? (
              <ActivityIndicator size="small" color="#0B1220" />
            ) : (
              <MaterialCommunityIcons name="file-pdf-box" size={19} color="#0B1220" />
            )}
            <Text style={styles.exportText} allowFontScaling={false}>
              {monthNameHi(selMonth)} {selYear} का पंचांग · PDF / साझा
            </Text>
          </LinearGradient>
        </TouchableOpacity>
        {exportError ? (
          <Text style={styles.exportError}>PDF नहीं बन सका — दोबारा कोशिश करें।</Text>
        ) : null}

        {/* ── Muhurat search ───────────────────────────────── */}
        <MuhurtSearch
          days={days}
          monthName={monthNameHi(selMonth)}
          year={selYear}
          onSelectDay={openDay}
        />

        {/* ── Graha rashi chakra (today) ───────────────────── */}
        {todayInfo ? <GrahaRashiChakra day={todayInfo} city={city} /> : null}
      </ScrollView>

      {/* ── Month / Year / City dropdown ─────────────────────── */}
      <Modal
        visible={openDropdown !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setOpenDropdown(null)}
      >
        <TouchableWithoutFeedback onPress={() => setOpenDropdown(null)}>
          <View style={styles.modalBackdrop}>
            <TouchableWithoutFeedback>
              <View style={styles.dropPanel}>
                <Text style={styles.dropTitle}>
                  {openDropdown === 'year'
                    ? 'वर्ष चुनें'
                    : openDropdown === 'city'
                      ? 'शहर चुनें'
                      : 'महीना चुनें'}
                </Text>
                <ScrollView style={styles.dropScroll} showsVerticalScrollIndicator={false}>
                  {openDropdown === 'year' &&
                    YEARS.map((y) => (
                      <TouchableOpacity
                        key={y}
                        style={[styles.dropOption, y === selYear && styles.dropOptionActive]}
                        onPress={() => {
                          setSelYear(y);
                          setOpenDropdown(null);
                        }}
                      >
                        <Text
                          style={[styles.dropOptionText, y === selYear && styles.dropOptionTextActive]}
                        >
                          {y}
                        </Text>
                        {y === selYear ? (
                          <Ionicons name="checkmark" size={16} color="#FDBA74" />
                        ) : null}
                      </TouchableOpacity>
                    ))}

                  {openDropdown === 'month' &&
                    MONTH_INDEXES.map((i) => {
                      const m = i + 1;
                      return (
                        <TouchableOpacity
                          key={m}
                          style={[styles.dropOption, m === selMonth && styles.dropOptionActive]}
                          onPress={() => {
                            setSelMonth(m);
                            setOpenDropdown(null);
                          }}
                        >
                          <Text
                            style={[styles.dropOptionText, m === selMonth && styles.dropOptionTextActive]}
                          >
                            {monthNameHi(m)}
                          </Text>
                          {m === selMonth ? (
                            <Ionicons name="checkmark" size={16} color="#FDBA74" />
                          ) : null}
                        </TouchableOpacity>
                      );
                    })}

                  {openDropdown === 'city' &&
                    CITIES.map((c) => (
                      <TouchableOpacity
                        key={c.id}
                        style={[styles.dropOption, c.id === cityId && styles.dropOptionActive]}
                        onPress={() => handlePickCity(c.id)}
                      >
                        <Text
                          style={[styles.dropOptionText, c.id === cityId && styles.dropOptionTextActive]}
                        >
                          {c.hi}
                          <Text style={styles.dropOptionEn}> · {c.en}</Text>
                        </Text>
                        {c.id === cityId ? (
                          <Ionicons name="checkmark" size={16} color="#FDBA74" />
                        ) : null}
                      </TouchableOpacity>
                    ))}
                </ScrollView>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* ── Day panchang sheet ───────────────────────────────── */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="none"
        onRequestClose={closeDay}
      >
        <View style={styles.sheetBackdrop}>
          <Animated.View
            style={[styles.backdropOverlay, { opacity: backdropOpacity }]}
          >
            <TouchableOpacity
              style={StyleSheet.absoluteFill}
              activeOpacity={1}
              onPress={closeDay}
            />
          </Animated.View>

          <Animated.View
            style={[
              styles.sheetPanel,
              { transform: [{ translateY: panelTranslateY }] },
            ]}
          >
            {detailDay ? (
              <>
                {/* Fixed Header: Grabber + Date/Samvat/Close + Festival Badges */}
                <View style={styles.sheetHeaderWrapper}>
                  <View style={styles.sheetGrabber} />

                  <View style={styles.sheetHead}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.sheetDate} allowFontScaling={false}>
                        {detailDay.day} {monthNameHi(detailDay.month)} {detailDay.year}
                      </Text>
                      <Text style={styles.sheetVar} allowFontScaling={false}>
                        {detailDay.weekdayHi} · {detailDay.masa} {detailDay.tithiName}
                      </Text>
                      <Text style={styles.sheetSamvat} allowFontScaling={false}>
                        विक्रम संवत {detailDay.vikramSamvat} · शक संवत {detailDay.shakaSamvat}
                      </Text>
                    </View>
                    <TouchableOpacity style={styles.sheetClose} onPress={closeDay} activeOpacity={0.7}>
                      <Ionicons name="close" size={20} color="#FDBA74" />
                    </TouchableOpacity>
                  </View>

                  {detailDay.festivals.length > 0 ? (
                    <View style={styles.sheetFestRow}>
                      {detailDay.festivals.map((f) => (
                        <View
                          key={f.key}
                          style={[
                            styles.festChip,
                            { borderColor: `${festivalColor(f.type)}55` },
                          ]}
                        >
                          <Text
                            style={[styles.festChipText, { color: festivalColor(f.type) }]}
                            allowFontScaling={false}
                          >
                            {f.name}
                          </Text>
                        </View>
                      ))}
                    </View>
                  ) : null}
                </View>

                {/* Scrollable Content: All Panchang Sections */}
                <ScrollView
                  style={styles.sheetScroll}
                  contentContainerStyle={styles.sheetScrollContent}
                  showsVerticalScrollIndicator={false}
                  bounces={true}
                >
                  {detailSections.map((section) => {
                    const tone = TONE[section.tone];
                    return (
                      <View key={section.title} style={styles.sectionCard}>
                        <View style={styles.sectionHead}>
                          <MaterialCommunityIcons name={section.icon} size={16} color={tone} />
                          <Text style={[styles.sectionTitle, { color: tone }]}>
                            {section.title}
                          </Text>
                        </View>

                        {section.rows.map((row, idx) => (
                          <View
                            key={`${section.title}-${row.label}-${idx}`}
                            style={[
                              styles.row,
                              idx === section.rows.length - 1 && styles.rowLast,
                            ]}
                          >
                            <Text style={styles.rowLabel} allowFontScaling={false}>
                              {row.label}
                            </Text>
                            <View style={styles.rowValueWrap}>
                              <Text style={styles.rowValue} allowFontScaling={false}>
                                {row.value}
                              </Text>
                              {row.sub ? (
                                <Text
                                  style={styles.rowSub}
                                  allowFontScaling={false}
                                  numberOfLines={2}
                                >
                                  {row.sub}
                                </Text>
                              ) : null}
                            </View>
                          </View>
                        ))}
                      </View>
                    );
                  })}

                  <Text style={styles.sheetFootnote} allowFontScaling={false}>
                    गणना: {city.hi} के सूर्योदय पर, पौर्णिमान्त मान्यता · स्रोत offline
                    panchang engine
                  </Text>
                </ScrollView>
              </>
            ) : null}
          </Animated.View>
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
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 26,
  },

  // Month navigation
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  navBtn: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(251, 186, 116, 0.22)',
  },
  navBtnOff: {
    opacity: 0.4,
  },
  navChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 11,
    backgroundColor: 'rgba(30, 41, 59, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(251, 186, 116, 0.22)',
  },
  navChipText: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.text,
    marginRight: 2,
  },
  // Fixed width so the chip doesn't grow/shrink as the month name changes
  navChipMonth: {
    width: 86,
    justifyContent: 'center',
  },
  todayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginLeft: 'auto',
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: 'rgba(251, 186, 116, 0.5)',
    backgroundColor: 'rgba(251, 186, 116, 0.14)',
  },
  todayBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FDBA74',
  },

  // City selector
  cityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 13,
    backgroundColor: Colors.cardBg,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    marginBottom: 12,
  },
  cityLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cityLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.text,
  },
  cityEn: {
    fontSize: 11.5,
    color: Colors.textDim,
    fontWeight: '600',
  },
  cityRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },

  // Hero holiday card — the whole card takes the festival's colours and the
  // illustration hangs off the top-right, the way Keka's holidays banner does.
  heroBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(251, 186, 116, 0.28)',
    paddingLeft: 30,
    paddingRight: 30,
    paddingVertical: 13,
    marginBottom: 14,
    overflow: 'hidden',
  },
  heroArt: {
    top: 2,
    right: 4,
  },
  heroNavLeft: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroNavRight: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroLeft: {
    flex: 1,
    // Keeps the name clear of the illustration; long names take a second line
    // rather than ellipsising.
    paddingRight: 76,
  },
  heroKicker: {
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.6,
    opacity: 0.72,
  },
  heroName: {
    fontSize: 21,
    fontWeight: '900',
    letterSpacing: 0.2,
    marginTop: 2,
    // No lineHeight: Devanagari needs the font's own (taller) line box, and a
    // two-word name wraps to a second line here.
  },
  heroDate: {
    fontSize: 12.5,
    fontWeight: '700',
    marginTop: 3,
    opacity: 0.95,
  },
  heroFoot: {
    fontSize: 10.5,
    fontWeight: '600',
    marginTop: 7,
    opacity: 0.68,
  },

  // Calendar grid
  calendarWrap: {
    marginHorizontal: -10,
    marginBottom: 10,
  },
  grid: {
    marginTop: 2,
    marginBottom: 12,
  },
  gridRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  weekText: {
    flex: 1,
    marginHorizontal: 2,
    textAlign: 'center',
    fontSize: 11.5,
    fontWeight: '800',
    color: Colors.textMuted,
  },
  weekTextSunday: {
    color: '#F87171',
  },
  cell: {
    flex: 1,
    marginHorizontal: 2,
    aspectRatio: 1,
    minHeight: 56,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(51, 65, 85, 0.65)',
    backgroundColor: 'transparent',
    overflow: 'hidden',
    paddingTop: 2,
    paddingHorizontal: 1.5,
    paddingBottom: 4,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  cellSunday: {
    backgroundColor: 'rgba(225, 29, 72, 0.07)',
    borderColor: 'rgba(225, 29, 72, 0.22)',
  },
  cellToday: {
    borderColor: 'rgba(251, 186, 116, 0.85)',
    backgroundColor: 'rgba(251, 146, 60, 0.16)',
  },
  cellEmpty: {
    flex: 1,
    marginHorizontal: 2,
    aspectRatio: 1,
    minHeight: 56,
  },
  cellNum: {
    fontSize: 18,
    fontWeight: '900',
    color: Colors.textSecondary,
  },
  cellNumSunday: {
    color: '#FCA5A5',
  },
  cellNumToday: {
    color: '#FDE68A',
  },
  cellTithi: {
    fontSize: 8.5,
    fontWeight: '600',
    color: Colors.textMuted,
    textAlign: 'center',
  },
  cellTopRow: {
    height: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellIcon: {
    // Bottom-left corner, rendered first so the larger icon sits behind the
    // day/tithi/name text. Kept fairly opaque so it stays clearly visible.
    position: 'absolute',
    bottom: 3,
    left: 3,
    opacity: 0.55,
  },
  cellFestival: {
    fontSize: 8,
    fontWeight: '800',
    // Deliberately no lineHeight: the old 9.5 (1.19× of 8px) is what clipped
    // Devanagari matras on Android — "दुर्गा" lost its ्, "करवा चतुर्थी" lost its
    // second line. The name is one line now, so let the font use its own
    // (taller) Devanagari metrics.
    textAlign: 'center',
    marginTop: 0.5,
  },
  todayDot: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FDE68A',
  },

  // Legend
  legendWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textMuted,
  },

  // Cards
  card: {
    backgroundColor: Colors.cardBg,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: 14,
    marginBottom: 12,
  },
  cardHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    color: Colors.text,
  },
  emptyText: {
    fontSize: 12.5,
    color: Colors.textDim,
  },

  // Festival list rows
  festRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    borderTopWidth: 1,
    borderTopColor: 'rgba(51, 65, 85, 0.5)',
  },
  festDateBox: {
    width: 34,
    alignItems: 'center',
    marginRight: 10,
  },
  festDateNum: {
    fontSize: 15,
    fontWeight: '900',
    color: '#FDE68A',
    lineHeight: 18,
  },
  festDateVar: {
    fontSize: 9.5,
    fontWeight: '700',
    color: Colors.textDim,
  },
  festBody: {
    flex: 1,
  },
  festName: {
    fontSize: 13.5,
    fontWeight: '800',
  },
  festMasa: {
    fontSize: 10.5,
    color: Colors.textDim,
    marginTop: 2,
  },
  festTithi: {
    fontSize: 10.5,
    fontWeight: '700',
    color: Colors.textMuted,
    marginLeft: 8,
  },

  // Month PDF / share
  exportWrap: {
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: 12,
  },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    borderRadius: 14,
  },
  exportText: {
    marginLeft: 8,
    fontSize: 13,
    fontWeight: '900',
    color: '#0B1220',
  },
  exportError: {
    marginTop: 6,
    fontSize: 11,
    fontWeight: '700',
    color: '#FDA4AF',
    textAlign: 'center',
  },

  // Note card
  noteCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: 14,
  },
  noteHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginBottom: 6,
  },
  noteTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FDBA74',
  },
  noteText: {
    fontSize: 12,
    color: Colors.textMuted,
    lineHeight: 18,
  },
  noteBold: {
    color: Colors.textSecondary,
    fontWeight: '800',
  },

  // Dropdown modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(3, 7, 18, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  dropPanel: {
    width: 260,
    maxHeight: 400,
    backgroundColor: Colors.bgSecondary,
    borderWidth: 1,
    borderColor: 'rgba(251, 186, 116, 0.25)',
    borderRadius: 16,
    padding: 10,
  },
  dropTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FDBA74',
    paddingHorizontal: 8,
    paddingTop: 4,
    paddingBottom: 8,
  },
  dropScroll: {
    maxHeight: 340,
  },
  dropOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  dropOptionActive: {
    backgroundColor: 'rgba(251, 146, 60, 0.14)',
  },
  dropOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  dropOptionTextActive: {
    color: '#FDBA74',
    fontWeight: '800',
  },
  dropOptionEn: {
    fontSize: 11.5,
    fontWeight: '600',
    color: Colors.textDim,
  },

  // Day detail sheet
  sheetBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdropOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(3, 7, 18, 0.78)',
  },
  sheetPanel: {
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
    height: '84%',
    maxHeight: '88%',
    backgroundColor: Colors.bgSecondary,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(251, 186, 116, 0.25)',
    borderBottomWidth: 0,
    paddingTop: 8,
    paddingBottom: 0,
    overflow: 'hidden',
  },
  sheetHeaderWrapper: {
    flexShrink: 0,
    backgroundColor: Colors.bgSecondary,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(251, 186, 116, 0.12)',
    paddingBottom: 4,
  },
  sheetGrabber: {
    alignSelf: 'center',
    width: 46,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(251, 186, 116, 0.35)',
    marginBottom: 8,
  },
  sheetHead: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  sheetDate: {
    fontSize: 17,
    fontWeight: '900',
    color: Colors.text,
  },
  sheetVar: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#FDBA74',
    marginTop: 3,
  },
  sheetSamvat: {
    fontSize: 11,
    color: Colors.textDim,
    marginTop: 2,
  },
  sheetClose: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
  },
  sheetFestRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  festChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
  },
  festChipText: {
    fontSize: 11.5,
    fontWeight: '800',
  },
  sheetScroll: {
    flex: 1,
    minHeight: 0,
    width: '100%',
  },
  sheetScrollContent: {
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 36,
  },
  sectionCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 4,
    marginBottom: 10,
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  sectionTitle: {
    fontSize: 12.5,
    fontWeight: '900',
    letterSpacing: 0.2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 7,
    borderTopWidth: 1,
    borderTopColor: 'rgba(51, 65, 85, 0.45)',
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  rowLabel: {
    width: 104,
    fontSize: 11.5,
    fontWeight: '700',
    color: Colors.textMuted,
  },
  rowValueWrap: {
    flex: 1,
  },
  rowValue: {
    fontSize: 12.5,
    fontWeight: '800',
    color: Colors.text,
  },
  rowSub: {
    fontSize: 10.5,
    color: Colors.textDim,
    marginTop: 2,
    lineHeight: 14,
  },
  sheetFootnote: {
    fontSize: 10.5,
    color: Colors.textDim,
    textAlign: 'center',
    marginTop: 2,
    marginBottom: 6,
  },
});
