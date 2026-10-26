import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, {
  Defs,
  LinearGradient as SvgLinearGradient,
  Stop,
  Ellipse,
  Path,
  Filter,
  FeGaussianBlur,
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
        viewBox="0 0 600 220"
        fill="none"
        preserveAspectRatio="none"
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
            <Stop offset="0%" stopColor="#34D399" stopOpacity="0.38" />
            <Stop offset="55%" stopColor="#10B981" stopOpacity="0.16" />
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
            <Stop offset="0%" stopColor="#34D399" stopOpacity="0.55" />
            <Stop offset="58%" stopColor="#10B981" stopOpacity="0.24" />
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
            <Stop offset="0%" stopColor="#6EE7B7" stopOpacity="0.44" />
            <Stop offset="100%" stopColor="#10B981" stopOpacity="0" />
          </SvgLinearGradient>
        </Defs>

        <Filter
          id="softGlowG"
          x="180"
          y="-30"
          width="470"
          height="330"
          filterUnits="userSpaceOnUse"
        >
          <FeGaussianBlur stdDeviation="22" />
        </Filter>

        <Ellipse cx="490" cy="177" rx="165" ry="93" fill="url(#glowG)" filter="url(#softGlowG)" />
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
          strokeOpacity="0.16"
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
