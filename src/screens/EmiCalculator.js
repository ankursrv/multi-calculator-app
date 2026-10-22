import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Colors } from '../theme/colors';

export default function EmiCalculator() {
  const [loanAmount, setLoanAmount] = useState('500000');
  const [interestRate, setInterestRate] = useState('9.5');
  const [tenureYears, setTenureYears] = useState('5');

  const p = parseFloat(loanAmount) || 0;
  const rAnnual = parseFloat(interestRate) || 0;
  const tYears = parseFloat(tenureYears) || 0;

  // Monthly interest rate
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
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* EMI Result Hero */}
      <View style={styles.heroCard}>
        <Text style={styles.heroSubText}>Har Mahine Ki EMI (Monthly EMI):</Text>
        <Text style={styles.heroEmi}>₹{Math.round(emi).toLocaleString('en-IN')}</Text>

        <View style={styles.heroStatsRow}>
          <View style={styles.heroStat}>
            <Text style={styles.statLabel}>Kul Byaj (Total Interest):</Text>
            <Text style={[styles.statVal, { color: Colors.accent }]}>
              ₹{Math.round(totalInterest).toLocaleString('en-IN')}
            </Text>
          </View>
          <View style={styles.heroStat}>
            <Text style={styles.statLabel}>Kul Rashi (Total Amount):</Text>
            <Text style={[styles.statVal, { color: Colors.primary }]}>
              ₹{Math.round(totalPayment).toLocaleString('en-IN')}
            </Text>
          </View>
        </View>
      </View>

      {/* Input Card */}
      <View style={styles.card}>
        {/* Loan Amount */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Loan Amount (Mool Rashi):</Text>
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
          <Text style={styles.label}>Byaj Dar (Annual Interest Rate %):</Text>
          <View style={styles.inputPrefixWrap}>
            <Text style={styles.prefix}>%</Text>
            <TextInput
              style={[styles.input, { color: Colors.accent }]}
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
          <Text style={styles.label}>Samay / Avadhi (Tenure in Years):</Text>
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
          <Text style={styles.breakdownTitle}>Loan vs Byaj Anupaat (Ratio):</Text>
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
              <View style={[styles.legendDot, { backgroundColor: Colors.primary }]} />
              <Text style={styles.legendText}>
                Mool Dhan ({totalPayment > 0 ? ((p / totalPayment) * 100).toFixed(0) : 0}%)
              </Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: Colors.accent }]} />
              <Text style={styles.legendText}>
                Byaj ({totalPayment > 0 ? ((totalInterest / totalPayment) * 100).toFixed(0) : 0}%)
              </Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: Colors.bg,
  },
  heroCard: {
    backgroundColor: '#1E253B',
    borderRadius: 20,
    padding: 22,
    borderWidth: 1.5,
    borderColor: Colors.purple,
    alignItems: 'center',
    marginBottom: 16,
  },
  heroSubText: {
    fontSize: 14,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  heroEmi: {
    fontSize: 42,
    fontWeight: '800',
    color: Colors.text,
    marginVertical: 6,
  },
  heroStatsRow: {
    flexDirection: 'row',
    width: '100%',
    paddingTop: 14,
    marginTop: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'space-around',
  },
  heroStat: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    marginBottom: 2,
  },
  statVal: {
    fontSize: 15,
    fontWeight: '700',
  },
  card: {
    backgroundColor: Colors.cardBg,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 6,
  },
  inputPrefixWrap: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
  },
  prefix: {
    position: 'absolute',
    left: 14,
    zIndex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textMuted,
  },
  input: {
    flex: 1,
    backgroundColor: Colors.bg,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderRadius: 12,
    paddingLeft: 36,
    paddingRight: 14,
    paddingVertical: 12,
    color: Colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  chip: {
    backgroundColor: Colors.cardHighlight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  chipActive: {
    backgroundColor: Colors.purpleBg,
    borderColor: Colors.purple,
  },
  chipText: {
    color: Colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  chipTextActive: {
    color: Colors.purple,
    fontWeight: '700',
  },
  breakdownBox: {
    backgroundColor: Colors.bg,
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
    height: 12,
    borderRadius: 6,
    overflow: 'hidden',
  },
  barPrincipal: {
    backgroundColor: Colors.primary,
  },
  barInterest: {
    backgroundColor: Colors.accent,
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
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '600',
  },
});
