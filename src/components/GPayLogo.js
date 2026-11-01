import React from 'react';
import Svg, { Path, G } from 'react-native-svg';

/**
 * Official Google Pay 4-color intertwined loops logo.
 * Renders sharply at any size via vector SVG.
 */
export default function GPayLogo({ size = 13, style }) {
  const width = Math.round(size * (280 / 240));
  return (
    <Svg
      width={width}
      height={size}
      viewBox="0 0 280 240"
      style={style}
      accessibilityLabel="Google Pay"
    >
      <G>
        {/* Google Red */}
        <Path
          fill="#EA4335"
          d="M148.8,145.3l69.9-121.1l38.1,22c24.6,14.2,33,45.6,18.8,70.2l-39.4,68.2 c-8.9,15.4-28.5,20.6-43.9,11.8l-35.3-20.4C146.3,169.7,142.6,156,148.8,145.3z"
        />
        {/* Google Yellow */}
        <Path
          fill="#FBBC04"
          d="M141.4,61.2L54.5,211.8l38.1,22c24.6,14.2,56,5.8,70.2-18.8l56.4-97.7 c8.9-15.4,3.6-35-11.8-43.9L172,53C161.3,46.8,147.6,50.5,141.4,61.2z"
        />
        {/* Google Green */}
        <Path
          fill="#34A853"
          d="M218.7,24.2L191.8,8.6c-30.7-17.7-70-7.2-87.8,23.5l-50,86.6 c-8.9,15.4-3.6,35,11.8,43.9l26.9,15.6c15.4,8.9,35,3.6,43.9-11.8L196.3,63l0,0c12.4-21.5,39.8-28.8,61.3-16.4"
        />
        {/* Google Blue */}
        <Path
          fill="#4285F4"
          d="M111.8,57.5L82.1,40.4c-13.3-7.6-30.2-3.1-37.8,10.1L8.5,112.1 c-17.6,30.3-7.1,69.1,23.3,86.7l22.6,13l27.5,15.8l11.9,6.9C72.7,220.3,66,192,78.9,169.7l9.2-15.9l33.8-58.4 C129.6,82,125,65.1,111.8,57.5z"
        />
      </G>
    </Svg>
  );
}

