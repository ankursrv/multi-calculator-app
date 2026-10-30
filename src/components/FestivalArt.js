import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, {
  Circle,
  Defs,
  Ellipse,
  G,
  Line,
  LinearGradient as SvgGrad,
  Path,
  Stop,
} from 'react-native-svg';

/**
 * The festival illustration + colour scheme for a card background.
 *
 * Keka's holiday card paints the whole card in the festival's colour and hangs
 * a little scene (diyas) off one corner. This does the same thing offline: the
 * scenes are hand-drawn SVG, so nothing is downloaded and nothing is added to
 * the bundle, and they are rendered as an absolutely positioned layer so the
 * card's height still comes from its text.
 */

// Ordered, most specific first. The key picks both the picture and the palette.
const ART_RULES = [
  [/गणतंत्र दिवस|स्वतंत्रता दिवस|गांधी जयंती|अंबेडकर जयंती/, 'tiranga'],
  [/ग्रहण/, 'eclipse'],
  [/दिवाली|नरक चतुर्दशी|दीप|धनतेरस|बैक|छठ/, 'deep'],
  [/संक्रांति|दक्षिणायन|उत्तरायण|सूर्य/, 'sun'],
  [/करवा|तीज|पूर्णिमा|अमावस्या|चन्द्र|शशिकला/, 'moon'],
  [/गणेश|विनायक|संकष्ट|दुर्गा|नवरात्रि|गौरी|शिवरात्रि|शिव|सोमवार|प्रदोष/, 'trishul'],
  [/कृष्ण|जन्माष्टमी|होली|वसंत|रास/, 'peacock'],
  [/रक्षा|भाई|यम|राजलक्ष्मी/, 'rakhi'],
  [/रथ|दशहरा|विजय|उगादी|गुड़ी|पडवा|प्रतिपदा|नव वर्ष|उपाकर्म/, 'flag'],
  [/एकदशी|एकादशी|अक्षय|मोक्ष|पंचमी|षष्ठी|सप्तमी|अष्टमी|नवमी|दशमी|द्वादशी|त्रयोदशी|चतुर्दशी|ओणम|कार्तिकै|गोवर्धन|वट/, 'kalash'],
];

// Fallback per festival type, for a name the list above has not seen
const ART_BY_TYPE = {
  national: 'tiranga',
  eclipse: 'eclipse',
  major: 'deep',
  sankranti: 'sun',
  ekadashi: 'kalash',
  vaishnava_ekadashi: 'kalash',
  smarta_ekadashi: 'kalash',
  pradosha: 'trishul',
  minor: 'toran',
};

const PALETTES = {
  // background gradient (dark → bright, left to right) + the ink for the name
  deep: { bg: ['#5B1B0A', '#A8480A', '#E8A31B'], ink: '#FFF7E6' },
  sun: { bg: ['#6B1D05', '#C2410C', '#F59E0B'], ink: '#FFFBEB' },
  moon: { bg: ['#15123B', '#312E81', '#5B4BA8'], ink: '#EEF0FF' },
  trishul: { bg: ['#0F1B2E', '#1E3A5F', '#3B6C8F'], ink: '#E8F3FA' },
  peacock: { bg: ['#06281F', '#0F5132', '#1E7A6B'], ink: '#E7FFF6' },
  rakhi: { bg: ['#33074F', '#6B21A8', '#B0457A'], ink: '#FBEFFF' },
  flag: { bg: ['#4A1220', '#9F1239', '#D97706'], ink: '#FFF1E6' },
  kalash: { bg: ['#3F1607', '#8A3B12', '#D08700'], ink: '#FFF6E0' },
  // saffron into green, so the card itself reads as the tricolour
  tiranga: { bg: ['#602A06', '#9A5108', '#124F2C'], ink: '#FFF8E7' },
  eclipse: { bg: ['#080B14', '#1F2937', '#475569'], ink: '#E5EAF2' },
  toran: { bg: ['#2B0F14', '#4A1220', '#6B1A24'], ink: '#FDE68A' },
};

export function festivalArt(name, type) {
  const hit = ART_RULES.find(([on]) => on.test(name || ''));
  const key = hit ? hit[1] : ART_BY_TYPE[type] || 'toran';
  return { key, ...PALETTES[key] };
}

/* ── the scenes ─────────────────────────────────────────────── */

