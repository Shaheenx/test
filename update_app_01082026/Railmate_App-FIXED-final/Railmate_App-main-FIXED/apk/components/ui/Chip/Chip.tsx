import React from 'react';
import { View, Pressable, StyleSheet, Text } from 'react-native';

interface ChipProps {
  label: string;
  onPress?: () => void;
  isActive?: boolean;
  isBengali?: boolean;
  icon?: React.ReactNode;
  style?: object;
}

export const Chip: React.FC<ChipProps> = ({ label, onPress, isActive = false, isBengali = false, icon, style }) => {
  const chipStyle = [styles.chip, isActive ? styles.active : styles.inactive, style];
  const textColor = isActive ? '#080D17' : '#8FA3C0';
  const fontFamily = isBengali ? 'NotoSansBengali_400Regular' : 'Inter_500Medium';

  const content = (
    <View style={styles.inner}>
      {icon}
      <Text style={[styles.label, { color: textColor, fontFamily }]}>{label}</Text>
    </View>
  );

  if (onPress) {
    return <Pressable onPress={onPress} style={({ pressed }) => [chipStyle, pressed && { opacity: 0.8 }]}>{content}</Pressable>;
  }
  return <View style={chipStyle}>{content}</View>;
};

const styles = StyleSheet.create({
  chip:     { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  active:   { backgroundColor: '#00A859', borderColor: '#00A859' },
  inactive: { backgroundColor: '#1A2840', borderColor: '#2A3F57' },
  inner:    { flexDirection: 'row', alignItems: 'center', gap: 4 },
  label:    { fontSize: 12, letterSpacing: 0.2 },
});
