import React, { useMemo } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Clock, Check, Users } from 'phosphor-react-native';
import { AppText } from './AppText';
import { useThemeColors, ThemeColors } from '../../hooks/useThemeColors';

type StatusPillType = 'delay' | 'onTime' | 'warning' | 'halted' | 'crowding';

interface StatusPillProps {
  type: StatusPillType;
  label: string;
  style?: ViewStyle;
}

/**
 * StatusPill - Colored status indicator for trains
 * Used in train cards, live updates, etc.
 */
export const StatusPill: React.FC<StatusPillProps> = ({ type, label, style }) => {
  const colors = useThemeColors();
  const C = colors;
  const styles = useMemo(() => createStyles(colors), [colors]);
  const config = getStatusConfig(type);

  return (
    <View style={[styles.container, config.style, style]}>
      {config.Icon && (
        <config.Icon size={14} color={config.textColor} weight="bold" />
      )}
      <AppText variant="label" color={config.textColor}>
        {label}
      </AppText>
    </View>
  );
};

function getStatusConfig(type: StatusPillType) {
  const danger = C.danger;
  const success = C.success;
  const warning = C.accent;

  switch (type) {
    case 'delay':
      return {
        Icon: Clock,
        textColor: danger,
        style: {
          backgroundColor: C['danger-subtle'],
          borderColor: danger,
        },
      };
    case 'onTime':
      return {
        Icon: Check,
        textColor: success,
        style: {
          backgroundColor: C['success-subtle'],
          borderColor: success,
        },
      };
    case 'warning':
    case 'halted':
      return {
        Icon: Clock,
        textColor: warning,
        style: {
          backgroundColor: C['accent-subtle'],
          borderColor: warning,
        },
      };
    case 'crowding':
      return {
        Icon: Users,
        textColor: warning,
        style: {
          backgroundColor: C['accent-subtle'],
          borderColor: warning,
        },
      };
    default:
      return {
        Icon: null,
        textColor: C['text-secondary'],
        style: {
          backgroundColor: C['bg-overlay'],
          borderColor: C.border,
        },
      };
  }
}

const createStyles = (C: ThemeColors) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 26,
    paddingHorizontal: 10,
    borderRadius: 9999,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
});
