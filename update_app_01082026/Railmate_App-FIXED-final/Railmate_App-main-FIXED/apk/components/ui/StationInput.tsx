import React, { useMemo } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { MapPin, X } from 'phosphor-react-native';
import { AppText } from './AppText';
import { Radius } from '../../constants/radius';
import { useThemeColors, ThemeColors } from '../../hooks/useThemeColors';

interface Station {
  name_en: string;
  name_bn: string;
  subtitle?: string;
}

interface StationInputProps {
  type: 'from' | 'to';
  station: Station | null;
  onPress: () => void;
  onClear?: () => void;
}

/**
 * StationInput - From/To station selector for search screens
 * NOT a text input — pressable row that opens station picker
 */
export const StationInput: React.FC<StationInputProps> = ({
  type,
  station,
  onPress,
  onClear,
}) => {
  const colors = useThemeColors();
  const C = colors;
  const styles = useMemo(() => createStyles(colors), [colors]);
  const iconColor = C.primary;
  const placeholderText = type === 'from'
    ? 'Select departure station'
    : 'Select destination station';

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        pressed && styles.pressed,
      ]}
    >
      {/* Icon */}
      <View style={styles.iconContainer}>
        <MapPin size={20} color={iconColor} weight="fill" />
      </View>

      {/* Station info */}
      <View style={styles.content}>
        {station ? (
          <>
            <AppText variant="h4" color={C['text-primary']}>
              {station.name_en}
            </AppText>
            <AppText variant="bengaliSm" color={C['text-secondary']}>
              {station.name_bn}
            </AppText>
            {station.subtitle && (
              <AppText variant="caption" color={C.primary} numberOfLines={1}>
                {station.subtitle}
              </AppText>
            )}
          </>
        ) : (
          <AppText variant="body" color={C['text-tertiary']}>
            {placeholderText}
          </AppText>
        )}
      </View>

      {/* Clear button */}
      {station && onClear && (
        <Pressable
          onPress={(e) => {
            e.stopPropagation();
            onClear();
          }}
          style={({ pressed }) => [
            styles.clearButton,
            pressed && styles.clearPressed,
          ]}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <X size={16} color={C['text-secondary']} weight="bold" />
        </Pressable>
      )}
    </Pressable>
  );
};

const createStyles = (C: ThemeColors) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 72,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: C['bg-card'],
    borderRadius: Radius['radius-md'],
    borderWidth: 1.5,
    borderColor: C.border,
  },
  pressed: {
    backgroundColor: C['bg-elevated'],
    borderColor: C['border-focus'],
  },
  iconContainer: {
    marginRight: 12,
  },
  content: {
    flex: 1,
    gap: 2,
  },
  clearButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: C['bg-elevated'],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: C.border,
  },
  clearPressed: {
    opacity: 0.6,
  },
});
