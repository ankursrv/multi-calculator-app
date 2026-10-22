import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';

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
    // Check if the current segment already has a decimal
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
        const res = (val / 100).toString();
        setDisplay(res);
      }
    } catch {
      setDisplay('Error');
    }
  };

  const handleToggleSign = () => {
    try {
      if (display === '0' || display === 'Error') return;
      if (display.startsWith('-')) {
        setDisplay(display.substring(1));
      } else {
        setDisplay('-' + display);
      }
    } catch {
      setDisplay('Error');
    }
  };

  const handleEqual = () => {
    try {
      const sanitized = display.replace(/×/g, '*').replace(/÷/g, '/');
      // Validate safe math expression
      if (!/^[\d\.\+\-\*\/\(\)\s]+$/.test(sanitized)) {
        setDisplay('Error');
        return;
      }
      // Evaluate
      // eslint-disable-next-line no-eval
      const result = Function(`"use strict"; return (${sanitized})`)();
      const rounded = Number.isInteger(result) ? result.toString() : parseFloat(result.toFixed(6)).toString();
      
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
      {/* Display Card */}
      <View style={styles.displayCard}>
        {/* Recent mini history */}
        <ScrollView style={styles.historyBox} contentContainerStyle={{ alignItems: 'flex-end' }}>
          {history.map((h, i) => (
            <Text key={i} style={styles.historyLine}>
              {h.expr} = {h.res}
            </Text>
          ))}
        </ScrollView>

        <Text style={styles.expressionText}>{expression}</Text>
        <Text
          style={[styles.displayText, display.length > 10 && { fontSize: 32 }]}
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          {display}
        </Text>
      </View>

      {/* Keypad */}
      <View style={styles.keypad}>
        {buttons.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.row}>
            {row.map((btn, colIndex) => {
              const isOperator = btn.type === 'operator';
              const isEqual = btn.type === 'equal';
              const isSpecial = btn.type === 'special';

              return (
                <TouchableOpacity
                  key={colIndex}
                  style={[
                    styles.btn,
                    isOperator && styles.operatorBtn,
                    isEqual && styles.equalBtn,
                    isSpecial && styles.specialBtn,
                  ]}
                  onPress={btn.action}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.btnText,
                      isOperator && styles.operatorBtnText,
                      isEqual && styles.equalBtnText,
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: Colors.bg,
    justifyContent: 'space-between',
  },
  displayCard: {
    backgroundColor: Colors.cardBg,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    minHeight: 160,
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  historyBox: {
    maxHeight: 60,
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
    fontWeight: '500',
    marginBottom: 6,
  },
  displayText: {
    color: Colors.text,
    fontSize: 44,
    fontWeight: '700',
  },
  keypad: {
    gap: 10,
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  btn: {
    flex: 1,
    aspectRatio: 1.25,
    backgroundColor: Colors.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: {
    color: Colors.text,
    fontSize: 24,
    fontWeight: '600',
  },
  operatorBtn: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderColor: Colors.accent,
  },
  operatorBtnText: {
    color: Colors.accent,
    fontSize: 26,
    fontWeight: '700',
  },
  equalBtn: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primaryDark,
  },
  equalBtnText: {
    color: '#0F172A',
    fontSize: 28,
    fontWeight: '800',
  },
  specialBtn: {
    backgroundColor: Colors.cardHighlight,
  },
  specialBtnText: {
    color: Colors.secondary,
    fontWeight: '700',
  },
});
