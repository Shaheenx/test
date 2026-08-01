import React from 'react';
import { View, Pressable, StyleSheet, ViewProps } from 'react-native';

interface CardProps extends ViewProps {
  onPress?: () => void;
  accentColor?: string;
}

export const Card: React.FC<CardProps> = ({ children, onPress, accentColor, style, ...props }) => {
  const content = (
    <>
      {accentColor && (
        <View style={[styles.accent, { backgroundColor: accentColor }]} />
      )}
      {children}
    </>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.card, accentColor && styles.cardWithAccent, pressed && styles.pressed, style]}
        {...props}
      >
        {content}
      </Pressable>
    );
  }

  return (
    <View style={[styles.card, accentColor && styles.cardWithAccent, style]} {...props}>
      {content}
    </View>
  );
};

const styles = StyleSheet.create({
  card:           { backgroundColor: '#162035', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#1E2E42', overflow: 'hidden', position: 'relative' },
  cardWithAccent: { paddingLeft: 20 },
  accent:         { position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, borderTopLeftRadius: 14, borderBottomLeftRadius: 14 },
  pressed:        { opacity: 0.9, transform: [{ scale: 0.985 }] },
});
