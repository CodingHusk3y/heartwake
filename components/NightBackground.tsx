import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Dimensions, Easing, StyleSheet, View } from 'react-native';

const { width, height } = Dimensions.get('window');

function randomInt(min: number, max: number) { return Math.floor(Math.random() * (max - min + 1)) + min; }

export type NightBackgroundProps = {
  color?: string; // base background color
  starCount?: number;
};

export default function NightBackground({ color = '#0b1026', starCount = 60 }: NightBackgroundProps) {
  const stars = useMemo(() => Array.from({ length: starCount }).map((_, i) => ({
    key: `s-${i}`,
    x: Math.random() * width,
    y: Math.random() * height,
    size: Math.random() * 2 + 1,
    delay: randomInt(0, 4000),
    duration: randomInt(1500, 3500),
  })), [starCount]);

  const opacities = useRef(stars.map(() => new Animated.Value(Math.random()))).current;

  useEffect(() => {
    opacities.forEach((val, idx) => {
      const { delay, duration } = stars[idx];
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(val, { toValue: 0.2, duration, delay, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
          Animated.timing(val, { toValue: 1, duration, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        ]),
      );
      loop.start();
    });
    // no cleanup necessary; unmounted automatically stops animations
  }, [opacities, stars]);

  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: color }]} pointerEvents="none">
      {stars.map((s, i) => (
        <Animated.View key={s.key} style={{ position: 'absolute', left: s.x, top: s.y, width: s.size, height: s.size, borderRadius: s.size/2, backgroundColor: 'white', opacity: opacities[i] }} />
      ))}
    </View>
  );
}
