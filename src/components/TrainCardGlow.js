import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, {
  Defs,
  LinearGradient as SvgLinearGradient,
  Stop,
  Rect,
  Path,
  Circle,
} from 'react-native-svg';

/**
 * Railway-themed hero illustration for the Live Train Status card.
 * A stylized train on tracks with signal light glow.
 */
export default function TrainCardGlow() {
  return (
    <View style={styles.container} pointerEvents="none">
      <Svg
        width="100%"
        height="100%"
        viewBox="0 0 600 220"
        fill="none"
        preserveAspectRatio="none"
      >
        <Defs>
          <SvgLinearGradient
            id="railGlow"
            x1="100%"
            y1="100%"
            x2="40%"
            y2="20%"
          >
            <Stop offset="0%" stopColor="#38BDF8" stopOpacity="0.30" />
            <Stop offset="40%" stopColor="#2563EB" stopOpacity="0.12" />
            <Stop offset="80%" stopColor="#1E3A8A" stopOpacity="0.04" />
            <Stop offset="100%" stopColor="#1E3A8A" stopOpacity="0" />
          </SvgLinearGradient>

          <SvgLinearGradient
            id="trackWave"
            x1="100%"
            y1="100%"
            x2="50%"
            y2="30%"
          >
            <Stop offset="0%" stopColor="#BFDBFE" stopOpacity="0.20" />
            <Stop offset="50%" stopColor="#60A5FA" stopOpacity="0.08" />
            <Stop offset="100%" stopColor="#2563EB" stopOpacity="0" />
          </SvgLinearGradient>
        </Defs>

        {/* Ambient rail glow */}
        <Rect x="0" y="0" width="600" height="220" fill="url(#railGlow)" />

        {/* Track lines converging into distance */}
        <Path
          d="M0 180 L 280 90 L 600 90"
          stroke="#38BDF8"
          strokeOpacity="0.25"
          strokeWidth="2"
          fill="none"
        />
        <Path
          d="M60 180 L 300 90 L 600 90"
          stroke="#2563EB"
          strokeOpacity="0.18"
          strokeWidth="2"
          fill="none"
        />

        {/* Signal light glow */}
        <Path
          d="M560 130 C 540 140 520 140 500 130 C 480 120 500 110 520 100 C 540 90 560 90 580 100"
          fill="url(#trackWave)"
        />
        <Circle cx="550" cy="105" r="6" fill="#38BDF8" fillOpacity="0.6" />
        <Circle cx="550" cy="105" r="3" fill="#FFFFFF" />

        {/* Train front glow */}
        <Path
          d="M200 150 L 230 150 L 220 170 L 200 170 Z"
          fill="#60A5FA"
          fillOpacity="0.35"
        />
        <Circle cx="215" cy="160" r="4" fill="#FFFFFF" fillOpacity="0.5" />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    borderRadius: 24,
  },
});
