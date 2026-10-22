import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../theme/colors';
import ScreenHeader from '../components/ScreenHeader';

export default function StandardCalculator() {
  const [display, setDisplay] = useState('0');
  const [expression, setExpression] = useState('');
  const [history, setHistory] = useState([]);

  const handleNumber = (digit) => {
    if (display === '0' || display === 'Error') {
      setDisplay(digit);
    } else {
      setDisplay(display + digit);
    }
  };

  const handleDecimal = () => {
    const parts = display.split(/[\+\-\×\÷]/);
    const lastPart = parts[parts.length - 1];
    if (!lastPart.includes('.')) {
      setDisplay(display + '.');
    }
  };

  const handleOperator = (op) => {
    if (display === 'Error') return;
    const lastChar = display.slice(-1);
    if (['+', '-', '×', '÷'].includes(lastChar)) {
      setDisplay(display.slice(0, -1) + op);
    } else {
      setDisplay(display + op);
    }
  };

  const handleClear = () => {
    setDisplay('0');
    setExpression('');
  };

  const handleBackspace = () => {
    if (display.length <= 1 || display === 'Error') {
      setDisplay('0');
    } else {
      setDisplay(display.slice(0, -1));
    }
  };

  const handlePercentage = () => {
    try {
      const val = parseFloat(display);
      if (!isNaN(val)) {
        setDisplay((val / 100).toString());
      }
    } catch {
      setDisplay('Error');
    }
  };

  const handleToggleSign = () => {
    if (display === '0' || display === 'Error') return;
    if (display.startsWith('-')) {
      setDisplay(display.substring(1));
    } else {
      setDisplay('-' + display);
    }
  };

  const handleEqual = () => {
    try {
      const sanitized = display.replace(/×/g, '*').replace(/÷/g, '/');
      if (!/^[\d\.\+\-\*\/\(\)\s]+$/.test(sanitized)) {
        setDisplay('Error');
        return;
      }
      // eslint-disable-next-line no-eval
      const result = Function(`"use strict"; return (${sanitized})`)();
      const rounded = Number.isInteger(result)
        ? result.toString()
        : parseFloat(result.toFixed(6)).toString();

      setHistory([{ expr: display, res: rounded }, ...history.slice(0, 4)]);
      setExpression(display + ' =');
      setDisplay(rounded);
    } catch {
      setDisplay('Error');
    }
  };

  const buttons = [
    [
      { label: 'C', type: 'special', action: handleClear },
      { label: '⌫', type: 'special', action: handleBackspace },
      { label: '%', type: 'special', action: handlePercentage },
      { label: '÷', type: 'operator', action: () => handleOperator('÷') },
    ],
    [
      { label: '7', type: 'num', action: () => handleNumber('7') },
      { label: '8', type: 'num', action: () => handleNumber('8') },
      { label: '9', type: 'num', action: () => handleNumber('9') },
      { label: '×', type: 'operator', action: () => handleOperator('×') },
    ],
    [
      { label: '4', type: 'num', action: () => handleNumber('4') },
      { label: '5', type: 'num', action: () => handleNumber('5') },
      { label: '6', type: 'num', action: () => handleNumber('6') },
      { label: '-', type: 'operator', action: () => handleOperator('-') },
    ],
    [
      { label: '1', type: 'num', action: () => handleNumber('1') },
      { label: '2', type: 'num', action: () => handleNumber('2') },
      { label: '3', type: 'num', action: () => handleNumber('3') },
      { label: '+', type: 'operator', action: () => handleOperator('+') },
    ],
    [
      { label: '±', type: 'special', action: handleToggleSign },
      { label: '0', type: 'num', action: () => handleNumber('0') },
      { label: '.', type: 'num', action: handleDecimal },
      { label: '=', type: 'equal', action: handleEqual },
    ],
  ];

  return (
    <View style={styles.container}>
      {/* Fixed Header (same style as Home) with subtle shadow fade */}
      <ScreenHeader title="Calculator" subtitle="Quick & Accurate Maths" />

      {/* Screen Body */}
      <View style={styles.body}>
      {/* Display Card */}
      <View style={styles.displayCard}>
        <ScrollView style={styles.historyBox} contentContainerStyle={{ alignItems: 'flex-end' }}>
          {history.map((h, i) => (
            <Text key={i} style={styles.historyLine}>
              {h.expr} = {h.res}
            </Text>
          ))}
        </ScrollView>

        <Text style={styles.expressionText}>{expression}</Text>
        <Text
          style={[styles.displayText, display.length > 9 && { fontSize: 36 }]}
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          {display}
        </Text>
      </View>

      {/* Keypad */}
      <View style={styles.keypad}>
        {buttons.map((row, rIdx) => (
          <View key={rIdx} style={styles.row}>
            {row.map((btn, cIdx) => {
              const isEqual = btn.type === 'equal';
              const isOperator = btn.type === 'operator';
              const isSpecial = btn.type === 'special';

              if (isEqual) {
                return (
                  <TouchableOpacity
                    key={cIdx}
                    style={styles.btnWrap}
                    onPress={btn.action}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={Colors.gradientColors}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.equalGradient}
                    >
                      <Text style={styles.equalBtnText}>{btn.label}</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                );
              }

              return (
                <TouchableOpacity
                  key={cIdx}
                  style={[
                    styles.btn,
                    isOperator && styles.operatorBtn,
                    isSpecial && styles.specialBtn,
                  ]}
                  onPress={btn.action}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.btnText,
                      isOperator && styles.operatorBtnText,
                      isSpecial && styles.specialBtnText,
                    ]}
                  >
                    {btn.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgDark,
  },
  body: {
    flex: 1,
    paddingHorizontal: 14,
    paddingTop: 16,
    paddingBottom: 80,
    justifyContent: 'space-between',
  },
  displayCard: {
    backgroundColor: Colors.cardBg,
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    minHeight: 160,
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  historyBox: {
    maxHeight: 50,
    width: '100%',
    marginBottom: 6,
  },
  historyLine: {
    color: Colors.textDim,
    fontSize: 13,
    marginBottom: 2,
  },
  expressionText: {
    color: Colors.textMuted,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 6,
  },
  displayText: {
    color: Colors.text,
    fontSize: 48,
    fontWeight: '800',
  },
  keypad: {
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  btnWrap: {
    flex: 1,
    aspectRatio: 1.25,
  },
  btn: {
    flex: 1,
    aspectRatio: 1.25,
    backgroundColor: Colors.cardBg,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: {
    color: Colors.text,
    fontSize: 24,
    fontWeight: '700',
  },
  operatorBtn: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderColor: 'rgba(245, 158, 11, 0.4)',
  },
  operatorBtnText: {
    color: Colors.amber,
    fontSize: 26,
    fontWeight: '800',
  },
  specialBtn: {
    backgroundColor: 'rgba(51, 65, 85, 0.4)',
  },
  specialBtnText: {
    color: Colors.textMuted,
    fontWeight: '700',
  },
  equalGradient: {
    flex: 1,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  equalBtnText: {
    color: '#030712',
    fontSize: 28,
    fontWeight: '900',
  },
});
