import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { getGrahaRashiChakra, monthNameHi } from '../utils/hinduPanchang';

// Moon is the graha a rashifal is actually read from, so it gets the highlight
const HIGHLIGHT = 'Moon';

/**
 * ग्रह राशि-चक्र — the sidereal position of the nine grahas for the selected
 * day, exactly the chart a printed panchang prints. Only computed astronomy is
 * shown here (no invented predictions), which keeps it verifiable.
 */
export default function GrahaRashiChakra({ day, city }) {
  const chart = useMemo(
    () => (day ? getGrahaRashiChakra(day.year, day.month, day.day, city) : null),
    [day, city],
  );

  if (!chart || !chart.grahas.length) return null;

  const moon = chart.grahas.find((g) => g.id === HIGHLIGHT);

  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <Ionicons name="planet" size={17} color="#C4B5FD" />
        <Text style={styles.title}>ग्रह राशि-चक्र · {day.day} {monthNameHi(day.month)}</Text>
      </View>

      <Text style={styles.note}>
        खगोलीय स्थिति (मध्याह्न 12 बजे IST) — राशि, अंश व वक्री भाव। छपने वाले
        पंचांग के ग्रह-चक्र जैसी शुद्ध गणना, भविष्यवाणी नहीं।
      </Text>

      {moon ? (
        <LinearGradient
          colors={['#1B1634', '#3A1E70']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.moonBand}
        >
          <Ionicons name="moon" size={14} color="#DDD6FE" />
          <Text style={styles.moonLabel} allowFontScaling={false}>चन्द्र राशि (राशिफल का आधार)</Text>
          <Text style={styles.moonValue} allowFontScaling={false}>{moon.rashi}</Text>
        </LinearGradient>
      ) : null}

      <View style={styles.grid}>
        {chart.grahas.map((g) => {
          const isMoon = g.id === HIGHLIGHT;
          return (
            <View key={g.id} style={styles.cell}>
              <Text style={[styles.grahName, isMoon && styles.grahNameMoon]} allowFontScaling={false}>
                {g.name}
              </Text>
              <Text
                style={[styles.grahRashi, isMoon && styles.grahRashiMoon]}
                allowFontScaling={false}
                numberOfLines={1}
              >
                {g.rashi}
              </Text>
              <View style={styles.grahFoot}>
                <Text style={styles.grahDeg} allowFontScaling={false}>{g.degrees}</Text>
                {g.retrograde ? (
                  <Text style={styles.grahVakri} allowFontScaling={false}>वक्री</Text>
                ) : null}
              </View>
            </View>
          );
        })}
      </View>
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
  moonBand: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 11,
    paddingVertical: 9,
    marginBottom: 11,
  },
  moonLabel: {
    flex: 1,
    marginLeft: 7,
    fontSize: 10.5,
    fontWeight: '800',
    color: '#DDD6FE',
  },
  moonValue: {
    fontSize: 13.5,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cell: {
    width: '33.33%',
    paddingRight: 8,
    marginBottom: 8,
  },
  grahName: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.textDim,
  },
  grahNameMoon: {
    color: '#C4B5FD',
  },
  grahRashi: {
    marginTop: 1,
    fontSize: 13,
    fontWeight: '900',
    color: '#FDE68A',
  },
  grahRashiMoon: {
    color: '#DDD6FE',
  },
  grahFoot: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 1,
  },
  grahDeg: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#94A3B8',
  },
  grahVakri: {
    marginLeft: 5,
    fontSize: 9,
    fontWeight: '900',
    color: '#FDA4AF',
  },
});
