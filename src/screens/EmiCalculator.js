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
import { Colors } from '../theme/colors';
import ScreenHeader from '../components/ScreenHeader';

export default function EmiCalculator() {
  const [loanAmount, setLoanAmount] = useState('500000');
  const [interestRate, setInterestRate] = useState('9.5');
  const [tenureYears, setTenureYears] = useState('5');

  const p = parseFloat(loanAmount) || 0;
  const rAnnual = parseFloat(interestRate) || 0;
  const tYears = parseFloat(tenureYears) || 0;

  const r = rAnnual / 12 / 100;
  const n = tYears * 12;

  let emi = 0;
  let totalPayment = 0;
  let totalInterest = 0;

  if (p > 0 && r > 0 && n > 0) {
    emi = (p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    totalPayment = emi * n;
    totalInterest = totalPayment - p;
  }

  const quickLoans = [
    { label: '₹1 Lakh', val: '100000' },
    { label: '₹5 Lakh', val: '500000' },
    { label: '₹10 Lakh', val: '1000000' },
    { label: '₹25 Lakh', val: '2500000' },
  ];

  return (
    <View style={styles.container}>
      {/* Fixed Header with subtle shadow fade */}
      <ScreenHeader
        title="Loan & EMI"
        subtitle="मासिक किस्त एवं ब्याज हिसाब"
        icon="bank"
      />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>

      {/* Hero Card */}
      <LinearGradient
        colors={Colors.gradientCardColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.heroCard}
      >
        <Text style={styles.heroSubText}>हर महीने की EMI (Monthly EMI):</Text>
        <Text style={styles.heroEmi}>₹{Math.round(emi).toLocaleString('en-IN')}</Text>

        <View style={styles.heroStatsRow}>
          <View style={styles.heroStat}>
            <Text style={styles.statLabel}>कुल ब्याज (Total Interest):</Text>
            <Text style={styles.statVal}>
              ₹{Math.round(totalInterest).toLocaleString('en-IN')}
            </Text>
          </View>
          <View style={styles.heroStat}>
            <Text style={styles.statLabel}>कुल राशि (Total Amount):</Text>
            <Text style={styles.statVal}>
              ₹{Math.round(totalPayment).toLocaleString('en-IN')}
            </Text>
          </View>
        </View>
      </LinearGradient>

      {/* Input Card */}
      <View style={styles.card}>
        {/* Loan Amount */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>लोन राशि (Principal Amount):</Text>
          <View style={styles.inputPrefixWrap}>
            <Text style={styles.prefix}>₹</Text>
            <TextInput
              style={styles.input}
              value={loanAmount}
              onChangeText={setLoanAmount}
              keyboardType="numeric"
              placeholder="500000"
              placeholderTextColor={Colors.textDim}
            />
          </View>

          <View style={styles.chipRow}>
            {quickLoans.map((item) => (
              <TouchableOpacity
                key={item.label}
                style={[styles.chip, loanAmount === item.val && styles.chipActive]}
                onPress={() => setLoanAmount(item.val)}
              >
                <Text style={[styles.chipText, loanAmount === item.val && styles.chipTextActive]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Interest Rate */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>ब्याज दर (Annual Interest Rate %):</Text>
          <View style={styles.inputPrefixWrap}>
            <Text style={styles.prefix}>%</Text>
            <TextInput
              style={[styles.input, { color: Colors.amber }]}
              value={interestRate}
              onChangeText={setInterestRate}
              keyboardType="numeric"
              placeholder="9.5"
              placeholderTextColor={Colors.textDim}
            />
          </View>
        </View>

        {/* Tenure */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>अवधि (Tenure in Years):</Text>
          <View style={styles.inputPrefixWrap}>
            <Text style={styles.prefix}>📅</Text>
            <TextInput
              style={styles.input}
              value={tenureYears}
              onChangeText={setTenureYears}
              keyboardType="numeric"
              placeholder="5"
              placeholderTextColor={Colors.textDim}
            />
          </View>
        </View>

        {/* Breakdown bar */}
        <View style={styles.breakdownBox}>
          <Text style={styles.breakdownTitle}>मूलधन vs ब्याज अनुपात:</Text>
          <View style={styles.bar}>
            <View
              style={[
                styles.barPrincipal,
                { flex: totalPayment > 0 ? (p / totalPayment) * 100 : 50 },
              ]}
            />
            <View
              style={[
                styles.barInterest,
                { flex: totalPayment > 0 ? (totalInterest / totalPayment) * 100 : 50 },
              ]}
            />
          </View>
          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: Colors.amber }]} />
              <Text style={styles.legendText}>
                मूलधन ({totalPayment > 0 ? ((p / totalPayment) * 100).toFixed(0) : 0}%)
              </Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: Colors.orange }]} />
              <Text style={styles.legendText}>
                ब्याज ({totalPayment > 0 ? ((totalInterest / totalPayment) * 100).toFixed(0) : 0}%)
              </Text>
            </View>
          </View>
        </View>
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
  },
  heroSubText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '600',
  },
  heroEmi: {
    fontSize: 42,
    fontWeight: '900',
    color: '#FFFFFF',
    marginVertical: 4,
  },
  heroStatsRow: {
    flexDirection: 'row',
    width: '100%',
    paddingTop: 12,
    marginTop: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'space-around',
  },
  heroStat: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 2,
  },
  statVal: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
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
    color: Colors.amber,
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
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  chip: {
    backgroundColor: 'rgba(11, 15, 25, 0.8)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  chipActive: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    borderColor: Colors.amber,
  },
  chipText: {
    color: Colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  chipTextActive: {
    color: Colors.amber,
    fontWeight: '800',
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
    backgroundColor: Colors.amber,
  },
  barInterest: {
    backgroundColor: Colors.orange,
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
});
