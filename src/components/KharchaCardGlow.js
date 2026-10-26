import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, {
  Defs,
  LinearGradient as SvgLinearGradient,
  Stop,
  Ellipse,
  Path,
} from 'react-native-svg';

/**
 * Same ribbon-glow SVG design as SamaaBhavCardGlow (Kirana card),
 * recolored to the emerald palette for the Kharcha Tracker card.
 */
export default function KharchaCardGlow() {
  return (
    <View style={styles.container} pointerEvents="none">
      <Svg
        width="100%"
        height="100%"
        viewBox="330 140 270 80"
        fill="none"
        preserveAspectRatio="xMaxYMax meet"
      >
        <Defs>
          <SvgLinearGradient
            id="glowG"
            x1="510"
            y1="70"
            x2="330"
            y2="230"
            gradientUnits="userSpaceOnUse"
          >
            <Stop offset="0%" stopColor="#34D399" stopOpacity="0.45" />
            <Stop offset="55%" stopColor="#10B981" stopOpacity="0.2" />
            <Stop offset="100%" stopColor="#10B981" stopOpacity="0" />
          </SvgLinearGradient>

          <SvgLinearGradient
            id="ribbonG"
            x1="590"
            y1="130"
            x2="330"
            y2="250"
            gradientUnits="userSpaceOnUse"
          >
            <Stop offset="0%" stopColor="#34D399" stopOpacity="0.6" />
            <Stop offset="58%" stopColor="#10B981" stopOpacity="0.28" />
            <Stop offset="100%" stopColor="#10B981" stopOpacity="0" />
          </SvgLinearGradient>

          <SvgLinearGradient
            id="ribbon2G"
            x1="600"
            y1="178"
            x2="390"
            y2="240"
            gradientUnits="userSpaceOnUse"
          >
            <Stop offset="0%" stopColor="#6EE7B7" stopOpacity="0.5" />
            <Stop offset="100%" stopColor="#10B981" stopOpacity="0" />
          </SvgLinearGradient>
        </Defs>

        <Ellipse cx="490" cy="177" rx="165" ry="93" fill="url(#glowG)" />
        <Path
          d="M600 102C534 128 503 152 453 175C413 193 378 206 331 220H600V102Z"
          fill="url(#ribbonG)"
        />
        <Path
          d="M600 145C541 161 501 183 469 201C444 215 420 220 392 220H600V145Z"
          fill="url(#ribbon2G)"
        />
        <Path
          d="M600 128C551 149 523 164 489 181C456 198 425 211 400 220"
          stroke="#34D399"
          strokeOpacity="0.25"
          strokeWidth="1.5"
        />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 175,
    height: 65,
    overflow: 'hidden',
    borderBottomRightRadius: 24,
  },
});
