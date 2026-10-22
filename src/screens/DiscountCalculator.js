import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';

export default function DiscountCalculator() {
  const [originalPrice, setOriginalPrice] = useState('1500');
  const [discountPercent, setDiscountPercent] = useState('20');
  const [gstPercent, setGstPercent] = useState('0'); // 0, 5, 12, 18, 28

  const price = parseFloat(originalPrice) || 0;
  const discount = parseFloat(discountPercent) || 0;
  const gst = parseFloat(gstPercent) || 0;

  const discountAmount = (price * discount) / 100;
  const discountedPrice = Math.max(0, price - discountAmount);
  const gstAmount = (discountedPrice * gst) / 100;
  const finalPrice = discountedPrice + gstAmount;
  const totalSavings = discountAmount;

  const quickDiscounts = ['5', '10', '15', '20', '25', '30', '40', '50'];
  const gstOptions = ['0', '5', '12', '18', '28'];

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Result Hero Card */}
      <View style={styles.heroCard}>
        <Text style={styles.heroSubText}>Aapko Dena Hoga (Final Price):</Text>
        <Text style={styles.heroPrice}>₹{finalPrice.toFixed(2)}</Text>

        <View style={styles.savingsBanner}>
          <Ionicons name="sparkles" size={16} color={Colors.primary} />
          <Text style={styles.savingsText}>
            Aapki Bachat: ₹{totalSavings.toFixed(2)} ({discountPercent}% OFF)
          </Text>
        </View>

        {gst > 0 && (
          <Text style={styles.gstNote}>
            (Includes {gst}% GST: +₹{gstAmount.toFixed(2)})
          </Text>
        )}
      </View>

      {/* Input Card */}
      <View style={styles.card}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Asli Daam (Original Price):</Text>
          <View style={styles.inputWithPrefix}>
            <Text style={styles.prefix}>₹</Text>
            <TextInput
              style={styles.input}
              value={originalPrice}
              onChangeText={setOriginalPrice}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor={Colors.textDim}
            />
          </View>
        </View>

        {/* Discount % */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Discount (% Chhoot):</Text>
          <View style={styles.inputWithPrefix}>
            <Text style={styles.prefix}>%</Text>
            <TextInput
              style={[styles.input, { color: Colors.accent }]}
              value={discountPercent}
              onChangeText={setDiscountPercent}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor={Colors.textDim}
            />
          </View>

          {/* Quick discount chips */}
          <View style={styles.chipsRow}>
            {quickDiscounts.map((val) => (
              <TouchableOpacity
                key={val}
                style={[styles.chip, discountPercent === val && styles.chipActive]}
                onPress={() => setDiscountPercent(val)}
              >
                <Text style={[styles.chipText, discountPercent === val && styles.chipTextActive]}>
                  {val}%
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Optional GST % */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>GST Tax (Agar lagna ho to):</Text>
          <View style={styles.chipsRow}>
            {gstOptions.map((val) => (
              <TouchableOpacity
                key={val}
                style={[
                  styles.chip,
                  gstPercent === val && { backgroundColor: Colors.secondaryBg, borderColor: Colors.secondary },
                ]}
                onPress={() => setGstPercent(val)}
              >
                <Text
                  style={[
                    styles.chipText,
                    gstPercent === val && { color: Colors.secondary, fontWeight: '700' },
                  ]}
                >
                  {val === '0' ? 'No GST' : `${val}% GST`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Summary Breakdown */}
        <View style={styles.breakdown}>
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>Original MRP:</Text>
            <Text style={styles.breakdownVal}>₹{price.toFixed(2)}</Text>
          </View>
          <View style={styles.breakdownRow}>
            <Text style={[styles.breakdownLabel, { color: Colors.primary }]}>Discount ({discount}%):</Text>
            <Text style={[styles.breakdownVal, { color: Colors.primary }]}>- ₹{discountAmount.toFixed(2)}</Text>
          </View>
          {gst > 0 && (
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>GST ({gst}%):</Text>
              <Text style={styles.breakdownVal}>+ ₹{gstAmount.toFixed(2)}</Text>
            </View>
          )}
          <View style={[styles.breakdownRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Final Amount:</Text>
            <Text style={styles.totalVal}>₹{finalPrice.toFixed(2)}</Text>
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
    backgroundColor: '#1E2333',
    borderRadius: 20,
    padding: 22,
    borderWidth: 1.5,
    borderColor: Colors.accent,
    alignItems: 'center',
    marginBottom: 16,
  },
  heroSubText: {
    fontSize: 14,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  heroPrice: {
    fontSize: 44,
    fontWeight: '800',
    color: Colors.text,
    marginVertical: 4,
  },
  savingsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryBg,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
    marginTop: 6,
  },
  savingsText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  gstNote: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 8,
  },
  card: {
    backgroundColor: Colors.cardBg,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  inputGroup: {
    marginBottom: 18,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 6,
  },
  inputWithPrefix: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
  },
  prefix: {
    position: 'absolute',
    left: 14,
    zIndex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textMuted,
  },
  input: {
    flex: 1,
    backgroundColor: Colors.bg,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderRadius: 12,
    paddingLeft: 34,
    paddingRight: 14,
    paddingVertical: 12,
    color: Colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  chip: {
    backgroundColor: Colors.cardHighlight,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  chipActive: {
    backgroundColor: Colors.accentBg,
    borderColor: Colors.accent,
  },
  chipText: {
    color: Colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  chipTextActive: {
    color: Colors.accent,
    fontWeight: '700',
  },
  breakdown: {
    backgroundColor: Colors.bg,
    borderRadius: 14,
    padding: 14,
    marginTop: 4,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  breakdownLabel: {
    color: Colors.textMuted,
    fontSize: 13,
  },
  breakdownVal: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: Colors.cardBorder,
    marginTop: 6,
    paddingTop: 8,
  },
  totalLabel: {
    color: Colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  totalVal: {
    color: Colors.primary,
    fontSize: 17,
    fontWeight: '800',
  },
});
