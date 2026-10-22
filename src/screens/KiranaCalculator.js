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
  Alert,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';

export default function KiranaCalculator() {
  // Mode: 'priceToWeight' (Rupaye se Wazan) or 'weightToPrice' (Wazan se Rupaye) or 'dealCompare'
  const [mode, setMode] = useState('priceToWeight');

  // Inputs for Mode A & B
  const [rate, setRate] = useState('60'); // e.g. 60 rs
  const [rateUnit, setRateUnit] = useState('1kg'); // '1kg' | '1L' | '100g'
  const [budget, setBudget] = useState('10'); // e.g. 10 rs
  const [weightInput, setWeightInput] = useState('250'); // e.g. 250g
  const [weightUnit, setWeightUnit] = useState('g'); // 'g' | 'kg' | 'ml' | 'L'
  const [itemName, setItemName] = useState('Sugar (चीनी)');

  // Compare Mode Inputs
  const [pack1Price, setPack1Price] = useState('45');
  const [pack1Weight, setPack1Weight] = useState('400'); // grams
  const [pack2Price, setPack2Price] = useState('110');
  const [pack2Weight, setPack2Weight] = useState('1000'); // grams

  // Saved shopping list / history
  const [savedList, setSavedList] = useState([]);

  // Base rate per 1000 grams or ml
  const getBaseRatePer1000 = (rateVal, unit) => {
    const r = parseFloat(rateVal) || 0;
    if (unit === '1kg' || unit === '1L') return r;
    if (unit === '500g' || unit === '500ml') return r * 2;
    if (unit === '100g' || unit === '100ml') return r * 10;
    return r;
  };

  // 1. Calculation: Rupaye se Wazan (Price to Weight)
  const calculateWeightFromBudget = () => {
    const r = parseFloat(rate) || 0;
    const b = parseFloat(budget) || 0;
    if (r <= 0 || b <= 0) return { grams: 0, kg: 0, text: '₹0' };

    const ratePer1000g = getBaseRatePer1000(rate, rateUnit);
    // Formula: (Budget / RatePer1000g) * 1000
    const grams = (b / ratePer1000g) * 1000;
    const kg = grams / 1000;

    return {
      grams: Number(grams.toFixed(2)),
      kg: Number(kg.toFixed(3)),
      ratePer1000g,
    };
  };

  // 2. Calculation: Wazan se Rupaye (Weight to Price)
  const calculatePriceFromWeight = () => {
    const r = parseFloat(rate) || 0;
    const w = parseFloat(weightInput) || 0;
    if (r <= 0 || w <= 0) return { cost: 0, text: '₹0' };

    const ratePer1000g = getBaseRatePer1000(rate, rateUnit);
    let totalGrams = w;
    if (weightUnit === 'kg' || weightUnit === 'L') {
      totalGrams = w * 1000;
    }

    const cost = (totalGrams / 1000) * ratePer1000g;
    return {
      cost: Number(cost.toFixed(2)),
      totalGrams,
      ratePer1000g,
    };
  };

  // 3. Calculation: Compare Packs
  const calculateComparison = () => {
    const p1 = parseFloat(pack1Price) || 0;
    const w1 = parseFloat(pack1Weight) || 0;
    const p2 = parseFloat(pack2Price) || 0;
    const w2 = parseFloat(pack2Weight) || 0;

    if (p1 <= 0 || w1 <= 0 || p2 <= 0 || w2 <= 0) return null;

    const rate1Per1000g = (p1 / w1) * 1000;
    const rate2Per1000g = (p2 / w2) * 1000;

    const diff = Math.abs(rate1Per1000g - rate2Per1000g);
    const cheaper = rate1Per1000g < rate2Per1000g ? 'Pack 1' : rate2Per1000g < rate1Per1000g ? 'Pack 2' : 'Same';
    const percentSavings = Math.min(rate1Per1000g, rate2Per1000g) > 0 
      ? ((diff / Math.max(rate1Per1000g, rate2Per1000g)) * 100).toFixed(1) 
      : 0;

    return {
      rate1Per1000g: Number(rate1Per1000g.toFixed(2)),
      rate2Per1000g: Number(rate2Per1000g.toFixed(2)),
      cheaper,
      diff: Number(diff.toFixed(2)),
      percentSavings,
    };
  };

  const p2wResult = calculateWeightFromBudget();
  const w2pResult = calculatePriceFromWeight();
  const compResult = calculateComparison();

  const handleSaveItem = () => {
    let newItem = null;
    if (mode === 'priceToWeight') {
      newItem = {
        id: Date.now().toString(),
        name: itemName || 'Item',
        details: `₹${rate}/${rateUnit} • ₹${budget} me`,
        result: `${p2wResult.grams}g (${p2wResult.kg}kg)`,
        cost: parseFloat(budget) || 0,
      };
    } else if (mode === 'weightToPrice') {
      newItem = {
        id: Date.now().toString(),
        name: itemName || 'Item',
        details: `₹${rate}/${rateUnit} • ${weightInput}${weightUnit} ka`,
        result: `₹${w2pResult.cost}`,
        cost: w2pResult.cost,
      };
    }

    if (newItem) {
      setSavedList([newItem, ...savedList]);
    }
  };

  const quickBudgets = ['5', '10', '20', '30', '50', '100', '200', '500'];
  const quickWeights = [
    { label: '50g', val: '50', unit: 'g' },
    { label: '100g', val: '100', unit: 'g' },
    { label: '250g', val: '250', unit: 'g' },
    { label: '500g', val: '500', unit: 'g' },
    { label: '1 Kg', val: '1', unit: 'kg' },
    { label: '2 Kg', val: '2', unit: 'kg' },
  ];

  const totalSavedCost = savedList.reduce((acc, item) => acc + item.cost, 0);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1 }}
    >
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Mode Selector Header */}
        <View style={styles.modeTabs}>
          <TouchableOpacity
            style={[styles.modeTab, mode === 'priceToWeight' && styles.modeTabActive]}
            onPress={() => setMode('priceToWeight')}
          >
            <MaterialCommunityIcons
              name="cash-fast"
              size={18}
              color={mode === 'priceToWeight' ? Colors.primary : Colors.textMuted}
            />
            <Text style={[styles.modeTabText, mode === 'priceToWeight' && styles.modeTabTextActive]}>
              ₹ ➔ Wazan (Gram)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.modeTab, mode === 'weightToPrice' && styles.modeTabActive]}
            onPress={() => setMode('weightToPrice')}
          >
            <MaterialCommunityIcons
              name="scale-bathroom"
              size={18}
              color={mode === 'weightToPrice' ? Colors.primary : Colors.textMuted}
            />
            <Text style={[styles.modeTabText, mode === 'weightToPrice' && styles.modeTabTextActive]}>
              Wazan ➔ Rupaye (₹)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.modeTab, mode === 'dealCompare' && styles.modeTabActive]}
            onPress={() => setMode('dealCompare')}
          >
            <MaterialCommunityIcons
              name="compare"
              size={18}
              color={mode === 'dealCompare' ? Colors.accent : Colors.textMuted}
            />
            <Text style={[styles.modeTabText, mode === 'dealCompare' && { color: Colors.accent }]}>
              Sasta Kaun Sa?
            </Text>
          </TouchableOpacity>
        </View>

        {/* MODE A: Price to Weight */}
        {mode === 'priceToWeight' && (
          <View>
            {/* Main Result Card */}
            <View style={styles.heroCard}>
              <View style={styles.badge}>
                <Ionicons name="sparkles" size={14} color={Colors.primary} />
                <Text style={styles.badgeText}>Wazan / Quantity Result</Text>
              </View>

              <View style={styles.resultRow}>
                <Text style={styles.resultValue}>{p2wResult.grams}</Text>
                <Text style={styles.resultUnit}>Grams (ग्राम)</Text>
              </View>
              <Text style={styles.resultSubValue}>
                = {p2wResult.kg} Kilogram (Kg / किलो)
              </Text>

              <View style={styles.formulaBox}>
                <Text style={styles.formulaTitle}>Samajhne ke liye (Calculation):</Text>
                <Text style={styles.formulaText}>
                  ₹{rate} me 1000g milta hai. Isliye ₹{budget} me:
                </Text>
                <Text style={styles.formulaMath}>
                  ({budget} ÷ {rate}) × 1000 = {p2wResult.grams} ग्राम
                </Text>
              </View>
            </View>

            {/* Inputs Card */}
            <View style={styles.card}>
              {/* Optional Item Name */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Cheez ka Naam (Item Name):</Text>
                <TextInput
                  style={styles.input}
                  value={itemName}
                  onChangeText={setItemName}
                  placeholder="e.g. Sugar, Dal, Ghee, Aata"
                  placeholderTextColor={Colors.textDim}
                />
              </View>

              {/* Rate per kg/L */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Rate (Bhav / 1 Kg ka Daam):</Text>
                <View style={styles.inputWithSuffix}>
                  <Text style={styles.inputPrefix}>₹</Text>
                  <TextInput
                    style={[styles.input, { flex: 1, paddingLeft: 30 }]}
                    value={rate}
                    onChangeText={setRate}
                    keyboardType="numeric"
                    placeholder="60"
                    placeholderTextColor={Colors.textDim}
                  />
                  <View style={styles.unitPill}>
                    <Text style={styles.unitPillText}>per 1 Kg</Text>
                  </View>
                </View>
              </View>

              {/* Budget / Money to spend */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Kitne Rupaye ka chahiye (Budget):</Text>
                <View style={styles.inputWithSuffix}>
                  <Text style={styles.inputPrefix}>₹</Text>
                  <TextInput
                    style={[styles.input, { flex: 1, paddingLeft: 30, fontSize: 20, color: Colors.primary }]}
                    value={budget}
                    onChangeText={setBudget}
                    keyboardType="numeric"
                    placeholder="10"
                    placeholderTextColor={Colors.textDim}
                  />
                </View>

                {/* Quick Budget Chips */}
                <Text style={styles.chipHeader}>Turant select karein (Quick ₹):</Text>
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

              {/* Add to List Button */}
              <TouchableOpacity style={styles.saveBtn} onPress={handleSaveItem}>
                <Ionicons name="cart-outline" size={20} color="#0F172A" />
                <Text style={styles.saveBtnText}>Shopping List me Save Karein</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* MODE B: Weight to Price */}
        {mode === 'weightToPrice' && (
          <View>
            {/* Main Result Card */}
            <View style={[styles.heroCard, { borderColor: Colors.secondary }]}>
              <View style={[styles.badge, { backgroundColor: Colors.secondaryBg }]}>
                <Ionicons name="cash-outline" size={14} color={Colors.secondary} />
                <Text style={[styles.badgeText, { color: Colors.secondary }]}>Total Daam (Price to Pay)</Text>
              </View>

              <View style={styles.resultRow}>
                <Text style={[styles.resultValue, { color: Colors.secondary }]}>₹{w2pResult.cost}</Text>
                <Text style={styles.resultUnit}>Rupaye</Text>
              </View>
              <Text style={styles.resultSubValue}>
                {weightInput} {weightUnit} ka hisaab
              </Text>

              <View style={styles.formulaBox}>
                <Text style={styles.formulaTitle}>Samajhne ke liye (Calculation):</Text>
                <Text style={styles.formulaText}>
                  ₹{rate}/kg bhav se {weightInput}{weightUnit} ka daam:
                </Text>
                <Text style={[styles.formulaMath, { color: Colors.secondary }]}>
                  ({w2pResult.totalGrams}g ÷ 1000g) × ₹{rate} = ₹{w2pResult.cost}
                </Text>
              </View>
            </View>

            {/* Inputs Card */}
            <View style={styles.card}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Cheez ka Naam (Item Name):</Text>
                <TextInput
                  style={styles.input}
                  value={itemName}
                  onChangeText={setItemName}
                  placeholder="e.g. Sugar, Paneer, Badam, Sabzi"
                  placeholderTextColor={Colors.textDim}
                />
              </View>

              {/* Rate per kg */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Rate (1 Kg / 1 L ka Bhav):</Text>
                <View style={styles.inputWithSuffix}>
                  <Text style={styles.inputPrefix}>₹</Text>
                  <TextInput
                    style={[styles.input, { flex: 1, paddingLeft: 30 }]}
                    value={rate}
                    onChangeText={setRate}
                    keyboardType="numeric"
                    placeholder="60"
                    placeholderTextColor={Colors.textDim}
                  />
                  <View style={styles.unitPill}>
                    <Text style={styles.unitPillText}>per 1 Kg</Text>
                  </View>
                </View>
              </View>

              {/* Quantity to buy */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Aapko kitna wazan chahiye (Quantity):</Text>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <TextInput
                    style={[styles.input, { flex: 1, fontSize: 20, color: Colors.secondary }]}
                    value={weightInput}
                    onChangeText={setWeightInput}
                    keyboardType="numeric"
                    placeholder="250"
                    placeholderTextColor={Colors.textDim}
                  />
                  <View style={styles.unitSwitch}>
                    <TouchableOpacity
                      style={[styles.unitSwitchBtn, weightUnit === 'g' && styles.unitSwitchBtnActive]}
                      onPress={() => setWeightUnit('g')}
                    >
                      <Text style={[styles.unitSwitchText, weightUnit === 'g' && styles.unitSwitchTextActive]}>
                        Gram (g)
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.unitSwitchBtn, weightUnit === 'kg' && styles.unitSwitchBtnActive]}
                      onPress={() => setWeightUnit('kg')}
                    >
                      <Text style={[styles.unitSwitchText, weightUnit === 'kg' && styles.unitSwitchTextActive]}>
                        Kg (किलो)
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Quick Weight Chips */}
                <Text style={styles.chipHeader}>Turant select karein (Quick Weights):</Text>
                <View style={styles.chipRow}>
                  {quickWeights.map((item) => (
                    <TouchableOpacity
                      key={item.label}
                      style={[
                        styles.chip,
                        weightInput === item.val && weightUnit === item.unit && styles.chipActive,
                      ]}
                      onPress={() => {
                        setWeightInput(item.val);
                        setWeightUnit(item.unit);
                      }}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          weightInput === item.val && weightUnit === item.unit && styles.chipTextActive,
                        ]}
                      >
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <TouchableOpacity style={styles.saveBtn} onPress={handleSaveItem}>
                <Ionicons name="cart-outline" size={20} color="#0F172A" />
                <Text style={styles.saveBtnText}>Shopping List me Save Karein</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* MODE C: Deal Comparison */}
        {mode === 'dealCompare' && (
          <View>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Pack 1 vs Pack 2 Comparison</Text>
              <Text style={styles.cardSubtitle}>
                Pata karein kaun sa packet sasta padega aur kitni bachat hogi!
              </Text>

              {/* Pack 1 */}
              <View style={styles.compareBox}>
                <Text style={styles.compareBoxTitle}>📦 Packet 1 (Chhota / Bada)</Text>
                <View style={styles.compareRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.miniLabel}>Daam (₹):</Text>
                    <TextInput
                      style={styles.input}
                      value={pack1Price}
                      onChangeText={setPack1Price}
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.miniLabel}>Wazan (Gram me):</Text>
                    <TextInput
                      style={styles.input}
                      value={pack1Weight}
                      onChangeText={setPack1Weight}
                      keyboardType="numeric"
                    />
                  </View>
                </View>
              </View>

              {/* Pack 2 */}
              <View style={[styles.compareBox, { borderColor: Colors.accent }]}>
                <Text style={[styles.compareBoxTitle, { color: Colors.accent }]}>📦 Packet 2</Text>
                <View style={styles.compareRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.miniLabel}>Daam (₹):</Text>
                    <TextInput
                      style={styles.input}
                      value={pack2Price}
                      onChangeText={setPack2Price}
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.miniLabel}>Wazan (Gram me):</Text>
                    <TextInput
                      style={styles.input}
                      value={pack2Weight}
                      onChangeText={setPack2Weight}
                      keyboardType="numeric"
                    />
                  </View>
                </View>
              </View>

              {compResult && (
                <View style={styles.compResultCard}>
                  <View style={styles.compResultHeader}>
                    <Ionicons name="checkmark-circle" size={24} color={Colors.primary} />
                    <Text style={styles.compResultWinText}>
                      {compResult.cheaper === 'Same'
                        ? 'Dono packet ka rate barabar hai!'
                        : `${compResult.cheaper} SASTA HAI! (${compResult.percentSavings}% Bachat)`}
                    </Text>
                  </View>

                  <View style={styles.compStatsRow}>
                    <View style={styles.statCol}>
                      <Text style={styles.statLabel}>Pack 1 (1 Kg ka rate):</Text>
                      <Text style={styles.statVal}>₹{compResult.rate1Per1000g} / kg</Text>
                    </View>
                    <View style={styles.statCol}>
                      <Text style={styles.statLabel}>Pack 2 (1 Kg ka rate):</Text>
                      <Text style={styles.statVal}>₹{compResult.rate2Per1000g} / kg</Text>
                    </View>
                  </View>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Saved List / History Drawer */}
        {savedList.length > 0 && (
          <View style={[styles.card, { marginTop: 16 }]}>
            <View style={styles.savedHeader}>
              <View>
                <Text style={styles.cardTitle}>Shopping Cart / Bill Estimate</Text>
                <Text style={styles.savedSubText}>
                  Total Items: {savedList.length} | Kul Rashi: ₹{totalSavedCost.toFixed(2)}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.clearBtn}
                onPress={() => setSavedList([])}
              >
                <Ionicons name="trash-outline" size={16} color={Colors.danger} />
                <Text style={styles.clearBtnText}>Clear</Text>
              </TouchableOpacity>
            </View>

            {savedList.map((item, idx) => (
              <View key={item.id} style={styles.savedItem}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.savedItemName}>{item.name}</Text>
                  <Text style={styles.savedItemDetails}>{item.details}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.savedItemResult}>{item.result}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: Colors.bg,
  },
  modeTabs: {
    flexDirection: 'row',
    backgroundColor: Colors.cardBg,
    borderRadius: 14,
    padding: 4,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  modeTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 10,
    borderRadius: 10,
  },
  modeTabActive: {
    backgroundColor: Colors.cardHighlight,
  },
  modeTabText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  modeTabTextActive: {
    color: Colors.primary,
  },
  heroCard: {
    backgroundColor: '#132338',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: Colors.primaryBg,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 6,
    marginBottom: 12,
  },
  badgeText: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  resultValue: {
    fontSize: 42,
    fontWeight: '800',
    color: Colors.primary,
  },
  resultUnit: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  resultSubValue: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 4,
  },
  formulaBox: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  formulaTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textMuted,
    marginBottom: 4,
  },
  formulaText: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  formulaMath: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primaryLight,
    marginTop: 2,
  },
  card: {
    backgroundColor: Colors.cardBg,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 13,
    color: Colors.textMuted,
    marginBottom: 14,
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
  miniLabel: {
    fontSize: 12,
    color: Colors.textMuted,
    marginBottom: 4,
  },
  input: {
    backgroundColor: Colors.bg,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: Colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  inputWithSuffix: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputPrefix: {
    position: 'absolute',
    left: 12,
    zIndex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textMuted,
  },
  unitPill: {
    position: 'absolute',
    right: 10,
    backgroundColor: Colors.cardBorder,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  unitPillText: {
    color: Colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  chipHeader: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 10,
    marginBottom: 6,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
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
    backgroundColor: Colors.primaryBg,
    borderColor: Colors.primary,
  },
  chipText: {
    color: Colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  chipTextActive: {
    color: Colors.primary,
    fontWeight: '700',
  },
  unitSwitch: {
    flexDirection: 'row',
    backgroundColor: Colors.bg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: 3,
  },
  unitSwitchBtn: {
    paddingHorizontal: 12,
    justifyContent: 'center',
    borderRadius: 9,
  },
  unitSwitchBtnActive: {
    backgroundColor: Colors.secondaryBg,
  },
  unitSwitchText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  unitSwitchTextActive: {
    color: Colors.secondary,
    fontWeight: '700',
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 13,
    marginTop: 4,
  },
  saveBtnText: {
    color: '#0F172A',
    fontWeight: '700',
    fontSize: 15,
  },
  compareBox: {
    backgroundColor: Colors.bg,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    marginBottom: 12,
  },
  compareBoxTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 8,
  },
  compareRow: {
    flexDirection: 'row',
    gap: 12,
  },
  compResultCard: {
    backgroundColor: Colors.primaryBg,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: 14,
    padding: 14,
    marginTop: 6,
  },
  compResultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  compResultWinText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.primaryLight,
  },
  compStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  statCol: {
    flex: 1,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  statVal: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
    marginTop: 2,
  },
  savedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  savedSubText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '600',
    marginTop: 2,
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: Colors.dangerBg,
  },
  clearBtnText: {
    fontSize: 12,
    color: Colors.danger,
    fontWeight: '600',
  },
  savedItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.cardBorder,
  },
  savedItemName: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
  },
  savedItemDetails: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  savedItemResult: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.primary,
  },
});
