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

export default function DiscountCalculator() {
  const [originalPrice, setOriginalPrice] = useState('1500');
  const [discountPercent, setDiscountPercent] = useState('20');
  const [gstPercent, setGstPercent] = useState('0');

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
    <View style={styles.container}>
      {/* Fixed Header with subtle shadow fade */}
      <ScreenHeader
        title="Discount & GST"
        subtitle="छूट और टैक्स की त्वरित गणना"
        icon="sale"
      />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>

      {/* Hero Result Card */}
      <LinearGradient
        colors={Colors.gradientCardColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.heroCard}
      >
        <Text style={styles.heroSubText}>आपको देना होगा (Final Payable Price):</Text>
        <Text style={styles.heroPrice}>₹{finalPrice.toFixed(2)}</Text>

        <View style={styles.savingsBanner}>
          <Ionicons name="sparkles" size={16} color="#FFFFFF" />
          <Text style={styles.savingsText}>
            कुल बचत: ₹{totalSavings.toFixed(2)} ({discountPercent}% OFF)
          </Text>
        </View>

        {gst > 0 && (
          <Text style={styles.gstNote}>
            (Includes {gst}% GST: +₹{gstAmount.toFixed(2)})
          </Text>
        )}
      </LinearGradient>

      {/* Input Card */}
      <View style={styles.card}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>असली दाम (Original Price):</Text>
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
          <Text style={styles.label}>डिस्काउंट (% छूट):</Text>
          <View style={styles.inputWithPrefix}>
            <Text style={styles.prefix}>%</Text>
            <TextInput
              style={[styles.input, { color: Colors.amber }]}
              value={discountPercent}
              onChangeText={setDiscountPercent}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor={Colors.textDim}
            />
          </View>

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

        {/* GST % */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>GST Tax दर:</Text>
          <View style={styles.chipsRow}>
            {gstOptions.map((val) => (
              <TouchableOpacity
                key={val}
                style={[styles.chip, gstPercent === val && styles.chipActive]}
                onPress={() => setGstPercent(val)}
              >
                <Text style={[styles.chipText, gstPercent === val && styles.chipTextActive]}>
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
            <Text style={[styles.breakdownLabel, { color: Colors.amber }]}>
              Discount ({discount}%):
            </Text>
            <Text style={[styles.breakdownVal, { color: Colors.amber }]}>
              - ₹{discountAmount.toFixed(2)}
            </Text>
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
  heroPrice: {
    fontSize: 44,
    fontWeight: '900',
    color: '#FFFFFF',
    marginVertical: 4,
  },
  savingsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
    marginTop: 6,
  },
  savingsText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  gstNote: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 8,
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
  inputWithPrefix: {
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
    paddingLeft: 30,
    paddingRight: 12,
    paddingVertical: 10,
    color: Colors.text,
    fontSize: 17,
    fontWeight: '700',
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  chip: {
    backgroundColor: 'rgba(11, 15, 25, 0.8)',
    paddingHorizontal: 12,
    paddingVertical: 7,
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
  breakdown: {
    backgroundColor: 'rgba(11, 15, 25, 0.7)',
    borderRadius: 14,
    padding: 14,
    marginTop: 4,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
  },
  breakdownLabel: {
    color: Colors.textMuted,
    fontSize: 13,
  },
  breakdownVal: {
    color: Colors.text,
    fontSize: 13,
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
    fontSize: 14,
    fontWeight: '700',
  },
  totalVal: {
    color: Colors.amber,
    fontSize: 16,
    fontWeight: '800',
  },
});
