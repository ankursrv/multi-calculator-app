import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import GradientText from './GradientText';

/**
 * Fixed sub-screen header (same style as Home header but with a constant
 * height across all screens). Optional back / reset icon buttons.
 * Pass theme="emerald" for green-accented screens (default: amber).
 */
const THEMES = {
  amber: {
    barGradient: ['#0B1220', '#151016', '#241307'],
    logoGradient: Colors.gradientColors,
    titleGradient: ['#FBBF24', '#F97316', '#EA580C'],
    subtitleColor: '#FB923C',
    sparkleColor: '#FB923C',
    sideIconColor: Colors.amber,
  },
  emerald: {
    barGradient: ['#0B1220', '#0B1F1A', '#05261B'],
    logoGradient: ['#34D399', '#059669'],
    titleGradient: ['#6EE7B7', '#34D399', '#10B981'],
    subtitleColor: '#6EE7B7',
    sparkleColor: '#34D399',
    sideIconColor: '#34D399',
  },
  blue: {
    barGradient: ['#0B1220', '#0A1830', '#0A1F44'],
    logoGradient: ['#38BDF8', '#2563EB'],
    titleGradient: ['#7DD3FC', '#38BDF8', '#2563EB'],
    subtitleColor: '#7DD3FC',
    sparkleColor: '#38BDF8',
    sideIconColor: '#38BDF8',
  },
  // Sacred maroon + marigold (Tyohaar / panchang screens)
  maroon: {
    barGradient: ['#0B1220', '#1D0A12', '#3B0F18'],
    logoGradient: ['#FDBA74', '#E11D48'],
    titleGradient: ['#FDE68A', '#FB923C', '#E11D48'],
    subtitleColor: '#FDBA74',
    sparkleColor: '#FB923C',
    sideIconColor: '#FDBA74',
  },
};

export default function ScreenHeader({
  title,
  subtitle,
  icon = 'calculator-variant',
  onBack,
  onReset,
  theme = 'amber',
}) {
  const t = THEMES[theme] || THEMES.amber;
  return (
    <View style={styles.wrapper}>
      <LinearGradient
        colors={t.barGradient}
        locations={[0, 0.55, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0.9 }}
        style={styles.headerBar}
      >
        {onBack && (
          <TouchableOpacity onPress={onBack} style={styles.sideBtn} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={20} color={t.sideIconColor} />
          </TouchableOpacity>
        )}

        <LinearGradient
          colors={t.logoGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.logoGradient}
        >
          <MaterialCommunityIcons name={icon} size={22} color="#FFFFFF" />
        </LinearGradient>

        <View style={styles.textWrap}>
          <GradientText
            text={title}
            style={styles.title}
            colors={t.titleGradient}
            numberOfLines={1}
          />
          <View style={styles.subtitleRow}>
            <Ionicons name="sparkles" size={11} color={t.sparkleColor} style={{ marginRight: 5 }} />
            <Text style={[styles.subtitle, { color: t.subtitleColor }]} numberOfLines={1}>
              {subtitle}
            </Text>
          </View>
        </View>

        {onReset && (
          <TouchableOpacity onPress={onReset} style={styles.sideBtn} activeOpacity={0.7}>
            <Ionicons name="refresh" size={20} color={t.sideIconColor} />
          </TouchableOpacity>
        )}
      </LinearGradient>

      {/* Subtle slate shadow fade (real shadows don't render on gradient views in Android) */}
      <LinearGradient
        colors={['rgba(100, 116, 139, 0.28)', 'rgba(100, 116, 139, 0)']}
        style={styles.shadowFade}
        pointerEvents="none"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    zIndex: 20,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    height: 72,
    paddingHorizontal: 14,
  },
  sideBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
  },
  logoGradient: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  textWrap: {
    flex: 1,
    marginLeft: 2,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.text,
    letterSpacing: 0.3,
  },
  subtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  shadowFade: {
    height: 14,
    marginTop: -2,
  },
});
