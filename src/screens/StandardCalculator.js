import React, { useState, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Modal,
  TouchableWithoutFeedback,
  Animated,
  Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../theme/colors';
import ScreenHeader from '../components/ScreenHeader';

const HISTORY_KEY = 'calculatorHistory';

// History entry ka time stamp (helper module scope me, taaki purity rule khush rahe)
const nowStamp = () => Date.now();

// History ko din ke hisaab se baantne ke liye label (Today / Yesterday / 2026.10.23)
function dayLabel(ts) {
  if (!ts) return 'Today';
  const d = new Date(ts);
  const today = new Date();
  const daysAgo = Math.round(
    (new Date(today.getFullYear(), today.getMonth(), today.getDate()) -
      new Date(d.getFullYear(), d.getMonth(), d.getDate())) /
      86400000,
  );
  if (daysAgo === 0) return 'Today';
  if (daysAgo === 1) return 'Yesterday';
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())}`;
}

export default function StandardCalculator({ onBack }) {
  const [display, setDisplay] = useState('0');
  const [expression, setExpression] = useState('');
  const [history, setHistory] = useState([]);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  // History panel khulta/band hota hai — toggle icon keypad ke upar hi rehta hai
  const [showHistory, setShowHistory] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  // Slide animation: panel left (-width) se 0 par aata hai
  const [gridW, setGridW] = useState(0);
  const [slideAnim] = useState(() => new Animated.Value(0));

  // Tab switch par screen unmount hoti hai, isliye history device par save rehti hai
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(HISTORY_KEY);
        if (raw) setHistory(JSON.parse(raw));
      } catch {
        // first run / corrupt data — start fresh
      }
      setHistoryLoaded(true);
    })();
  }, []);

  useEffect(() => {
    if (!historyLoaded) return;
    AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(history)).catch(() => {});
  }, [history, historyLoaded]);

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

      setHistory([{ expr: display, res: rounded, ts: nowStamp() }, ...history.slice(0, 49)]);
      setExpression(display + ' =');
      setDisplay(rounded);
    } catch {
      setDisplay('Error');
    }
  };

  const clearHistory = () => {
    setHistory([]);
    setConfirmClear(false);
  };

  // Panel ki slide panel ki hi width par depend karti hai, isliye grid naap te hain
  const measureGrid = (e) => setGridW(e.nativeEvent.layout.width);

  const toggleHistory = () => {
    const next = !showHistory;
    setShowHistory(next);
    Animated.timing(slideAnim, {
      toValue: next ? 1 : 0,
      duration: 280,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  };

  const panelSlide = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-(gridW || 320), 0],
  });
  const panelOpacity = slideAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });

  // Same day wali entries ek group me, bilkul phone calculator jaisa
  const historyGroups = useMemo(() => {
    const groups = [];
    history.forEach((h) => {
      const label = dayLabel(h.ts);
      const last = groups[groups.length - 1];
      if (last && last.label === label) last.items.push(h);
      else groups.push({ label, items: [h] });
    });
    return groups;
  }, [history]);

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
      <ScreenHeader title="Calculator" subtitle="Quick & Accurate Maths" onBack={onBack} />

      {/* Screen Body */}
      <View style={styles.body}>
        {/* Display Card */}
        <View style={styles.displayCard}>
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
          {/* Toggle icon hamesha apni jagah: clock = history kholo, calculator = panel band */}
          <View style={styles.iconRow}>
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={toggleHistory}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons
                name={showHistory ? 'calculator-outline' : 'time-outline'}
                size={23}
                color={Colors.textDim}
              />
            </TouchableOpacity>
          </View>

          {/* Number keys + unpar left se slide hone wala history overlay panel */}
          <View style={styles.keypadGrid} onLayout={measureGrid}>
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

            {/* Panel sirf number keys wala hissa cover karta hai, operator column free rehta hai */}
            <Animated.View
              pointerEvents={showHistory ? 'auto' : 'none'}
              style={[
                styles.historyPanel,
                {
                  width: gridW * 0.75,
                  opacity: panelOpacity,
                  transform: [{ translateX: panelSlide }],
                },
              ]}
            >
              {history.length === 0 ? (
                <View style={styles.emptyBox}>
                  <Ionicons name="time-outline" size={32} color={Colors.textDim} />
                  <Text style={styles.emptyText}>अभी कोई history नहीं है।</Text>
                  <Text style={styles.emptySub}>= दबाओ, entries यहाँ जुड़ती जाएँगी।</Text>
                </View>
              ) : (
                <ScrollView
                  style={styles.historyScroll}
                  contentContainerStyle={styles.historyListContent}
                  showsVerticalScrollIndicator={false}
                >
                  {historyGroups.map((g) => (
                    <View key={g.label}>
                      <Text style={styles.groupLabel}>{g.label}</Text>
                      {g.items.map((h, i) => (
                        <View key={`${h.expr}-${i}`} style={styles.hEntry}>
                          <Text style={styles.hExpr} numberOfLines={1}>
                            {h.expr}
                          </Text>
                          <Text style={styles.hRes} numberOfLines={1}>
                            ={h.res}
                          </Text>
                        </View>
                      ))}
                    </View>
                  ))}
                </ScrollView>
              )}

              {history.length > 0 && (
                <TouchableOpacity
                  style={styles.clearBar}
                  onPress={() => setConfirmClear(true)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.clearBarText}>Clear history</Text>
                </TouchableOpacity>
              )}
            </Animated.View>
          </View>
        </View>
      </View>

      {/* Clear History ka confirmation popup */}
      <Modal
        visible={confirmClear}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmClear(false)}
      >
        <TouchableWithoutFeedback onPress={() => setConfirmClear(false)}>
          <View style={styles.modalBackdrop}>
            <TouchableWithoutFeedback>
              <View style={styles.confirmPanel}>
                <View style={styles.confirmIconWrap}>
                  <Ionicons name="trash-outline" size={26} color="#F87171" />
                </View>
                <Text style={styles.confirmTitle}>पूरी history मिटाएं?</Text>
                <Text style={styles.confirmMsg}>
                  {history.length} calculations की history delete हो जाएगी। यह वापस नहीं मिलेगी।
                </Text>
                <View style={styles.confirmBtnRow}>
                  <TouchableOpacity
                    style={styles.confirmCancelBtn}
                    onPress={() => setConfirmClear(false)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.confirmCancelText}>रुको ✋</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.confirmDangerBtn}
                    onPress={clearHistory}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.confirmDangerText}>हाँ, मिटाएं</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
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
  // History panel: number keys ke upar baithta hai, left se smooth slide
  historyPanel: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: Colors.bgSecondary,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: 10,
  },
  historyScroll: {
    flex: 1,
  },
  historyListContent: {
    paddingBottom: 8,
  },
  groupLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.amber,
    textAlign: 'right',
    marginTop: 12,
    marginBottom: 2,
    paddingHorizontal: 2,
  },
  hEntry: {
    alignItems: 'flex-end',
    paddingHorizontal: 2,
    paddingTop: 7,
    paddingBottom: 3,
  },
  hExpr: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textMuted,
    maxWidth: '100%',
  },
  hRes: {
    fontSize: 21,
    fontWeight: '800',
    color: Colors.text,
    marginTop: 1,
    maxWidth: '100%',
  },
  clearBar: {
    marginTop: 8,
    paddingVertical: 13,
    borderRadius: 14,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.35)',
    alignItems: 'center',
  },
  clearBarText: {
    fontSize: 14.5,
    fontWeight: '800',
    color: Colors.amber,
  },
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBtn: {
    width: 40,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingVertical: 30,
  },
  emptyText: {
    color: Colors.textMuted,
    fontSize: 13.5,
    fontWeight: '600',
    marginTop: 10,
    textAlign: 'center',
  },
  emptySub: {
    color: Colors.textDim,
    fontSize: 11,
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: 10,
    lineHeight: 15,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(3, 7, 18, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  confirmPanel: {
    width: 300,
    backgroundColor: Colors.bgSecondary,
    borderWidth: 1,
    borderColor: 'rgba(248, 113, 113, 0.25)',
    borderRadius: 20,
    padding: 22,
    alignItems: 'center',
  },
  confirmIconWrap: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: 'rgba(248, 113, 113, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(248, 113, 113, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  confirmTitle: {
    fontSize: 16.5,
    fontWeight: '800',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 6,
  },
  confirmMsg: {
    fontSize: 12.5,
    color: Colors.textDim,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 18,
  },
  confirmBtnRow: {
    flexDirection: 'row',
    gap: 10,
    alignSelf: 'stretch',
  },
  confirmCancelBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 11,
    borderRadius: 12,
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  confirmCancelText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
  },
  confirmDangerBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 11,
    borderRadius: 12,
    backgroundColor: Colors.danger,
  },
  confirmDangerText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
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
  keypadGrid: {
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
