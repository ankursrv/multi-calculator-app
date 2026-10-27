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
 * Same ribbon-glow SVG design as SamaaBhavCardGlow (Kirana card),
 * recolored to the banking deep-blue palette for the FD Calculator card.
 */
export default function FdCardGlow() {
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
          {/* 1. Seamless background corner glow emanating from bottom-right */}
          <SvgLinearGradient
            id="ambientGlowB"
            x1="100%"
            y1="100%"
            x2="35%"
            y2="15%"
          >
            <Stop offset="0%" stopColor="#38BDF8" stopOpacity="0.42" />
            <Stop offset="30%" stopColor="#0EA5E9" stopOpacity="0.20" />
            <Stop offset="65%" stopColor="#2563EB" stopOpacity="0.06" />
            <Stop offset="100%" stopColor="#2563EB" stopOpacity="0" />
          </SvgLinearGradient>

          {/* 2. Soft ribbon gradient that dissolves to transparent at the curve edges */}
          <SvgLinearGradient
            id="ribbonWaveB"
            x1="100%"
            y1="100%"
            x2="55%"
            y2="35%"
          >
            <Stop offset="0%" stopColor="#7DD3FC" stopOpacity="0.24" />
            <Stop offset="45%" stopColor="#38BDF8" stopOpacity="0.10" />
            <Stop offset="80%" stopColor="#0EA5E9" stopOpacity="0.02" />
            <Stop offset="100%" stopColor="#0EA5E9" stopOpacity="0" />
          </SvgLinearGradient>
        </Defs>

        {/* Ambient atmospheric glow seamlessly blended into card background */}
        <Rect x="0" y="0" width="600" height="220" fill="url(#ambientGlowB)" />

        {/* Delicate ribbon waves that melt into the ambient glow without hard edges */}
        <Path
          d="M600 102C534 128 503 152 453 175C413 193 378 206 331 220H600V102Z"
          fill="url(#ribbonWaveB)"
        />
        <Path
          d="M600 145C541 161 501 183 469 201C444 215 420 220 392 220H600V145Z"
          fill="url(#ribbonWaveB)"
        />
        <Path
          d="M600 128C551 149 523 164 489 181C456 198 425 211 400 220"
          stroke="#38BDF8"
          strokeOpacity="0.18"
          strokeWidth="1.5"
        />
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
