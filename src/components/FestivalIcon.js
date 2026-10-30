import React, { useEffect, useMemo } from 'react';
import { Animated, Easing, Image, StyleSheet } from 'react-native';

/**
 * A tyohaar icon for a calendar cell.
 *
 * Lala Ram Swarup's almanac prints a small deity illustration against every
 * festival; here the same job is done by a glyph on an Animated loop, so the
 * grid stays animated like a tiny GIF while remaining fully offline. The two
 * national portraits (Gandhi, Ambedkar) are the only bundled images — every
 * other day stays a lightweight emoji glyph.
 *
 * Rules are matched in order, so keep the specific names above the generic
 * ones. Anything unmatched falls back to the festival's type colour family.
 */

// Real-face portraits for the two national leaders — rendered as small circular
// avatars instead of an emoji, so the actual person is recognisable.
const PORTRAIT_RULES = [
  [/गांधी जयंती/, require('../../assets/gandhi.gif'), 'glow'],
  [/अंबेडकर जयंती/, require('../../assets/ambedkar.gif'), 'glow'],
];

const RULES = [
  // national days first — they are fixed dates
  [/गणतंत्र दिवस/, '🇮🇳', 'sway'],
  [/स्वतंत्रता दिवस/, '🇮🇳', 'sway'],
  [/गांधी जयंती/, '🧘', 'sway'],
  [/अंबेडकर जयंती/, '📖', 'pulse'],

  // eclipses — the dimming loop is what sells them
  [/चंद्र ग्रहण/, '🌘', 'dim'],
  [/सूर्य ग्रहण/, '🌑', 'dim'],
  [/ग्रहण/, '🌗', 'dim'],

  // lamps and fire
  [/दिवाली|नरक चतुर्दशी|दीप/, '🪔', 'flicker'],
  [/होलिका/, '🔥', 'flicker'],
  [/होली/, '🎨', 'pulse'],

  // deity-specific days
  [/रथ यात्रा/, '🚩', 'sway'],
  [/गणेश|विनायक|संकष्ट/, '🐘', 'sway'],
  [/जन्माष्टमी|कृष्ण/, '🦚', 'sway'],
  [/राम नवमी/, '👑', 'pulse'],
  [/दशहरा/, '🏹', 'pulse'],
  [/हनुमान/, '💪', 'pulse'],
  [/परशुराम/, '🪓', 'sway'],
  [/दुर्गा|नवरात्रि|महा नवमी|गौरी/, '🦁', 'sway'],
  [/शिवरात्रि|सोमवार/, '🔱', 'pulse'],
  [/नाग/, '🐍', 'sway'],
  [/अनंत/, '🐍', 'pulse'],
  [/गोवर्धन/, '🐄', 'sway'],
  [/भाई दूज/, '🤝', 'pulse'],
  [/रक्षा बंधन/, '🧵', 'sway'],
  [/वट सावित्री/, '🌳', 'sway'],
  [/तीज/, '🌺', 'sway'],
  [/उपाकर्म/, '📜', 'sway'],
  [/ओणम/, '🌾', 'sway'],
  [/उगादी/, '🌅', 'glow'],
  [/अक्षय/, '💎', 'pulse'],
  [/धनतेरस/, '💰', 'pulse'],
  [/करवा चौथ/, '🌙', 'pulse'],
  [/वसंत पंचमी/, '🌸', 'sway'],
  [/गुरु पूर्णिमा/, '🙏', 'pulse'],
  [/पुष्य/, '⭐', 'glow'],
  [/शनिवार/, '🪐', 'pulse'],
  [/कार्तिकै/, '💧', 'sway'],

  // moon days, then sun days
  [/छठ.*नहाय/, '🌊', 'sway'],
  [/छठ/, '🌞', 'glow'],
  [/पूर्णिमा/, '🌕', 'glow'],
  [/अमावस्या/, '🌑', 'pulse'],
  [/संक्रांति|दक्षिणायन|उत्तरायण/, '☀️', 'glow'],

  // vratas
  [/एकादशी/, '📿', 'pulse'],
  [/प्रदोष/, '🕉️', 'pulse'],
];

// Fallback per festival type, for a name the list above has not seen yet
const BY_TYPE = {
  national: ['🎖️', 'glow'],
  eclipse: ['🌗', 'dim'],
  major: ['🎉', 'pulse'],
  sankranti: ['☀️', 'glow'],
  ekadashi: ['📿', 'pulse'],
  vaishnava_ekadashi: ['📿', 'pulse'],
  smarta_ekadashi: ['📿', 'pulse'],
  pradosha: ['🕉️', 'pulse'],
  minor: ['🌸', 'pulse'],
};

