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

const CONVERSIONS = {
  weight: {
    title: 'वजन (Weight)',
    icon: 'scale',
    base: 'g',
    units: [
      { id: 'kg', name: 'Kilogram (kg)', toBase: 1000 },
      { id: 'g', name: 'Gram (g)', toBase: 1 },
      { id: 'mg', name: 'Milligram (mg)', toBase: 0.001 },
      { id: 'lb', name: 'Pound (lb)', toBase: 453.592 },
      { id: 'quintal', name: 'Quintal (100 kg)', toBase: 100000 },
    ],
  },
  length: {
    title: 'लंबाई (Length)',
    icon: 'resize',
    base: 'm',
    units: [
      { id: 'km', name: 'Kilometer (km)', toBase: 1000 },
      { id: 'm', name: 'Meter (m)', toBase: 1 },
      { id: 'cm', name: 'Centimeter (cm)', toBase: 0.01 },
      { id: 'mm', name: 'Millimeter (mm)', toBase: 0.001 },
      { id: 'ft', name: 'Foot (ft)', toBase: 0.3048 },
      { id: 'in', name: 'Inch (in)', toBase: 0.0254 },
    ],
  },
  volume: {
    title: 'मात्रा (Volume)',
    icon: 'water',
    base: 'ml',
    units: [
      { id: 'L', name: 'Litre (L)', toBase: 1000 },
      { id: 'ml', name: 'Millilitre (ml)', toBase: 1 },
      { id: 'gal', name: 'Gallon (US)', toBase: 3785.41 },
    ],
  },
};

export default function UnitConverter() {
  const [category, setCategory] = useState('weight');
  const [val, setVal] = useState('1');
  const [fromUnit, setFromUnit] = useState('kg');
  const [toUnit, setToUnit] = useState('g');

  const currentCat = CONVERSIONS[category];

  const calculateConversion = () => {
    const num = parseFloat(val) || 0;
    const fromObj = currentCat.units.find((u) => u.id === fromUnit) || currentCat.units[0];
    const toObj = currentCat.units.find((u) => u.id === toUnit) || currentCat.units[1];

    const baseVal = num * fromObj.toBase;
    const result = baseVal / toObj.toBase;

    return {
      result: Number.isInteger(result) ? result : parseFloat(result.toFixed(4)),
      fromName: fromObj.name,
      toName: toObj.name,
    };
  };

  const handleSwap = () => {
    const temp = fromUnit;
    setFromUnit(toUnit);
    setToUnit(temp);
  };

  const handleCategoryChange = (newCat) => {
    setCategory(newCat);
    setFromUnit(CONVERSIONS[newCat].units[0].id);
    setToUnit(CONVERSIONS[newCat].units[1].id);
  };

  const converted = calculateConversion();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Unit Converter</Text>
        <Text style={styles.subTitle}>इकाइयों का सटीक रूपांतरण</Text>
      </View>

      {/* Category Pills */}
      <View style={styles.catRow}>
        {Object.keys(CONVERSIONS).map((catKey) => {
          const item = CONVERSIONS[catKey];
          const active = category === catKey;
          return (
            <TouchableOpacity
              key={catKey}
              style={[styles.catBtn, active && styles.catBtnActive]}
              onPress={() => handleCategoryChange(catKey)}
            >
              <Ionicons
                name={item.icon}
                size={16}
                color={active ? Colors.amber : Colors.textMuted}
              />
              <Text style={[styles.catBtnText, active && styles.catBtnTextActive]}>
                {item.title}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Hero Result Card */}
      <LinearGradient
        colors={Colors.gradientCardColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.heroCard}
      >
        <Text style={styles.heroSubText}>
          {val} {converted.fromName} =
        </Text>
        <Text style={styles.heroVal}>{converted.result}</Text>
        <Text style={styles.heroUnit}>{converted.toName}</Text>
      </LinearGradient>

      {/* Inputs Card */}
      <View style={styles.card}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>इकाई मान (Value to convert):</Text>
          <TextInput
            style={styles.input}
            value={val}
            onChangeText={setVal}
            keyboardType="numeric"
            placeholder="1"
            placeholderTextColor={Colors.textDim}
          />
        </View>

        {/* From Unit */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>From (किससे):</Text>
          <View style={styles.unitList}>
            {currentCat.units.map((u) => (
              <TouchableOpacity
                key={u.id}
                style={[styles.unitChip, fromUnit === u.id && styles.unitChipActive]}
                onPress={() => setFromUnit(u.id)}
              >
                <Text style={[styles.unitChipText, fromUnit === u.id && styles.unitChipTextActive]}>
                  {u.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Swap Button */}
        <TouchableOpacity style={styles.swapBtn} onPress={handleSwap}>
          <Ionicons name="swap-vertical" size={18} color={Colors.amber} />
          <Text style={styles.swapText}>उलट-पुलट करें (Swap Units)</Text>
        </TouchableOpacity>

        {/* To Unit */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>To (किसमें बदलना है):</Text>
          <View style={styles.unitList}>
            {currentCat.units.map((u) => (
              <TouchableOpacity
                key={u.id}
                style={[styles.unitChip, toUnit === u.id && styles.unitChipActiveTo]}
                onPress={() => setToUnit(u.id)}
              >
                <Text
                  style={[
                    styles.unitChipText,
                    toUnit === u.id && { color: Colors.amber, fontWeight: '800' },
                  ]}
                >
                  {u.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </ScrollView>
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
  header: {
    marginBottom: 16,
    marginTop: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.text,
  },
  subTitle: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  catRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  catBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    backgroundColor: Colors.cardBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  catBtnActive: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderColor: Colors.amber,
  },
  catBtnText: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  catBtnTextActive: {
    color: Colors.amber,
    fontWeight: '700',
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
  heroVal: {
    fontSize: 40,
    fontWeight: '900',
    color: '#FFFFFF',
    marginVertical: 4,
  },
  heroUnit: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '700',
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
  input: {
    backgroundColor: 'rgba(11, 15, 25, 0.7)',
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: Colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  unitList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  unitChip: {
    backgroundColor: 'rgba(11, 15, 25, 0.8)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  unitChipActive: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    borderColor: Colors.amber,
  },
  unitChipActiveTo: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    borderColor: Colors.amber,
  },
  unitChipText: {
    color: Colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  unitChipTextActive: {
    color: Colors.amber,
    fontWeight: '700',
  },
  swapBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderRadius: 10,
    marginBottom: 16,
  },
  swapText: {
    color: Colors.amber,
    fontSize: 13,
    fontWeight: '700',
  },
});
