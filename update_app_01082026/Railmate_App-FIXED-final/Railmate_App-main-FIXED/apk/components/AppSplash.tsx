// components/AppSplash.tsx
import React from 'react';
import { View, Image, StyleSheet } from 'react-native';

export function AppSplash() {
  return (
    <View style={styles.container}>
      <Image
        source={require('../assets/images/splash_new.png')}
        style={styles.image}
        resizeMode="cover"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#080D17' },
  image: { flex: 1, width: '100%', height: '100%' },
});