function Diya({ x, y, s = 1 }) {
  return (
    <G x={x} y={y} scale={s}>
      <Line x1="0" y1="-64" x2="0" y2="-14" stroke="#FDE68A" strokeWidth="1.1" opacity="0.45" />
      <Path d="M0 -22 Q9 -12 0 -3 Q-9 -12 0 -22Z" fill="#FCD34D" opacity="0.95" />
      <Path d="M0 -17 Q5 -11 0 -5 Q-5 -11 0 -17Z" fill="#FFF7E6" />
      <Ellipse cx="0" cy="-1" rx="17" ry="5" fill="#7C2D12" />
      <Path d="M-17 -1 Q0 16 17 -1 Q0 7 -17 -1Z" fill="#B45309" />
      <Ellipse cx="0" cy="-1" rx="12" ry="3.2" fill="#F59E0B" opacity="0.85" />
    </G>
  );
}

function Ray({ x, y, s = 1 }) {
  return (
    <G x={x} y={y} scale={s}>
      {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
        <Line
          key={deg}
          x1="0"
          y1="-20"
          x2="0"
          y2="-33"
          stroke="#FDE68A"
          strokeWidth="2.4"
          strokeLinecap="round"
          opacity="0.8"
          transform={`rotate(${deg})`}
        />
      ))}
      <Circle cx="0" cy="0" r="19" fill="#FBBF24" />
      <Circle cx="0" cy="0" r="12" fill="#FEF3C7" opacity="0.75" />
    </G>
  );
}

function Feather({ x, y, s = 1, rot = 0 }) {
  return (
    <G x={x} y={y} scale={s} transform={`rotate(${rot})`}>
      <Path d="M0 26 Q-4 6 0 -18" stroke="#065F46" strokeWidth="2" fill="none" />
      <Ellipse cx="0" cy="-22" rx="12" ry="17" fill="#047857" opacity="0.9" />
      <Ellipse cx="0" cy="-24" rx="8" ry="12" fill="#0EA5E9" />
      <Ellipse cx="0" cy="-26" rx="4.5" ry="7" fill="#FACC15" />
      <Circle cx="0" cy="-28" r="2.4" fill="#7C3AED" />
    </G>
  );
}

