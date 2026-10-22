import React from 'react';
import { Text, Platform, View } from 'react-native';
import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';

export default function GradientText({ text, style, colors = ['#FBBF24', '#F97316', '#EA580C'], ...props }) {
  if (Platform.OS === 'web') {
    return (
      <Text
        {...props}
        style={[
          style,
          {
            backgroundImage: `linear-gradient(90deg, ${colors.join(', ')})`,
            WebkitBackgroundImage: `linear-gradient(90deg, ${colors.join(', ')})`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            color: 'transparent',
            display: 'inline-block',
          },
        ]}
      >
        {text}
      </Text>
    );
  }

  return (
    <MaskedView
      maskElement={
        <Text {...props} style={[style, { backgroundColor: 'transparent' }]}>
          {text}
        </Text>
      }
    >
      <LinearGradient
        colors={colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <Text {...props} style={[style, { opacity: 0 }]}>
          {text}
        </Text>
      </LinearGradient>
    </MaskedView>
  );
}
