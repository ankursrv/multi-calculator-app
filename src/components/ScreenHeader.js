import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import GradientText from './GradientText';

/**
 * Fixed sub-screen header (same style as Home header but with a constant
 * height across all screens). Optional back / reset icon buttons.
 */
export default function ScreenHeader({
  title,
  subtitle,
  icon = 'calculator-variant',
  onBack,
  onReset,
}) {
  return (
    <View style={styles.wrapper}>
      <LinearGradient
        colors={['#0B1220', '#151016', '#241307']}
        locations={[0, 0.55, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0.9 }}
        style={styles.headerBar}
      >
        {onBack && (
          <TouchableOpacity onPress={onBack} style={styles.sideBtn} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={20} color={Colors.amber} />
          </TouchableOpacity>
        )}

        <LinearGradient
          colors={Colors.gradientColors}
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
            colors={['#FBBF24', '#F97316', '#EA580C']}
            numberOfLines={1}
          />
          <View style={styles.subtitleRow}>
            <Ionicons name="sparkles" size={11} color="#FB923C" style={{ marginRight: 5 }} />
            <Text style={styles.subtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          </View>
        </View>

        {onReset && (
          <TouchableOpacity onPress={onReset} style={styles.sideBtn} activeOpacity={0.7}>
            <Ionicons name="refresh" size={20} color={Colors.amber} />
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
    color: '#FB923C',
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  shadowFade: {
    height: 14,
    marginTop: -2,
  },
});
