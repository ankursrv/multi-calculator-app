import React, { useEffect, useState } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../theme/colors';
import { useLanguage } from '../context/LanguageContext';

const LANGUAGE_OPTIONS = [
  { code: 'en', label: 'English', labelHi: 'English' },
  { code: 'hi', label: 'Hindi', labelHi: 'हिंदी' },
];

export default function SideDrawer({ visible, onClose }) {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { language, setLanguage } = useLanguage();

  const drawerWidth = Math.round(width * 0.78);
  // Animated.Value kept in state: stable across renders, safe to read while rendering
  const [progress] = useState(() => new Animated.Value(visible ? 1 : 0));
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    Animated.timing(progress, {
      toValue: visible ? 1 : 0,
      duration: visible ? 300 : 240,
      easing: visible ? Easing.out(Easing.cubic) : Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [visible, progress]);

  const translateX = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [-drawerWidth - 12, 0],
  });

  const selectedOption =
    LANGUAGE_OPTIONS.find((option) => option.code === language) || LANGUAGE_OPTIONS[0];
  const optionLabel = (option) => (language === 'hi' ? option.labelHi : option.label);

  const handleClose = () => {
    setDropdownOpen(false);
    onClose();
  };

  const handleSelect = (code) => {
    setLanguage(code);
    setDropdownOpen(false);
  };

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {/* Blurred backdrop */}
      <Animated.View
        style={[StyleSheet.absoluteFill, { opacity: progress }]}
        pointerEvents={visible ? 'auto' : 'none'}
      >
        {visible && (
          <BlurView
            intensity={30}
            tint="dark"
            experimentalBlurMethod="dimezisBlurView"
            style={StyleSheet.absoluteFill}
          />
        )}
        <Pressable style={[StyleSheet.absoluteFill, styles.backdropTint]} onPress={handleClose} />
      </Animated.View>

      {/* Sliding panel */}
      <Animated.View
        pointerEvents={visible ? 'auto' : 'none'}
        style={[
          styles.drawer,
          {
            width: drawerWidth,
            paddingTop: insets.top + 10,
            paddingBottom: insets.bottom + 14,
            transform: [{ translateX }],
          },
        ]}
      >
        <LinearGradient
          colors={['#0B1220', '#101A2C', '#0A111F']}
          locations={[0, 0.45, 1]}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
        <View style={styles.edgeGlow} pointerEvents="none" />

        {/* Header — sirf close icon */}
        <View style={styles.closeRow}>
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={handleClose}
            activeOpacity={0.75}
            accessibilityRole="button"
            accessibilityLabel="Close menu"
          >
            <Ionicons name="close" size={20} color={Colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Language selector: left label, right current language + chevron */}
        <View style={styles.languageCard}>
          <View style={styles.languageRow}>
            <Text style={styles.languageLabel}>Language</Text>

            <TouchableOpacity
              style={styles.trigger}
              onPress={() => setDropdownOpen((prev) => !prev)}
              activeOpacity={0.8}
            >
              <Text style={styles.triggerText}>{optionLabel(selectedOption)}</Text>
              <Ionicons
                name={dropdownOpen ? 'chevron-up' : 'chevron-down'}
                size={16}
                color="#6EE7B7"
              />
            </TouchableOpacity>
          </View>

          {dropdownOpen && (
            <View style={styles.dropdownList}>
              {LANGUAGE_OPTIONS.map((option) => {
                const selected = option.code === language;
                return (
                  <TouchableOpacity
                    key={option.code}
                    style={[styles.dropdownItem, selected && styles.dropdownItemActive]}
                    onPress={() => handleSelect(option.code)}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[styles.dropdownItemText, selected && styles.dropdownItemTextActive]}
                    >
                      {optionLabel(option)}
                    </Text>
                    {selected && <Ionicons name="checkmark" size={16} color="#34D399" />}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdropTint: {
    backgroundColor: 'rgba(3, 7, 18, 0.45)',
  },
  drawer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    borderTopRightRadius: 22,
    borderBottomRightRadius: 22,
    overflow: 'hidden',
    borderRightWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.22)',
    shadowColor: '#000000',
    shadowOffset: { width: 8, height: 0 },
    shadowOpacity: 0.55,
    shadowRadius: 18,
    elevation: 24,
  },
  edgeGlow: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    width: 2,
    backgroundColor: 'rgba(245, 158, 11, 0.28)',
  },
  closeRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 14,
    paddingBottom: 6,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  languageCard: {
    marginHorizontal: 14,
    marginTop: 6,
    paddingHorizontal: 2,
    paddingTop: 4,
  },
  languageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  languageLabel: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#E2E8F0',
    letterSpacing: 0.2,
  },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 4,
    paddingVertical: 6,
  },
  triggerText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#F1F5F9',
  },
  dropdownList: {
    marginTop: 10,
    borderRadius: 11,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.25)',
    backgroundColor: 'rgba(2, 6, 23, 0.82)',
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  dropdownItemActive: {
    backgroundColor: 'rgba(52, 211, 153, 0.12)',
  },
  dropdownItemText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#CBD5E1',
  },
  dropdownItemTextActive: {
    color: '#6EE7B7',
    fontWeight: '800',
  },
});
