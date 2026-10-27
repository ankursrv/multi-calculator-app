import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import ScreenHeader from '../components/ScreenHeader';

export default function KiranaCalculator({ onBack, onSaveToBill }) {
  // Mode: 'priceToWeight' (रुपये से वजन) or 'weightToPrice' (वजन से रुपये)
  const [mode, setMode] = useState('priceToWeight');

  // Input states — sab khaali, taaki hint (placeholder) dikhe
  const [rate, setRate] = useState('');
  const [rateUnit, setRateUnit] = useState('Kilogram'); // Kilogram, 100 Gram, Litre
  const [budget, setBudget] = useState('');
  const [weight, setWeight] = useState('');
  const [weightUnit, setWeightUnit] = useState('Gram'); // Gram, Kilogram, Litre, Millilitre
  const [itemName, setItemName] = useState('चीनी (Sugar)');

  // Unit Dropdown modal
  const [unitModalVisible, setUnitModalVisible] = useState(false);

  const unitsList = [
    { label: 'Kilogram (किलो / 1000g)', val: 'Kilogram', factor: 1000 },
    { label: '100 Gram (100 ग्राम)', val: '100 Gram', factor: 100 },
    { label: '500 Gram (आधा किलो)', val: '500 Gram', factor: 500 },
    { label: 'Litre (लीटर / 1000ml)', val: 'Litre', factor: 1000 },
  ];

  const handleReset = () => {
    setRate('');
    setRateUnit('Kilogram');
    setBudget('');
    setWeight('');
    setWeightUnit('Gram');
    setItemName('चीनी (Sugar)');
  };

  // Base rate calculation per 1000 grams
  const getRatePer1000g = () => {
    const r = parseFloat(rate) || 0;
    if (rateUnit === 'Kilogram' || rateUnit === 'Litre') return r;
    if (rateUnit === '100 Gram') return r * 10;
    if (rateUnit === '500 Gram') return r * 2;
    return r;
  };

  // 1. Calculation: रुपये से वजन
  const calculateQuantity = () => {
    const r = parseFloat(rate) || 0;
    const b = parseFloat(budget) || 0;
    if (r <= 0 || b <= 0) return { grams: '0.00', kg: '0.000', valid: false };

    const ratePer1000g = getRatePer1000g();
    const grams = (b / ratePer1000g) * 1000;
    const kg = grams / 1000;

    return {
      grams: grams.toFixed(2),
      kg: kg.toFixed(3),
      valid: true,
      ratePer1000g,
    };
  };

  // 2. Calculation: वजन से रुपये
  const calculatePrice = () => {
    const r = parseFloat(rate) || 0;
    const w = parseFloat(weight) || 0;
    if (r <= 0 || w <= 0) return { cost: '0.00', valid: false };

    const ratePer1000g = getRatePer1000g();
    let totalGrams = w;
    if (weightUnit === 'Kilogram' || weightUnit === 'Litre') {
      totalGrams = w * 1000;
    }

    const cost = (totalGrams / 1000) * ratePer1000g;
    return {
      cost: cost.toFixed(2),
      totalGrams,
      valid: true,
    };
  };

  const qtyResult = calculateQuantity();
  const priceResult = calculatePrice();

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1 }}
    >
      <View style={styles.container}>
        {/* Fixed Header with subtle shadow fade */}
        <ScreenHeader
          title="Samaan-Bhav & Kirana"
          subtitle="सामान का भाव - वजन और मूल्य कैलकुलेटर"
          icon="scale-bathroom"
          onBack={onBack}
          onReset={handleReset}
        />

        <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>

        {/* Mode Switcher Tabs */}
        <View style={styles.modeTabsCard}>
          {/* Tab 1: रुपये से वजन */}
          <TouchableOpacity
            style={styles.modeTab}
            onPress={() => setMode('priceToWeight')}
            activeOpacity={0.8}
          >
            {mode === 'priceToWeight' ? (
              <LinearGradient
                colors={Colors.gradientColors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.activeTabGradient}
              >
                <Text style={styles.activeTabTitle}>रुपये से वजन</Text>
                <Text style={styles.activeTabSub}>Money ➔ Weight</Text>
              </LinearGradient>
            ) : (
              <View style={styles.inactiveTab}>
                <Text style={styles.inactiveTabTitle}>रुपये से वजन</Text>
                <Text style={styles.inactiveTabSub}>Money ➔ Weight</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Tab 2: वजन से रुपये */}
          <TouchableOpacity
            style={styles.modeTab}
            onPress={() => setMode('weightToPrice')}
            activeOpacity={0.8}
          >
            {mode === 'weightToPrice' ? (
              <LinearGradient
                colors={Colors.gradientColors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.activeTabGradient}
              >
                <Text style={styles.activeTabTitle}>वजन से रुपये</Text>
                <Text style={styles.activeTabSub}>Weight ➔ Money</Text>
              </LinearGradient>
            ) : (
              <View style={styles.inactiveTab}>
                <Text style={styles.inactiveTabTitle}>वजन से रुपये</Text>
                <Text style={styles.inactiveTabSub}>Weight ➔ Money</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* INPUTS CARD (Slate-800/60 with Slate-700 Border) */}
        <View style={styles.inputsCard}>
          {/* Row 1: Market Rate & Per Unit */}
          <View style={styles.inputRow}>
            {/* Market Rate */}
            <View style={{ flex: 1.2 }}>
              <Text style={styles.inputFloatingLabel}>Market Rate (भाव / दर)</Text>
              <View style={styles.fieldBox}>
                <Text style={styles.rupeeSymbol}>₹</Text>
                <TextInput
                  style={[styles.fieldInput, !rate && styles.fieldHint]}
                  value={rate}
                  onChangeText={setRate}
                  keyboardType="numeric"
                  placeholder="Enter rate"
                  placeholderTextColor={Colors.placeholderHint}
                />
              </View>
            </View>

            {/* Per Unit */}
            <View style={{ flex: 1 }}>
              <Text style={styles.inputFloatingLabel}>Per Unit (प्रति)</Text>
              <TouchableOpacity
                style={styles.dropdownBox}
                onPress={() => setUnitModalVisible(true)}
                activeOpacity={0.8}
              >
                <Text style={styles.dropdownText} numberOfLines={1}>
                  {rateUnit}
                </Text>
                <Ionicons name="caret-down" size={14} color={Colors.amber} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Divider */}
          <View style={styles.cardDivider} />

          {/* Row 2: Based on Mode */}
          {mode === 'priceToWeight' ? (
            <View>
              <Text style={styles.inputFloatingLabel}>
                Target Budget / Money (कितने रुपये का चाहिए?)
              </Text>
              <View style={styles.fieldBox}>
                <Text style={styles.rupeeSymbol}>₹</Text>
                <TextInput
                  style={[
                    styles.fieldInput,
                    { color: '#FFFFFF', fontSize: 20 },
                    !budget && styles.fieldHint,
                  ]}
                  value={budget}
                  onChangeText={setBudget}
                  keyboardType="numeric"
                  placeholder="Enter amount"
                  placeholderTextColor={Colors.placeholderHint}
                />
              </View>
            </View>
          ) : (
            <View>
              <Text style={styles.inputFloatingLabel}>
                Kitna Samaan Chahiye (Weight / Quantity):
              </Text>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={[styles.fieldBox, { flex: 1.2 }]}>
                  <TextInput
                    style={[
                      styles.fieldInput,
                      { color: '#FFFFFF', fontSize: 20 },
                      !weight && styles.fieldHint,
                    ]}
                    value={weight}
                    onChangeText={setWeight}
                    keyboardType="numeric"
                    placeholder="Enter weight"
                    placeholderTextColor={Colors.placeholderHint}
                  />
                </View>

                {/* Weight Unit Switch */}
                <View style={[styles.fieldBox, { flex: 1, paddingHorizontal: 4 }]}>
                  <TouchableOpacity
                    style={[
                      styles.weightUnitBtn,
                      weightUnit === 'Gram' && styles.weightUnitBtnActive,
                    ]}
                    onPress={() => setWeightUnit('Gram')}
                  >
                    <Text
                      style={[
                        styles.weightUnitText,
                        weightUnit === 'Gram' && styles.weightUnitTextActive,
                      ]}
                    >
                      Gram (g)
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.weightUnitBtn,
                      weightUnit === 'Kilogram' && styles.weightUnitBtnActive,
                    ]}
                    onPress={() => setWeightUnit('Kilogram')}
                  >
                    <Text
                      style={[
                        styles.weightUnitText,
                        weightUnit === 'Kilogram' && styles.weightUnitTextActive,
                      ]}
                    >
                      Kg (किलो)
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* HERO RESULT CARD (Exact match to Screenshot 2 Amber-500 to Orange-600 Gradient) */}
        <LinearGradient
          colors={Colors.gradientCardColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroResultCard}
        >
          {mode === 'priceToWeight' ? (
            <>
              <Text style={styles.heroLabel}>कुल सामान मिलेगा (Quantity Received):</Text>
              <Text style={styles.heroMainValue}>
                {qtyResult.valid ? `${qtyResult.grams} Gram` : '0.00 Gram'}
              </Text>
              <Text style={styles.heroSubValue}>
                = {qtyResult.valid ? `${qtyResult.kg} Kilogram` : '0.000 Kg'}
              </Text>
            </>
          ) : (
            <>
              <Text style={styles.heroLabel}>कुल भुगतान राशि (Total Price to Pay):</Text>
              <Text style={styles.heroMainValue}>
                {priceResult.valid ? `₹ ${priceResult.cost}` : '₹ 0.00'}
              </Text>
              <Text style={styles.heroSubValue}>
                {priceResult.valid
                  ? `(${weight} ${weightUnit} का कुल हिसाब)`
                  : `(0 ${weightUnit} का कुल हिसाब)`}
              </Text>
            </>
          )}
        </LinearGradient>

        {/* Unit Dropdown Modal */}
        <Modal
          visible={unitModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setUnitModalVisible(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setUnitModalVisible(false)}
          >
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Select Unit (प्रति इकाई):</Text>
              {unitsList.map((u) => (
                <TouchableOpacity
                  key={u.val}
                  style={[styles.modalItem, rateUnit === u.val && styles.modalItemActive]}
                  onPress={() => {
                    setRateUnit(u.val);
                    setUnitModalVisible(false);
                  }}
                >
                  <Text
                    style={[
                      styles.modalItemText,
                      rateUnit === u.val && styles.modalItemTextActive,
                    ]}
                  >
                    {u.label}
                  </Text>
                  {rateUnit === u.val && (
                    <Ionicons name="checkmark-circle" size={18} color={Colors.amber} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        </Modal>
      </ScrollView>
      </View>
    </KeyboardAvoidingView>
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
  modeTabsCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
    borderRadius: 16,
    padding: 4,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    marginBottom: 16,
  },
  modeTab: {
    flex: 1,
  },
  activeTabGradient: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeTabTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  activeTabSub: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.85)',
    fontWeight: '600',
    marginTop: 2,
  },
  inactiveTab: {
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inactiveTabTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textMuted,
  },
  inactiveTabSub: {
    fontSize: 10,
    color: Colors.textDim,
    marginTop: 2,
  },
  inputsCard: {
    backgroundColor: Colors.cardBg,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    marginBottom: 16,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
  },
  inputFloatingLabel: {
    fontSize: 12,
    color: Colors.textMuted,
    marginBottom: 6,
    fontWeight: '600',
  },
  fieldBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(11, 15, 25, 0.7)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    paddingHorizontal: 12,
    height: 48,
  },
  rupeeSymbol: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.amber,
    marginRight: 8,
  },
  fieldInput: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
    color: Colors.text,
    outlineStyle: 'none',
  },
  // Khaali field ka hint: chhota + normal weight (placeholder isi ko inherit karta hai)
  fieldHint: {
    fontSize: 14,
    fontWeight: '500',
  },
  dropdownBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(11, 15, 25, 0.7)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    paddingHorizontal: 12,
    height: 48,
  },
  dropdownText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    flex: 1,
  },
  cardDivider: {
    height: 1,
    backgroundColor: 'rgba(51, 65, 85, 0.5)',
    marginVertical: 16,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
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
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  chipTextActive: {
    color: Colors.amber,
    fontWeight: '800',
  },
  weightUnitBtn: {
    flex: 1,
    paddingVertical: 6,
    alignItems: 'center',
    borderRadius: 8,
  },
  weightUnitBtnActive: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
  },
  weightUnitText: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  weightUnitTextActive: {
    color: Colors.amber,
    fontWeight: '700',
  },
  heroResultCard: {
    borderRadius: 22,
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: Colors.orange,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 6,
  },
  heroLabel: {
    fontSize: 13.5,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.92)',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  heroMainValue: {
    fontSize: 38,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 0.6,
  },
  heroSubValue: {
    fontSize: 15,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.88)',
    textAlign: 'center',
    marginTop: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: Colors.bgSecondary,
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 14,
  },
  modalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(51, 65, 85, 0.4)',
  },
  modalItemActive: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: 8,
    paddingHorizontal: 8,
  },
  modalItemText: {
    fontSize: 14,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  modalItemTextActive: {
    color: Colors.amber,
    fontWeight: '700',
  },
});
