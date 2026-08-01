import React, { useMemo } from 'react';
import { Pressable, ActivityIndicator, View, StyleSheet, Text } from 'react-native';
import { ButtonProps } from './Button.types';
import { useThemeColors, ThemeColors } from '../../../hooks/useThemeColors';

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  label,
  icon: Icon,
  iconPosition = 'left',
  loading: isLoading = false,
  fullWidth,
  isBengali = false,
  disabled,
  onPress,
  style,
  ...rest
}) => {
  const colors = useThemeColors();
  const C = colors;
  const s = useMemo(() => createS(colors), [colors]);
  const isDisabled = disabled || isLoading;
  const fontFamily = isBengali ? 'NotoSansBengali_600SemiBold' : 'Inter_600SemiBold';
  
  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return { bg: '#00A859', txtColor: '#FFFFFF', bdr: {} };
      case 'secondary':
        return { bg: 'transparent', txtColor: '#00A859', bdr: { borderWidth: 1.5, borderColor: '#00A859' } };
      case 'danger':
        return { bg: C.danger, txtColor: '#FFFFFF', bdr: {} };
      case 'ghost':
      default:
        return { bg: 'transparent', txtColor: '#8FA3C0', bdr: {} };
    }
  };
  const { bg, txtColor, bdr } = getVariantStyles();
  const height   = size === 'lg' ? 56 : size === 'sm' ? 38 : 52;
  const px       = size === 'lg' ? 32 : size === 'sm' ? 16 : 24;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        s.base,
        { backgroundColor: bg, height, paddingHorizontal: px, ...bdr },
        fullWidth && { width: '100%' },
        isDisabled && s.disabled,
        pressed && s.pressed,
        style,
      ]}
      {...rest}
    >
      {isLoading ? (
        <ActivityIndicator color={txtColor} />
      ) : (
        <View style={s.row}>
          {Icon && iconPosition === 'left'  && <Icon size={20} color={txtColor} style={{ marginRight: 8 }} />}
          <Text style={[s.label, { color: txtColor, fontFamily }]}>{label}</Text>
          {Icon && iconPosition === 'right' && <Icon size={20} color={txtColor} style={{ marginLeft: 8 }} />}
        </View>
      )}
    </Pressable>
  );
};

const createS = (C: ThemeColors) => StyleSheet.create({
  base:    { borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  row:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  label:   { fontSize: 15, letterSpacing: 0.1 },
  disabled:{ opacity: 0.4 },
  pressed: { opacity: 0.82, transform: [{ scale: 0.97 }] },
});
