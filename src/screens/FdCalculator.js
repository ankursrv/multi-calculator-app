import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import ScreenHeader from '../components/ScreenHeader';
import FdHeroIllustration from '../components/FdHeroIllustration';

// ---- simple tenure helpers (no date pickers, no external dependency) ----
const DAY_MS = 24 * 60 * 60 * 1000;
const TODAY = new Date();
TODAY.setHours(0, 0, 0, 0);

const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const formatTenureDays = (days) => {
  const years = Math.floor(days / 365);
  const months = Math.floor((days - years * 365) / 30.44);
  const remDays = Math.max(days - years * 365 - months * 30, 0);
  return `${years} साल ${months} महीने ${remDays} दिन`;
};

const maturityDateText = (days) => {
  const d = new Date(TODAY.getTime() + days * DAY_MS);
  const dd = String(d.getDate()).padStart(2, '0');
  return `${dd} ${MONTH_SHORT[d.getMonth()]} ${d.getFullYear()}`;
};
// -------------------------------------------------------------------------

const UNITS = [
  { id: 'day', label: 'दिन' },
  { id: 'month', label: 'महीने' },
  { id: 'year', label: 'साल' },
];

// FDs are usually quarterly compounding — kept fixed so user doesn't get confused
const COMPOUNDING_FREQ = 4;

// Convert tenure (value + unit) into tenure days
const tenureToDays = (value, unit) => {
  const v = parseFloat(value) || 0;
  if (unit === 'day') return Math.round(v);
  if (unit === 'month') return Math.round(v * 30.44);
  return Math.round(v * 365.25);
};

