import React, { useState, useMemo } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { MUHURT_TYPES, findMuhurtasInMonth, formatTime, WEEKDAYS_HI } from '../utils/hinduPanchang';

const SHUBH = '#6EE7B7';
const ASHUBH = '#FDA4AF';

/**
 * मुहूर्त खोज — "इस महीने अमृत काल / अभिजित / राहुकाल कब-कब है?"
 * Times come from the same day objects the grid and the day sheet use.
 */
export default function MuhurtSearch({ days, monthName, year, onSelectDay }) {
  const [selected, setSelected] = useState('amritKala');

  const type = MUHURT_TYPES.find((t) => t.id === selected) || MUHURT_TYPES[0];
  const accent = type.good ? SHUBH : ASHUBH;

  const rows = useMemo(() => findMuhurtasInMonth(days, selected), [days, selected]);

  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <MaterialCommunityIcons name="clock-outline" size={17} color={accent} />
        <Text style={styles.title}>मुहूर्त खोज · {monthName} {year}</Text>
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
          {type.hi} — {rows.length} बार इस महीने
        </Text>
      </View>

      {rows.length === 0 ? (
        <Text style={styles.empty}>इस महीने यह मुहूर्त नहीं मिला।</Text>
      ) : (
        rows.map((r, i) => (
          <TouchableOpacity
            key={`${r.day.day}-${i}`}
            style={styles.row}
            onPress={() => onSelectDay(r.day)}
            activeOpacity={0.75}
          >
            <View style={styles.dateBox}>
              <Text style={styles.dateNum} allowFontScaling={false}>{r.day.day}</Text>
              <Text style={styles.dateVar} allowFontScaling={false}>
                {WEEKDAYS_HI[r.day.weekday]}
              </Text>
            </View>

            <View style={styles.body}>
              <Text style={[styles.time, { color: accent }]} allowFontScaling={false}>
                {formatTime(r.start)} <Text style={styles.timeTo}>से</Text> {formatTime(r.end)}
              </Text>
              <Text style={styles.sub} numberOfLines={1}>
                {r.day.tithiName} · {r.day.nakshatra}
              </Text>
            </View>

            <Ionicons name="chevron-forward" size={16} color={Colors.textDim} />
          </TouchableOpacity>
        ))
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
});
