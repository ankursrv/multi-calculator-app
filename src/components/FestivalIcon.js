import React, { useEffect, useMemo } from 'react';
import { Animated, Easing, StyleSheet } from 'react-native';

/**
 * A tyohaar icon for a calendar cell.
 *
 * Lala Ram Swarup's almanac prints a small deity illustration against every
 * festival; here the same job is done by a glyph on an Animated loop, so the
 * grid stays animated like a tiny GIF while remaining fully offline and adding
 * no image assets to the bundle.
 *
 * Rules are matched in order, so keep the specific names above the generic
 * ones. Anything unmatched falls back to the festival's type colour family.
 */
const RULES = [
  // eclipses first — the dimming loop is what sells them
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

// Fallback for a festival name this list has not seen yet
const BY_TYPE = {
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

export default function FestivalIcon({ name, type, seed = 0 }) {
  // A rule is [test, glyph, motion]; a type fallback is [glyph, motion]
  const hit = RULES.find(([on]) => on.test(name || ''));
  const [glyph, motion] = hit ? [hit[1], hit[2]] : BY_TYPE[type] || BY_TYPE.minor;
  const value = useMemo(() => new Animated.Value(0), []);

  useEffect(() => {
    const loop = LOOPS[motion] || LOOPS.pulse;
    // Desync the cells a little so a month of icons does not blink in unison
    const duration = loop.duration + (seed % 4) * 110;
    const run = (toValue) =>
      Animated.timing(value, {
        toValue,
        duration,
        easing: Easing.inOut(Easing.sin),
        useNativeDriver: true,
      });
    const anim = Animated.loop(Animated.sequence([run(1), run(0)]));
    anim.start();
    return () => anim.stop();
  }, [motion, seed, value]);

  const loop = LOOPS[motion] || LOOPS.pulse;
  const at = (range) =>
    value.interpolate({ inputRange: [0, 1], outputRange: range });

  return (
    <Animated.Text
      allowFontScaling={false}
      style={[
        styles.glyph,
        {
          opacity: loop.opacity ? at(loop.opacity) : 1,
          transform: [
            loop.scale && { scale: at(loop.scale) },
            loop.rotate && {
              rotate: at([`${loop.rotate[0]}deg`, `${loop.rotate[1]}deg`]),
            },
          ].filter(Boolean),
        },
      ]}
    >
      {glyph}
    </Animated.Text>
  );
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
});