export default function FdCalculator({ onBack }) {
  const [amount, setAmount] = useState('');
  const [rate, setRate] = useState('');
  const [tenure, setTenure] = useState('');   // manually entered tenure value
  const [unit, setUnit] = useState('year');   // day | month | year

  const P = parseFloat(amount) || 0;
  const R = parseFloat(rate) || 0;

  const days = tenureToDays(tenure, unit);

  // Compound interest: A = P (1 + r/n)^(n×t)
  let maturityAmount = 0;
  if (P > 0 && R > 0 && days > 0) {
    maturityAmount = P * Math.pow(1 + R / 100 / COMPOUNDING_FREQ, COMPOUNDING_FREQ * (days / 365.25));
  }
  const interestEarned = Math.max(maturityAmount - P, 0);

  return (
    <View style={styles.container}>
      {/* Fixed Header with subtle shadow fade */}
      <ScreenHeader
        title="FD Calculator"
        subtitle="अवधि एफडी · ब्याज और मैच्योरिटी हिसाब"
        icon="bank"
        theme="blue"
        onBack={onBack}
        onReset={() => {
          setAmount('');
          setRate('');
          setTenure('');
          setUnit('year');
        }}
      />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>

        {/* Hero Card — deep banking blue gradient + bank watermark */}
        <View style={styles.heroCard}>
          <LinearGradient
            colors={['#1D4ED8', '#1E40AF', '#0C2A66']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <FdHeroIllustration />
          <Text style={styles.heroSubText} allowFontScaling={false}>मैच्योरिटी पर मिलेगी (Maturity Amount):</Text>
          <Text style={styles.heroMain} allowFontScaling={false}>₹{Math.round(maturityAmount).toLocaleString('en-IN')}</Text>

          <View style={styles.heroStatsRow}>
            <View style={styles.heroStat}>
              <Text style={styles.statLabel} allowFontScaling={false}>कुल ब्याज (Interest):</Text>
              <Text style={styles.statVal} allowFontScaling={false}>₹{Math.round(interestEarned).toLocaleString('en-IN')}</Text>
            </View>
            <View style={styles.heroStat}>
              <Text style={styles.statLabel} allowFontScaling={false}>आपकी निवेश राशि:</Text>
              <Text style={styles.statVal} allowFontScaling={false}>₹{(Math.round(P) || 0).toLocaleString('en-IN')}</Text>
            </View>
          </View>

          <View style={styles.heroDivider} />
          <Text style={styles.heroTenorText} allowFontScaling={false}>
            {days > 0
              ? `⏳ अवधि: ${formatTenureDays(days)} · ${maturityDateText(days)} को मैच्योर`
              : '⏳ नीचे अवधि डालें (जैसे 1 साल, 6 महीने, 30 दिन)'}
          </Text>
        </View>

        {/* Input Card */}
        <View style={styles.card}>
          {/* Deposit Amount */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>जमा राशि (Deposit Amount):</Text>
            <View style={styles.inputPrefixWrap}>
              <Text style={styles.prefix}>₹</Text>
              <TextInput
                style={styles.input}
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
                placeholder="Enter amount"
                placeholderTextColor={Colors.placeholderHint}
              />
            </View>
          </View>

          {/* Interest Rate */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>ब्याज दर (Annual Interest Rate %):</Text>
            <View style={styles.inputPrefixWrap}>
              <Text style={styles.prefix}>%</Text>
              <TextInput
                style={[styles.input, { color: '#7DD3FC' }]}
                value={rate}
                onChangeText={setRate}
                keyboardType="numeric"
                placeholder="Enter rate (e.g. 7.1)"
                placeholderTextColor={Colors.placeholderHint}
              />
            </View>
          </View>

          {/* Tenure: manual entry + unit toggle */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>अवधि (Duration):</Text>
            <View style={styles.tenureRow}>
              <TextInput
                style={[styles.input, styles.tenureInput]}
                value={tenure}
                onChangeText={setTenure}
                keyboardType="numeric"
                placeholder="e.g. 1, 6, 30"
                placeholderTextColor={Colors.placeholderHint}
              />
              <View style={styles.unitRow}>
                {UNITS.map((u) => {
                  const active = unit === u.id;
                  return (
                    <TouchableOpacity
                      key={u.id}
                      style={[styles.unitBtn, active && styles.unitBtnActive]}
                      onPress={() => setUnit(u.id)}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.unitText, active && styles.unitTextActive]}>{u.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>

          {/* Principal vs Interest breakdown bar */}
          <View style={styles.breakdownBox}>
            <Text style={styles.breakdownTitle}>जमा राशि vs ब्याज अनुपात:</Text>
            <View style={styles.bar}>
              <View
                style={[
                  styles.barPrincipal,
                  { flex: maturityAmount > 0 ? (P / maturityAmount) * 100 : 50 },
                ]}
              />
              <View
                style={[
                  styles.barInterest,
                  { flex: maturityAmount > 0 ? (interestEarned / maturityAmount) * 100 : 50 },
                ]}
              />
            </View>
            <View style={styles.legendRow}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#38BDF8' }]} />
                <Text style={styles.legendText}>
                  जमा राशि ({maturityAmount > 0 ? ((P / maturityAmount) * 100).toFixed(0) : 0}%)
                </Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#1E3A8A' }]} />
                <Text style={styles.legendText}>
                  ब्याज ({maturityAmount > 0 ? ((interestEarned / maturityAmount) * 100).toFixed(0) : 0}%)
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Info note */}
        <View style={styles.infoBox}>
          <View style={styles.infoTitleRow}>
            <Ionicons name="information-circle" size={16} color="#38BDF8" />
            <Text style={styles.infoTitle}>FD हिसाब कैसे काम करता है?</Text>
          </View>
          <Text style={styles.infoDesc}>
            अवधि के दिन/महीने/साल में value डालें और तुरंत ब्याज देखें।
            ब्याज त्रैमासिक (quarterly) चक्रवृद्धि से निकाला जाता है — जैसा ज़्यादातर बैंक देते हैं।
            यह अनुमानित हिसाब है, वास्तविक ब्याज दर आपके बैंक पर निर्भर करती है।
          </Text>
        </View>
      </ScrollView>
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
    paddingTop: 16,
    paddingBottom: 80,
  },
  heroCard: {
    borderRadius: 20,
    padding: 22,
    alignItems: 'center',
    marginBottom: 16,
    overflow: 'hidden',
  },
  heroSubText: {
    fontSize: 13,
    lineHeight: 19,
    includeFontPadding: false,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '600',
  },
  heroMain: {
    fontSize: 40,
    lineHeight: 50,
    includeFontPadding: false,
    fontWeight: '900',
    color: '#FFFFFF',
    marginVertical: 4,
  },
  heroStatsRow: {
    flexDirection: 'row',
    width: '100%',
    paddingTop: 12,
    marginTop: 6,
    justifyContent: 'space-around',
  },
  heroStat: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 11,
    lineHeight: 16,
    includeFontPadding: false,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 2,
  },
  statVal: {
    fontSize: 15,
    lineHeight: 21,
    includeFontPadding: false,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  heroDivider: {
    alignSelf: 'stretch',
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginTop: 12,
  },
  heroTenorText: {
    fontSize: 12,
    lineHeight: 18,
    includeFontPadding: false,
    fontWeight: '600',
    color: '#BAE6FD',
    marginTop: 10,
    textAlign: 'center',
  },
  card: {
    backgroundColor: Colors.cardBg,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textMuted,
    marginBottom: 6,
  },
  inputPrefixWrap: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
  },
  prefix: {
    position: 'absolute',
    left: 12,
    zIndex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: '#38BDF8',
  },
  input: {
    flex: 1,
    backgroundColor: 'rgba(11, 15, 25, 0.7)',
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderRadius: 12,
    paddingLeft: 32,
    paddingRight: 12,
    paddingVertical: 10,
    color: Colors.text,
    fontSize: 17,
    fontWeight: '700',
  },
  tenureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tenureInput: {
    paddingLeft: 12,
    flex: 1,
  },
  unitRow: {
    flexDirection: 'row',
    gap: 6,
  },
  unitBtn: {
    backgroundColor: 'rgba(11, 15, 25, 0.8)',
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderRadius: 10,
    paddingVertical: 9,
    paddingHorizontal: 10,
  },
  unitBtnActive: {
    borderColor: '#38BDF8',
    backgroundColor: 'rgba(56, 189, 248, 0.14)',
  },
  unitText: {
    color: Colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  unitTextActive: {
    color: '#7DD3FC',
  },
  breakdownBox: {
    backgroundColor: 'rgba(11, 15, 25, 0.7)',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    marginTop: 4,
  },
  breakdownTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textMuted,
    marginBottom: 10,
  },
  bar: {
    flexDirection: 'row',
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
  },
  barPrincipal: {
    backgroundColor: '#38BDF8',
  },
  barInterest: {
    backgroundColor: '#1E3A8A',
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  infoBox: {
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  infoTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  infoTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#7DD3FC',
  },
  infoDesc: {
    fontSize: 12,
    color: Colors.textMuted,
    lineHeight: 18,
  },
});
