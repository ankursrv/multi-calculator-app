import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  ScrollView,
  Animated,
  Easing,
} from 'react-native';
import { Text } from '../components/I18nText';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { MUHURT_TYPES, findMuhurtasInMonth, formatTime, WEEKDAYS_HI } from '../utils/hinduPanchang';
import { useLanguage } from '../context/LanguageContext';

const SHUBH = '#6EE7B7';
const ASHUBH = '#FDA4AF';

// Full English names ("Wednesday", "Sunday") wrap inside the narrow date box
// — keep the compact label alongside the short Hindi ones.
const WEEKDAYS_EN_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Show only this many rows until "View more" is tapped
const ROW_PREVIEW_LIMIT = 5;

/**
 * मुहूर्त खोज — "इस महीने अमृत काल / अभिजित / राहुकाल कब-कब है?"
 * Times come from the same day objects the grid and the day sheet use.
 */
export default function MuhurtSearch({
  days,
  monthName,
  year,
  onSelectDay,
  scrollRef,
  scrollOffsetRef,
}) {
  const { language, t } = useLanguage();
  const [selected, setSelected] = useState('amritKala');
  // Muhurta type whose extra rows are expanded; null = collapsed.
  // Tying it to the selected type makes switching chips start collapsed.
  const [expandedType, setExpandedType] = useState(null);
  const [anim] = useState(() => new Animated.Value(0));
  const [hiddenHeight, setHiddenHeight] = useState(0);
  const hiddenHeightRef = useRef(0);

  const type = MUHURT_TYPES.find((t) => t.id === selected) || MUHURT_TYPES[0];
  const accent = type.good ? SHUBH : ASHUBH;

  const rows = useMemo(() => findMuhurtasInMonth(days, selected), [days, selected]);
  const expanded = expandedType === selected;
  const hiddenRows = rows.slice(ROW_PREVIEW_LIMIT);
  const hiddenCount = Math.max(rows.length - ROW_PREVIEW_LIMIT, 0);
  // Fallback for native, where a child inside a zero-height clipped parent can
  // report 0 from onLayout. maxHeight never adds empty space beyond content.
  const fallbackHeight = Math.max(hiddenRows.length * 70, 1);
  const expandTarget = Math.max(hiddenHeight || fallbackHeight, 1);

  // A newly selected muhurta always starts collapsed
  useEffect(() => {
    anim.removeAllListeners();
    anim.setValue(0);
    hiddenHeightRef.current = 0;
  }, [selected, anim]);

  // Measure the extra rows outside the clipped container — on native a
  // zero-height parent can report 0 from onLayout.
  const onHiddenLayout = (e) => {
    const h = e.nativeEvent.layout.height;
    if (h > 0 && Math.abs(h - hiddenHeightRef.current) > 0.5) {
      hiddenHeightRef.current = h;
      setHiddenHeight(h);
    }
  };

  const toggle = () => {
    const opening = expandedType !== selected;
    const fullHeight = hiddenHeightRef.current > 0 ? hiddenHeightRef.current : fallbackHeight;
    const startValue = opening ? 0 : fullHeight;
    const startScrollY = scrollOffsetRef ? scrollOffsetRef.current : 0;
    setExpandedType(opening ? selected : null);

    // On collapse keep the button visually anchored in the parent ScrollView.
    // On expand leave scrolling alone so new rows continue from the current spot.
    anim.removeAllListeners();
    const listenerId = opening
      ? null
      : anim.addListener(({ value }) => {
          if (!scrollRef || !scrollRef.current) return;
          const nextY = Math.max(0, startScrollY + (value - startValue));
          scrollRef.current.scrollTo({ y: nextY, animated: false });
        });

    Animated.timing(anim, {
      toValue: opening ? fullHeight : 0,
      duration: 300,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: false, // `maxHeight` is not supported by the native driver
    }).start(() => {
      if (listenerId !== null) anim.removeListener(listenerId);
    });
  };

  const renderRow = (r, i) => (
    <TouchableOpacity
      key={`${r.day.day}-${i}`}
      style={styles.row}
      onPress={() => onSelectDay(r.day)}
      activeOpacity={0.75}
    >
      <View style={styles.dateBox}>
        <Text style={styles.dateNum} allowFontScaling={false}>{r.day.day}</Text>
        <Text
          style={styles.dateVar}
          allowFontScaling={false}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.85}
        >
          {language === 'hi'
            ? WEEKDAYS_HI[r.day.weekday]
            : WEEKDAYS_EN_SHORT[r.day.weekday]}
        </Text>
      </View>

      <View style={styles.body}>
        <Text style={[styles.time, { color: accent }]} allowFontScaling={false}>
          {formatTime(r.start)} {t('से')} {formatTime(r.end)}
        </Text>
        <Text style={styles.sub} numberOfLines={1}>
          {r.day.tithiName} · {r.day.nakshatra}
        </Text>
      </View>

      <Ionicons name="chevron-forward" size={16} color={Colors.textDim} />
    </TouchableOpacity>
  );

  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <MaterialCommunityIcons name="clock-outline" size={17} color={accent} />
        <Text style={styles.title}>{t('मुहूर्त खोज')} · {monthName} {year}</Text>
      </View>

      <Text style={styles.note}>
        मुहूर्त चुनें — पूरे महीने में उसके दिन व समय लिस्ट हो जाएँगे। किसी दिन पर
        टैप करें तो उस दिन का पूरा पंचांग खुल जाएगा।
      </Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipRow}
      >
        {MUHURT_TYPES.map((t) => {
          const on = t.id === selected;
          const tone = t.good ? SHUBH : ASHUBH;
          return (
            <TouchableOpacity
              key={t.id}
              style={[styles.chip, on && styles.chipOn, { borderColor: on ? tone : 'rgba(51, 65, 85, 0.8)' }]}
              onPress={() => setSelected(t.id)}
              activeOpacity={0.8}
            >
              <Text
                style={[styles.chipText, on && { color: tone }]}
                allowFontScaling={false}
              >
                {t.hi}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={styles.countRow}>
        <Ionicons name="time-outline" size={12} color={accent} />
        <Text style={[styles.countText, { color: accent }]} allowFontScaling={false}>
          {type.hi} — {rows.length} {language === 'hi' ? 'बार इस महीने' : 'times this month'}
        </Text>
      </View>

      {rows.length === 0 ? (
        <Text style={styles.empty}>इस महीने यह मुहूर्त नहीं मिला।</Text>
      ) : (
        <>
          {rows.slice(0, ROW_PREVIEW_LIMIT).map(renderRow)}

          {hiddenCount > 0 ? (
            <>
              <View style={styles.revealWrap}>
                {/* Off-flow measurement copy — outside the clipped container */}
                <View
                  pointerEvents="none"
                  accessible={false}
                  importantForAccessibility="no-hide-descendants"
                  style={styles.measureGhost}
                  onLayout={onHiddenLayout}
                >
                  {hiddenRows.map(renderRow)}
                </View>

                <Animated.View
                  style={[
                    styles.hiddenRows,
                    {
                      maxHeight: anim,
                      opacity: anim.interpolate({
                        inputRange: [0, expandTarget],
                        outputRange: [0, 1],
                        extrapolate: 'clamp',
                      }),
                    },
                  ]}
                >
                  {hiddenRows.map(renderRow)}
                </Animated.View>
              </View>

              <TouchableOpacity style={styles.moreBtn} onPress={toggle} activeOpacity={0.8}>
                <Text style={styles.moreBtnText} allowFontScaling={false}>
                  {expanded ? t('View Less') : t('View More')}
                  {!expanded ? ` (${hiddenCount})` : null}
                </Text>
                <MaterialCommunityIcons
                  name={expanded ? 'chevron-up' : 'chevron-down'}
                  size={16}
                  color="#FDBA74"
                />
              </TouchableOpacity>
            </>
          ) : null}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.bgSecondary,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(51, 65, 85, 0.65)',
    padding: 14,
    marginTop: 12,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  title: {
    marginLeft: 7,
    fontSize: 14.5,
    fontWeight: '900',
    color: '#E2E8F0',
  },
  note: {
    fontSize: 10.5,
    lineHeight: 15,
    color: Colors.textDim,
    marginBottom: 10,
  },
  chipRow: {
    paddingRight: 6,
    paddingBottom: 8,
  },
  chip: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 7,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
  },
  chipOn: {
    backgroundColor: 'rgba(251, 146, 60, 0.12)',
  },
  chipText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#CBD5E1',
  },
  countRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  countText: {
    marginLeft: 6,
    fontSize: 11.5,
    fontWeight: '900',
  },
  empty: {
    fontSize: 12,
    color: Colors.textDim,
    paddingVertical: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(51, 65, 85, 0.45)',
  },
  dateBox: {
    width: 34,
    alignItems: 'center',
  },
  dateNum: {
    fontSize: 14,
    fontWeight: '900',
    color: '#FDE68A',
  },
  dateVar: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.textDim,
  },
  body: {
    flex: 1,
    marginLeft: 10,
  },
  time: {
    fontSize: 12.5,
    fontWeight: '900',
  },
  timeTo: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textDim,
  },
  sub: {
    marginTop: 1,
    fontSize: 10.5,
    color: '#94A3B8',
  },

  // Reveal animation — same pattern as the festival list above
  revealWrap: {
    position: 'relative',
  },
  measureGhost: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    opacity: 0,
  },
  hiddenRows: {
    overflow: 'hidden',
  },
  moreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: 10,
    paddingVertical: 9,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: 'rgba(251, 186, 116, 0.35)',
    backgroundColor: 'rgba(251, 146, 60, 0.10)',
  },
  moreBtnText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#FDBA74',
  },
});
