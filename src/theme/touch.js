/**
 * Shared touch feedback so every tappable control feels consistent on mobile.
 * TouchableOpacity already dims via activeOpacity; Pressable needs an explicit
 * pressed style, and small icon-only buttons need a larger HitRect.
 */

export const PRESS_OPACITY = 0.85;

// 8px extra on each side keeps small icon buttons comfortably tappable
export const HIT_SLOP = { top: 8, bottom: 8, left: 8, right: 8 };

/**
 * Pressable `style` function: applies the base style and dims while pressed.
 * Accepts a style object or an array (e.g. [styles.btn, disabled && styles.off]).
 */
export const pressableStyle = (base, opacity = PRESS_OPACITY) => ({ pressed }) => [
  ...(Array.isArray(base) ? base : [base]),
  pressed && { opacity },
];