// One ping-pong loop per icon; the ranges below say what it moves.
const LOOPS = {
  flicker: { duration: 300, opacity: [0.55, 1], scale: [0.9, 1.18] },
  sway: { duration: 780, rotate: [-20, 20] },
  pulse: { duration: 1300, opacity: [0.4, 1] },
  glow: { duration: 1700, opacity: [0.6, 1], scale: [1, 1.22] },
  dim: { duration: 2200, opacity: [0.18, 1] },
};

/**
 * The picture a festival name maps to. Exported so the hero banner's
 * watermark paints the same deity/object the cell icon does, from one table.
 */
export function getFestivalIcon(name, type) {
  // A rule is [test, glyph, motion]; a type fallback is [glyph, motion]
  const hit = RULES.find(([on]) => on.test(name || ''));
  if (hit) return { glyph: hit[1], motion: hit[2] };
  const [glyph, motion] = BY_TYPE[type] || BY_TYPE.minor;
  return { glyph, motion };
}

// One shared loop value per icon. The seed desyncs the cells a little so a
// month of icons does not blink in unison.
function useLoopValue(motion, seed) {
  const value = useMemo(() => new Animated.Value(0), []);

  useEffect(() => {
    const loop = LOOPS[motion] || LOOPS.pulse;
    const duration = loop.duration + (seed % 4) * 110;
    const run = (toValue) =>
      Animated.timing(value, {
        toValue,
        duration,
        easing: Easing.inOut(Easing.sin),
        // JS driver, not the native driver: Android only clips an animated
        // transform to the cell's overflow:'hidden' when the transform is
        // applied through JS, so the zooming icon stays inside its box.
        useNativeDriver: false,
      });
    const anim = Animated.loop(Animated.sequence([run(1), run(0)]));
    anim.start();
    return () => anim.stop();
  }, [motion, seed, value]);

  return value;
}

const loopOpacity = (loop, at) => (loop.opacity ? at(loop.opacity) : 1);
const loopTransform = (loop, at) =>
  [
    loop.scale && { scale: at(loop.scale) },
    loop.rotate && {
      rotate: at([`${loop.rotate[0]}deg`, `${loop.rotate[1]}deg`]),
    },
  ].filter(Boolean);

// Emoji glyph icon — the default for most festivals. Pass `size` to scale the
// glyph up (used by the cell's background watermark); without it the compact
// 15dp cell-icon size from styles applies.
function AnimatedGlyph({ glyph, motion, seed, size }) {
  const value = useLoopValue(motion, seed);
  const loop = LOOPS[motion] || LOOPS.pulse;
  const at = (range) =>
    value.interpolate({ inputRange: [0, 1], outputRange: range });

  return (
    <Animated.Text
      allowFontScaling={false}
      style={[
        styles.glyph,
        size && { fontSize: size, lineHeight: Math.round(size * 1.2) },
        {
          opacity: loopOpacity(loop, at),
          transform: loopTransform(loop, at),
        },
      ]}
    >
      {glyph}
    </Animated.Text>
  );
}

// Portrait image icon — the same motion loop as the emoji glyphs, so the
// Gandhi/Ambedkar faces breathe gently like every other festival icon. `size`
// scales the circular avatar for the background watermark.
function AnimatedPortrait({ source, motion, seed, size }) {
  const value = useLoopValue(motion, seed);
  const loop = LOOPS[motion] || LOOPS.pulse;
  const at = (range) =>
    value.interpolate({ inputRange: [0, 1], outputRange: range });
  const dim = size || 18;

  return (
    <Animated.View
      style={{
        opacity: loopOpacity(loop, at),
        transform: loopTransform(loop, at),
      }}
    >
      <Image
        source={source}
        style={[styles.portrait, { width: dim, height: dim, borderRadius: dim / 2 }]}
        resizeMode="cover"
      />
    </Animated.View>
  );
}

export default function FestivalIcon({ name, type, seed = 0, size }) {
  const portrait = PORTRAIT_RULES.find(([on]) => on.test(name || ''));
  if (portrait) {
    const [, source, motion] = portrait;
    return <AnimatedPortrait source={source} motion={motion} seed={seed} size={size} />;
  }

  const { glyph, motion } = getFestivalIcon(name, type);
  return <AnimatedGlyph glyph={glyph} motion={motion} seed={seed} size={size} />;
}

const styles = StyleSheet.create({
  glyph: {
    // 15 is the ceiling for a date + icon row inside a 43dp cell: the widest
    // emoji advance is 1.375em on web (20.6px) and 1em on Android, and the row
    // has 37dp left after the cell's border and padding.
    fontSize: 15,
    lineHeight: 18,
    textAlign: 'center',
  },
  portrait: {
    // A touch larger than the glyph so a face is readable at cell size, and
    // cropped to a circle like a profile avatar.
    width: 18,
    height: 18,
    borderRadius: 9,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
});
