import React from 'react';
import { Text, TextProps } from 'react-native';
import { useThemeColors, ThemeColors } from '../../hooks/useThemeColors';

export type AppTextVariant =
  | 'displayXl' | 'displayLg' | 'displayMd'
  | 'h1' | 'h2' | 'h3' | 'h4'
  | 'bodyLg' | 'body' | 'bodySm'
  | 'labelLg' | 'label' | 'labelSm'
  | 'caption' | 'overline'
  | 'mono' | 'time'
  | 'bengali' | 'bengaliSm';

interface AppTextProps extends TextProps {
  variant?: AppTextVariant;
  color?: string;
  align?: 'left' | 'center' | 'right';
  isBengali?: boolean;
  children: React.ReactNode;
}

/**
 * AppText - Unified typography component for RailMate Bangladesh
 * Handles all text rendering with proper Bengali support
 */
export const AppText: React.FC<AppTextProps> = ({
  variant = 'body',
  color,
  align = 'left',
  isBengali = false,
  style,
  children,
  ...props
}) => {
  const colors = useThemeColors();
  const specs = getVariantSpecs(variant, isBengali, colors);
  const textColor = color || specs.color;
  const textAlign = align;

  return (
    <Text
      style={[
        {
          fontFamily: specs.fontFamily,
          fontSize: specs.fontSize,
          lineHeight: specs.lineHeight,
          color: textColor,
          textAlign,
        },
        specs.letterSpacing ? { letterSpacing: specs.letterSpacing } : null,
        specs.textTransform ? { textTransform: specs.textTransform } : null,
        style,
      ]}
      {...props}
    >
      {children}
    </Text>
  );
};

type VariantSpec = {
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  color: string;
  letterSpacing?: number;
  textTransform?: 'uppercase' | 'none';
};

function getVariantSpecs(variant: AppTextVariant, isBengali: boolean, colors: ThemeColors): VariantSpec {
  const dark = colors;

  // Bengali variants
  if (variant === 'bengali') {
    return {
      fontFamily: 'NotoSansBengali_400Regular',
      fontSize: 14,
      lineHeight: 24,
      color: dark['text-primary'],
    };
  }
  if (variant === 'bengaliSm') {
    return {
      fontFamily: 'NotoSansBengali_400Regular',
      fontSize: 13,
      lineHeight: 22,
      color: dark['text-secondary'],
    };
  }

  const variantMap = getVariantMap(colors);

  // If isBengali flag is set, use Bengali font for text variants
  if (isBengali) {
    const bengaliFamily = ['displayXl', 'displayLg', 'displayMd', 'h1', 'h2', 'h3', 'h4'].includes(variant)
      ? 'NotoSansBengali_600SemiBold'
      : 'NotoSansBengali_400Regular';
    const baseSpec = variantMap[variant];
    return { ...baseSpec, fontFamily: bengaliFamily };
  }

  return variantMap[variant];
}

const getVariantMap = (colors: ThemeColors): Record<Exclude<AppTextVariant, 'bengali' | 'bengaliSm'>, VariantSpec> => ({
  displayXl: {
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    fontSize: 40,
    lineHeight: 46,
    color: colors['text-primary'],
    letterSpacing: -0.8,
  },
  displayLg: {
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    fontSize: 32,
    lineHeight: 38,
    color: colors['text-primary'],
    letterSpacing: -0.32,
  },
  displayMd: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 28,
    lineHeight: 34,
    color: colors['text-primary'],
    letterSpacing: -0.28,
  },
  h1: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 24,
    lineHeight: 31,
    color: colors['text-primary'],
  },
  h2: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 20,
    lineHeight: 27,
    color: colors['text-primary'],
  },
  h3: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 18,
    lineHeight: 25,
    color: colors['text-primary'],
  },
  h4: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    lineHeight: 22,
    color: colors['text-primary'],
  },
  bodyLg: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    lineHeight: 26,
    color: colors['text-primary'],
  },
  body: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    lineHeight: 22,
    color: colors['text-primary'],
  },
  bodySm: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    lineHeight: 20,
    color: colors['text-primary'],
  },
  labelLg: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    lineHeight: 20,
    color: colors['text-primary'],
    letterSpacing: 0.14,
  },
  label: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    lineHeight: 17,
    color: colors['text-primary'],
    letterSpacing: 0.24,
  },
  labelSm: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
    lineHeight: 15,
    color: colors['text-primary'],
    letterSpacing: 0.33,
  },
  caption: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    lineHeight: 18,
    color: colors['text-secondary'],
  },
  overline: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 10,
    lineHeight: 14,
    color: colors['text-secondary'],
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  mono: {
    fontFamily: 'JetBrainsMono_400Regular',
    fontSize: 13,
    lineHeight: 20,
    color: colors['text-primary'],
  },
  time: {
    fontFamily: 'JetBrainsMono_500Medium',
    fontSize: 14,
    lineHeight: 20,
    color: colors['text-primary'],
  },
});
