import React, { useMemo, useState } from 'react';
import { TextInput, TextInputProps, View, StyleSheet } from 'react-native';
import { Typography } from '../Typography/Typography';
import { useThemeColors, ThemeColors } from '../../../hooks/useThemeColors';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: object;
  isBengali?: boolean;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  containerStyle,
  isBengali = false,
  onFocus,
  onBlur,
  style,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const colors = useThemeColors();
  const s = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={[s.container, containerStyle]}>
      {label && (
        <Typography variant="label" isBengali={isBengali} style={{ color: colors['text-tertiary'], marginBottom: 6, marginLeft: 2 }}>
          {label}
        </Typography>
      )}
      <View style={[
        s.inputBox,
        isFocused && s.inputFocused,
        !!error && s.inputError,
      ]}>
        <TextInput
          style={[s.input, style]}
          placeholderTextColor={colors['text-tertiary']}
          selectionColor={colors['border-focus']}
          onFocus={(e) => { setIsFocused(true); onFocus?.(e); }}
          onBlur={(e) => { setIsFocused(false); onBlur?.(e); }}
          {...props}
        />
      </View>
      {!!error && (
        <Typography variant="caption" style={{ color: colors.danger, marginTop: 4, marginLeft: 2 }} isBengali={isBengali}>
          {error}
        </Typography>
      )}
    </View>
  );
};

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container:    { width: '100%' },
  inputBox:     { height: 48, paddingHorizontal: 16, backgroundColor: colors['bg-card'], borderWidth: 1.5, borderColor: colors.border, borderRadius: 10, flexDirection: 'row', alignItems: 'center' },
  inputFocused: { borderColor: colors['border-focus'] },
  inputError:   { borderColor: colors.danger },
  input:        { flex: 1, color: colors['text-primary'], fontFamily: 'Inter_400Regular', fontSize: 14 },
});
