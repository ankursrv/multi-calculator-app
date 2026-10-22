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

const CONVERSIONS = {
  weight: {
    title: 'Wazan (Weight)',
    icon: 'scale',
    base: 'g',
    units: [
      { id: 'kg', name: 'Kilogram (kg)', toBase: 1000 },
      { id: 'g', name: 'Gram (g)', toBase: 1 },
      { id: 'mg', name: 'Milligram (mg)', toBase: 0.001 },
      { id: 'lb', name: 'Pound (lb)', toBase: 453.592 },
      { id: 'oz', name: 'Ounce (oz)', toBase: 28.3495 },
      { id: 'quintal', name: 'Quintal (100 kg)', toBase: 100000 },
    ],
  },
  length: {
    title: 'Lambai (Length)',
    icon: 'resize',
    base: 'm',
    units: [
      { id: 'km', name: 'Kilometer (km)', toBase: 1000 },
      { id: 'm', name: 'Meter (m)', toBase: 1 },
      { id: 'cm', name: 'Centimeter (cm)', toBase: 0.01 },
      { id: 'mm', name: 'Millimeter (mm)', toBase: 0.001 },
      { id: 'ft', name: 'Foot (ft)', toBase: 0.3048 },
      { id: 'in', name: 'Inch (in)', toBase: 0.0254 },
      { id: 'yd', name: 'Yard (Gaj)', toBase: 0.9144 },
    ],
  },
  volume: {
    title: 'Volume (Taral / Litre)',
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
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
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
                color={active ? Colors.primary : Colors.textMuted}
              />
              <Text style={[styles.catBtnText, active && styles.catBtnTextActive]}>
                {item.title}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Result Card */}
      <View style={styles.heroCard}>
        <Text style={styles.heroSubText}>
          {val} {converted.fromName} =
        </Text>
        <Text style={styles.heroVal}>{converted.result}</Text>
        <Text style={styles.heroUnit}>{converted.toName}</Text>
      </View>

      {/* Inputs Card */}
      <View style={styles.card}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Kitna convert karna hai (Value):</Text>
          <TextInput
            style={styles.input}
            value={val}
            onChangeText={setVal}
            keyboardType="numeric"
            placeholder="1"
            placeholderTextColor={Colors.textDim}
          />
        </View>

        {/* From Unit Selector */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>From (Kisse):</Text>
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
          <Ionicons name="swap-vertical" size={20} color={Colors.primary} />
          <Text style={styles.swapText}>Ulat-Pulat Karein (Swap Units)</Text>
        </TouchableOpacity>

        {/* To Unit Selector */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>To (Kisme badalna hai):</Text>
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
                    toUnit === u.id && { color: Colors.secondary, fontWeight: '700' },
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
    padding: 16,
    backgroundColor: Colors.bg,
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
    backgroundColor: Colors.primaryBg,
    borderColor: Colors.primary,
  },
  catBtnText: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  catBtnTextActive: {
    color: Colors.primary,
    fontWeight: '700',
  },
  heroCard: {
    backgroundColor: '#162235',
    borderRadius: 20,
    padding: 22,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.secondary,
    marginBottom: 16,
  },
  heroSubText: {
    fontSize: 14,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  heroVal: {
    fontSize: 40,
    fontWeight: '800',
    color: Colors.secondary,
    marginVertical: 4,
  },
  heroUnit: {
    fontSize: 15,
    color: Colors.text,
    fontWeight: '600',
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
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.bg,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
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
    backgroundColor: Colors.cardHighlight,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  unitChipActive: {
    backgroundColor: Colors.primaryBg,
    borderColor: Colors.primary,
  },
  unitChipActiveTo: {
    backgroundColor: Colors.secondaryBg,
    borderColor: Colors.secondary,
  },
  unitChipText: {
    color: Colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  unitChipTextActive: {
    color: Colors.primary,
    fontWeight: '700',
  },
  swapBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    backgroundColor: Colors.primaryBg,
    borderRadius: 10,
    marginBottom: 16,
  },
  swapText: {
    color: Colors.primary,
    fontSize: 13,
    fontWeight: '700',
  },
});
