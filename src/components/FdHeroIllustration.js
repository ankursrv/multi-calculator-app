import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, {
  Defs,
  LinearGradient as SvgLinearGradient,
  Stop,
  Polygon,
  Rect,
  Path,
  Circle,
  Text as SvgText,
} from 'react-native-svg';

/**
 * Banking-themed hero illustration for the FD Calculator.
 * A classic bank/institution building (pediment + columns) with a ₹ emblem
 * and a rising growth arc, drawn in translucent white so it reads as a
 * premium watermark behind the maturity figures.
 *
 * NOTE: the Svg must use percentage dimensions + viewBox (like the card glow
 * components). A fixed pixel width/height makes react-native-svg report an
 * intrinsic size on Android, which inflates the absolutely-positioned wrapper
 * and adds phantom height to the hero card.
 */
export default function FdHeroIllustration() {
  return (
    <View style={styles.container} pointerEvents="none">
      <Svg
        width="100%"
        height="100%"
        viewBox="0 0 160 160"
        fill="none"
        preserveAspectRatio="xMidYMid meet"
      >
        <Defs>
          <SvgLinearGradient id="bankFade" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.12" />
            <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.03" />
          </SvgLinearGradient>
        </Defs>

        {/* Rising growth arc behind the building */}
        <Path
          d="M14 118 C 48 108, 60 70, 92 52 S 140 30, 150 22"
          stroke="#FFFFFF"
          strokeOpacity="0.09"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <Circle cx="150" cy="22" r="4" fill="#FFFFFF" fillOpacity="0.12" />

        {/* Pediment (roof triangle) */}
        <Polygon
          points="80,20 138,50 22,50"
          fill="url(#bankFade)"
          stroke="#FFFFFF"
          strokeOpacity="0.10"
          strokeWidth="1.5"
        />

        {/* ₹ emblem on the pediment */}
        <SvgText
          x="80"
          y="45"
          fontSize="20"
          fontWeight="800"
          fill="#FFFFFF"
          fillOpacity="0.16"
          textAnchor="middle"
        >
          ₹
        </SvgText>

        {/* Roof beam */}
        <Rect x="28" y="52" width="104" height="9" rx="2" fill="#FFFFFF" fillOpacity="0.09" />

        {/* Columns */}
        <Rect x="34" y="66" width="13" height="44" rx="2" fill="url(#bankFade)" />
        <Rect x="57" y="66" width="13" height="44" rx="2" fill="url(#bankFade)" />
        <Rect x="80" y="66" width="13" height="44" rx="2" fill="url(#bankFade)" />
        <Rect x="103" y="66" width="13" height="44" rx="2" fill="url(#bankFade)" />

        {/* Base steps */}
        <Rect x="30" y="112" width="100" height="8" rx="2" fill="#FFFFFF" fillOpacity="0.09" />
        <Rect x="20" y="123" width="120" height="9" rx="2" fill="#FFFFFF" fillOpacity="0.07" />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
});