function Scene({ art }) {
  if (art === 'deep') {
    return (
      <G>
        <Diya x={30} y={54} s={1} />
        <Diya x={78} y={78} s={0.82} />
        <Diya x={104} y={44} s={0.6} />
      </G>
    );
  }
  if (art === 'sun') {
    return (
      <G>
        <Ray x={64} y={54} s={1.25} />
        <Path d="M4 96 Q34 78 64 96 T120 96" stroke="#FDE68A" strokeWidth="2" fill="none" opacity="0.5" />
      </G>
    );
  }
  if (art === 'moon') {
    return (
      <G>
        <Path d="M84 26 A30 30 0 1 0 84 86 A23 23 0 1 1 84 26Z" fill="#FDE68A" />
        <Circle cx="34" cy="34" r="2.6" fill="#FEF9C3" opacity="0.9" />
        <Circle cx="22" cy="62" r="1.9" fill="#FEF9C3" opacity="0.7" />
        <Circle cx="46" cy="80" r="2.2" fill="#FEF9C3" opacity="0.8" />
        <Ellipse cx="60" cy="104" rx="46" ry="7" fill="#B45309" opacity="0.55" />
      </G>
    );
  }
  if (art === 'trishul') {
    return (
      <G>
        <Line x1="66" y1="16" x2="66" y2="104" stroke="#E2E8F0" strokeWidth="4" strokeLinecap="round" />
        <Path
          d="M40 44 Q40 22 50 20 M92 44 Q92 22 82 20 M66 40 L66 18 M40 44 Q66 58 92 44"
          stroke="#F1F5F9"
          strokeWidth="4.5"
          strokeLinecap="round"
          fill="none"
        />
        <Path d="M50 20 L44 34 M82 20 L88 34" stroke="#F1F5F9" strokeWidth="4.5" strokeLinecap="round" />
        <Circle cx="66" cy="62" r="5" fill="#FBBF24" />
        <Path d="M24 88 Q38 78 52 88 L52 100 Q38 110 24 100Z" fill="#B45309" opacity="0.8" />
      </G>
    );
  }
  if (art === 'peacock') {
    return (
      <G>
        <Feather x={34} y={86} s={1} rot={-16} />
        <Feather x={66} y={94} s={1.12} rot={2} />
        <Feather x={98} y={84} s={0.92} rot={18} />
      </G>
    );
  }
  if (art === 'rakhi') {
    return (
      <G>
        <Path d="M2 52 Q60 30 118 56" stroke="#F472B6" strokeWidth="3" fill="none" />
        <Path d="M2 62 Q60 86 118 60" stroke="#FACC15" strokeWidth="3" fill="none" />
        {[0, 60, 120, 180, 240, 300].map((deg) => (
          <Ellipse
            key={deg}
            cx="60"
            cy="42"
            rx="9"
            ry="15"
            fill="#E11D48"
            opacity="0.85"
            transform={`rotate(${deg} 60 58)`}
          />
        ))}
        <Circle cx="60" cy="58" r="11" fill="#FDE68A" />
        <Circle cx="60" cy="58" r="5" fill="#0EA5E9" />
      </G>
    );
  }
  if (art === 'flag') {
    return (
      <G>
        <Line x1="40" y1="10" x2="40" y2="106" stroke="#FDE68A" strokeWidth="4" strokeLinecap="round" />
        <Path d="M42 14 L96 30 L42 46Z" fill="#EA580C" />
        <Path d="M42 14 L96 30 L42 46Z" fill="#FBBF24" opacity="0.35" />
        <Circle cx="40" cy="10" r="5" fill="#FCD34D" />
        <Path d="M28 96 L52 96 L46 82 L34 82Z" fill="#B45309" />
      </G>
    );
  }
  if (art === 'kalash') {
    return (
      <G>
        <Path d="M40 52 Q30 78 44 96 L76 96 Q90 78 80 52Z" fill="#B45309" />
        <Path d="M40 52 Q55 62 80 52 L80 60 Q55 70 40 60Z" fill="#F59E0B" opacity="0.8" />
        <Ellipse cx="60" cy="50" rx="24" ry="7" fill="#D97706" />
        <Circle cx="60" cy="36" r="11" fill="#78350F" />
        <Path d="M46 44 Q30 30 34 14 Q52 22 52 40Z" fill="#166534" />
        <Path d="M74 44 Q90 30 86 14 Q68 22 68 40Z" fill="#15803D" />
        <Path d="M60 26 Q66 14 60 4 Q54 14 60 26Z" fill="#FBBF24" />
      </G>
    );
  }
  if (art === 'tiranga') {
    return (
      <G>
        <Line x1="22" y1="6" x2="22" y2="104" stroke="#FDE68A" strokeWidth="3.5" strokeLinecap="round" />
        <Circle cx="22" cy="6" r="4" fill="#FCD34D" />
        <Path d="M24 14 Q54 6 86 14 L86 31 Q54 23 24 31Z" fill="#EA8A1E" />
        <Path d="M24 31 Q54 23 86 31 L86 48 Q54 40 24 48Z" fill="#F8FAFC" />
        <Path d="M24 48 Q54 40 86 48 L86 65 Q54 57 24 65Z" fill="#16A34A" />
        <Circle cx="55" cy="40" r="6.5" fill="none" stroke="#1D4ED8" strokeWidth="1.6" />
        {[0, 45, 90, 135].map((deg) => (
          <Line
            key={deg}
            x1="49"
            y1="40"
            x2="61"
            y2="40"
            stroke="#1D4ED8"
            strokeWidth="0.9"
            transform={`rotate(${deg} 55 40)`}
          />
        ))}
      </G>
    );
  }
  if (art === 'eclipse') {
    return (
      <G>
        <Defs>
          <SvgGrad id="art-corona" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#FDE68A" stopOpacity="0.95" />
            <Stop offset="100%" stopColor="#F59E0B" stopOpacity="0.25" />
          </SvgGrad>
        </Defs>
        <Circle cx="64" cy="54" r="34" fill="url(#art-corona)" />
        <Circle cx="72" cy="48" r="30" fill="#0B1220" />
        <Circle cx="30" cy="90" r="2.4" fill="#E2E8F0" opacity="0.8" />
        <Circle cx="104" cy="24" r="1.8" fill="#E2E8F0" opacity="0.7" />
      </G>
    );
  }
  // toran — mango-leaf garland, the fallback for anything unclassified
  return (
    <G>
      <Path d="M2 30 Q60 62 118 30" stroke="#FBBF24" strokeWidth="3" fill="none" />
      {[16, 38, 60, 82, 104].map((x, i) => (
        <Path
          key={x}
          d={`M${x} ${44 + (i % 2) * 6} Q${x - 9} ${64 + (i % 2) * 8} ${x} ${80 + (i % 2) * 6} Q${x + 9} ${64 + (i % 2) * 8} ${x} ${44 + (i % 2) * 6}Z`}
          fill={i % 2 ? '#166534' : '#15803D'}
        />
      ))}
      <Circle cx="60" cy="98" r="7" fill="#EA580C" />
      <Circle cx="60" cy="98" r="3" fill="#FDE68A" />
    </G>
  );
}

/**
 * `style` positions the layer inside the card (absolute, so the card's height
 * never depends on it).
 */
export default function FestivalArt({ name, type, width = 132, height = 120, style }) {
  const { key } = festivalArt(name, type);
  return (
    <View style={[styles.wrap, style]} pointerEvents="none">
      <Svg width={width} height={height} viewBox="0 0 120 110" fill="none">
        <Scene art={key} />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute' },
});
