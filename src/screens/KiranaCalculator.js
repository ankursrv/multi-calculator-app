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
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';

export default function KiranaCalculator({ onBack, onSaveToBill }) {
  // Mode: 'priceToWeight' (रुपये से वजन) or 'weightToPrice' (वजन से रुपये)
  const [mode, setMode] = useState('priceToWeight');

  // Input states
  const [rate, setRate] = useState('60'); // ₹ 60
  const [rateUnit, setRateUnit] = useState('Kilogram'); // Kilogram, 100 Gram, Litre
  const [budget, setBudget] = useState('10'); // ₹ 10
  const [weight, setWeight] = useState('250'); // 250 g
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
    setRate('60');
    setRateUnit('Kilogram');
    setBudget('10');
    setWeight('250');
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

  const quickBudgets = ['5', '10', '20', '30', '50', '100', '200', '500'];
  const quickWeights = [
    { label: '50g', val: '50', unit: 'Gram' },
    { label: '100g', val: '100', unit: 'Gram' },
    { label: '250g', val: '250', unit: 'Gram' },
    { label: '500g', val: '500', unit: 'Gram' },
    { label: '1 Kg', val: '1', unit: 'Kilogram' },
  ];

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1 }}
    >
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Top Header matching Screenshot 2 */}
        <View style={styles.screenHeader}>
          <TouchableOpacity onPress={onBack} style={styles.backBtn} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={24} color={Colors.amber} />
          </TouchableOpacity>

          <View style={styles.titleWrap}>
            <Text style={styles.mainTitle}>Samaa-Bhav & Kirana</Text>
            <Text style={styles.subTitle}>सामान का भाव - वजन और मूल्य कैलकुलेटर</Text>
          </View>

          <TouchableOpacity onPress={handleReset} style={styles.resetBtn} activeOpacity={0.7}>
            <Ionicons name="refresh" size={22} color={Colors.amber} />
          </TouchableOpacity>
        </View>

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
                  style={styles.fieldInput}
                  value={rate}
                  onChangeText={setRate}
                  keyboardType="numeric"
                  placeholder="60"
                  placeholderTextColor={Colors.textDim}
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
                  style={[styles.fieldInput, { color: '#FFFFFF', fontSize: 20 }]}
                  value={budget}
                  onChangeText={setBudget}
                  keyboardType="numeric"
                  placeholder="10"
                  placeholderTextColor={Colors.textDim}
                />
              </View>

              {/* Quick Budget Chips */}
              <View style={styles.chipRow}>
                {quickBudgets.map((val) => (
                  <TouchableOpacity
                    key={val}
                    style={[styles.chip, budget === val && styles.chipActive]}
                    onPress={() => setBudget(val)}
                  >
                    <Text style={[styles.chipText, budget === val && styles.chipTextActive]}>
                      ₹{val}
                    </Text>
                  </TouchableOpacity>
                ))}
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
                    style={[styles.fieldInput, { color: '#FFFFFF', fontSize: 20 }]}
                    value={weight}
                    onChangeText={setWeight}
                    keyboardType="numeric"
                    placeholder="250"
                    placeholderTextColor={Colors.textDim}
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

              {/* Quick Weight Chips */}
              <View style={styles.chipRow}>
                {quickWeights.map((item) => (
                  <TouchableOpacity
                    key={item.label}
                    style={[
                      styles.chip,
                      weight === item.val && weightUnit === item.unit && styles.chipActive,
                    ]}
                    onPress={() => {
                      setWeight(item.val);
                      setWeightUnit(item.unit);
                    }}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        weight === item.val && weightUnit === item.unit && styles.chipTextActive,
                      ]}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                ))}
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
                ({weight} {weightUnit} का कुल हिसाब)
              </Text>
            </>
          )}
        </LinearGradient>

        {/* Calculation Step Breakdown */}
        <View style={styles.formulaCard}>
          <View style={styles.formulaHeader}>
            <Ionicons name="calculator-outline" size={16} color={Colors.amber} />
            <Text style={styles.formulaHeaderTitle}>हिसाब समझने के लिए (Calculation Breakdown):</Text>
          </View>
          {mode === 'priceToWeight' ? (
            <Text style={styles.formulaContent}>
              ₹{rate} में 1000g मिलता है। इसलिए ₹{budget} में:{'\n'}
              <Text style={styles.formulaMathHighlight}>
                ({budget} ÷ {rate}) × 1000 = {qtyResult.grams} Gram (ग्राम)
              </Text>
            </Text>
          ) : (
            <Text style={styles.formulaContent}>
              ₹{rate}/kg के भाव से {weight} {weightUnit} का हिसाब:{'\n'}
              <Text style={styles.formulaMathHighlight}>
                ({priceResult.totalGrams}g ÷ 1000g) × ₹{rate} = ₹{priceResult.cost}
              </Text>
            </Text>
          )}
        </View>

        {/* Quick Save to Smart Bill button */}
        {onSaveToBill && (
          <TouchableOpacity
            style={styles.saveBtn}
            onPress={() => {
              if (mode === 'priceToWeight') {
                onSaveToBill({
                  name: itemName,
                  details: `₹${rate}/${rateUnit} • ₹${budget} me`,
                  result: `${qtyResult.grams}g`,
                  cost: parseFloat(budget) || 0,
                });
              } else {
                onSaveToBill({
                  name: itemName,
                  details: `₹${rate}/${rateUnit} • ${weight}${weightUnit}`,
                  result: `₹${priceResult.cost}`,
                  cost: parseFloat(priceResult.cost) || 0,
                });
              }
            }}
          >
            <Ionicons name="receipt-outline" size={18} color="#030712" />
            <Text style={styles.saveBtnText}>Smart Khata / Bill me Add Karein</Text>
          </TouchableOpacity>
        )}

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
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgDark,
  },
  content: {
    padding: 16,
    paddingBottom: 80,
  },
  screenHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    marginTop: 4,
  },
  backBtn: {
    padding: 6,
    borderRadius: 10,
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
  },
  titleWrap: {
    flex: 1,
    marginHorizontal: 12,
  },
  mainTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text,
  },
  subTitle: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  resetBtn: {
    padding: 6,
    borderRadius: 10,
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
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
    borderRadius: 20,
    padding: 22,
    marginBottom: 16,
    shadowColor: Colors.orange,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 6,
  },
  heroLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 6,
  },
  heroMainValue: {
    fontSize: 42,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  heroSubValue: {
    fontSize: 15,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: 4,
  },
  formulaCard: {
    backgroundColor: Colors.cardBg,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    marginBottom: 16,
  },
  formulaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  formulaHeaderTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.amber,
  },
  formulaContent: {
    fontSize: 13,
    color: Colors.textMuted,
    lineHeight: 20,
  },
  formulaMathHighlight: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.amber,
    paddingVertical: 14,
    borderRadius: 14,
    shadowColor: Colors.amber,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveBtnText: {
    color: '#030712',
    fontSize: 15,
    fontWeight: '800',
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
