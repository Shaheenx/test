import React, { memo } from 'react';
import {
  ImageBackground,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const HERO_IMAGE = require('../../assets/images/train-hero.webp');

interface TrainHeroProps {
  children?: React.ReactNode;
  height?: number;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
}

function TrainHeroComponent({
  children,
  height = 240,
  borderRadius = 24,
  style,
}: TrainHeroProps) {
  return (
    <View
      style={[
        styles.container,
        {
          height,
          borderRadius,
        },
        style,
      ]}
    >
      <ImageBackground
        source={HERO_IMAGE}
        resizeMode="cover"
        style={styles.image}
        imageStyle={{
          borderRadius,
        }}
      >
        <View style={styles.darkOverlay} />

        <LinearGradient
          colors={[
            'rgba(0,0,0,0)',
            'rgba(0,0,0,0.08)',
            'rgba(0,0,0,0.35)',
            'rgba(10,15,28,0.92)',
          ]}
          locations={[0, 0.45, 0.72, 1]}
          style={StyleSheet.absoluteFill}
        />

        <View style={styles.content}>
          {children}
        </View>
      </ImageBackground>
    </View>
  );
}

export const TrainHero = memo(TrainHeroComponent);

const styles = StyleSheet.create({
  container: {
    width: '100%',
    overflow: 'hidden',
  },
  image: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  darkOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(8,13,23,0.32)',
  },
  content: {
    flex: 1,
    justifyContent: 'flex-end',
  },
});

export default TrainHero;