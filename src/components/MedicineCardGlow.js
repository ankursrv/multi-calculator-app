import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, {
  Defs,
  LinearGradient as SvgLinearGradient,
  Stop,
  Rect,
  Path,
} from 'react-native-svg';

/**
 * Ribbon-glow SVG design with medical teal/cyan palette for the Medicine Guide & Scanner card.
 */
export default function MedicineCardGlow() {
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
          {/* Ambient glow emanating from bottom-right */}
          <SvgLinearGradient
            id="ambientGlowMed"
            x1="100%"
            y1="100%"
            x2="35%"
            y2="15%"
          >
            <Stop offset="0%" stopColor="#2DD4BF" stopOpacity="0.45" />
            <Stop offset="30%" stopColor="#06B6D4" stopOpacity="0.22" />
            <Stop offset="65%" stopColor="#0D9488" stopOpacity="0.06" />
            <Stop offset="100%" stopColor="#0D9488" stopOpacity="0" />
          </SvgLinearGradient>

          {/* Soft ribbon gradient */}
          <SvgLinearGradient
            id="ribbonWaveMed"
            x1="100%"
            y1="100%"
            x2="55%"
            y2="35%"
          >
            <Stop offset="0%" stopColor="#5EEAD4" stopOpacity="0.26" />
            <Stop offset="45%" stopColor="#2DD4BF" stopOpacity="0.12" />
            <Stop offset="80%" stopColor="#0D9488" stopOpacity="0.02" />
            <Stop offset="100%" stopColor="#0D9488" stopOpacity="0" />
          </SvgLinearGradient>
        </Defs>

        {/* Ambient atmospheric glow */}
        <Rect x="0" y="0" width="600" height="220" fill="url(#ambientGlowMed)" />

        {/* Soft waves */}
        <Path
          d="M600 102C534 128 503 152 453 175C413 193 378 206 331 220H600V102Z"
          fill="url(#ribbonWaveMed)"
        />
        <Path
          d="M600 148C550 166 524 181 482 198C450 210 422 216 385 220H600V148Z"
          fill="url(#ribbonWaveMed)"
          opacity="0.75"
        />
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
    overflow: 'hidden',
    borderRadius: 20,
  },
});

