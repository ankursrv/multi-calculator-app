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

export default function SamaaBhavCardGlow() {
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
            id="glow"
            x1="510"
            y1="70"
            x2="330"
            y2="230"
            gradientUnits="userSpaceOnUse"
          >
            <Stop offset="0%" stopColor="#FF8A00" stopOpacity="0.38" />
            <Stop offset="55%" stopColor="#FF6B00" stopOpacity="0.16" />
            <Stop offset="100%" stopColor="#FF6B00" stopOpacity="0" />
          </SvgLinearGradient>

          <SvgLinearGradient
            id="ribbon"
            x1="590"
            y1="130"
            x2="330"
            y2="250"
            gradientUnits="userSpaceOnUse"
          >
            <Stop offset="0%" stopColor="#FF9A00" stopOpacity="0.55" />
            <Stop offset="58%" stopColor="#FF7900" stopOpacity="0.24" />
            <Stop offset="100%" stopColor="#FF7900" stopOpacity="0" />
          </SvgLinearGradient>

          <SvgLinearGradient
            id="ribbon2"
            x1="600"
            y1="178"
            x2="390"
            y2="240"
            gradientUnits="userSpaceOnUse"
          >
            <Stop offset="0%" stopColor="#FFB11B" stopOpacity="0.44" />
            <Stop offset="100%" stopColor="#FF7000" stopOpacity="0" />
          </SvgLinearGradient>
        </Defs>

        <Filter
          id="softGlow"
          x="180"
          y="-30"
          width="470"
          height="330"
          filterUnits="userSpaceOnUse"
        >
          <FeGaussianBlur stdDeviation="22" />
        </Filter>

        <Ellipse cx="490" cy="177" rx="165" ry="93" fill="url(#glow)" filter="url(#softGlow)" />
        <Path
          d="M600 102C534 128 503 152 453 175C413 193 378 206 331 220H600V102Z"
          fill="url(#ribbon)"
        />
        <Path
          d="M600 145C541 161 501 183 469 201C444 215 420 220 392 220H600V145Z"
          fill="url(#ribbon2)"
        />
        <Path
          d="M600 128C551 149 523 164 489 181C456 198 425 211 400 220"
          stroke="#FF8A00"
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
