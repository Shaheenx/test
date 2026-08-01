import React from 'react';
import { Text, TextProps } from 'react-native';
import { Typography as TypographyTokens } from '../../../constants/typography';

export type TypographyVariant =
  | 'display-xl' | 'display-lg'
  | 'h1' | 'h2' | 'h3' | 'h4'
  | 'body-lg' | 'body' | 'body-sm'
  | 'label-lg' | 'label' | 'caption'
  | 'time' | 'mono';

interface TypographyProps extends TextProps {
  variant?: TypographyVariant;
  className?: string;
  isBengali?: boolean;
}

const BENGALI_HEADING = ['display-xl', 'display-lg', 'h1', 'h2', 'h3', 'h4'];
const BENGALI_SMALL   = ['body-sm', 'label', 'caption', 'mono', 'time'];

export const Typography: React.FC<TypographyProps> = ({
  variant = 'body',
  className = '',
  isBengali = false,
  style,
  children,
  ...props
}) => {
  const base = TypographyTokens[variant] ?? TypographyTokens['body'];

  let fontFamily = base.fontFamily;
  let fontSize   = (base as any).fontSize   ?? 14;
  let lineHeight = (base as any).lineHeight ?? 22;

  if (isBengali) {
    fontFamily = BENGALI_HEADING.includes(variant)
      ? 'NotoSansBengali_600SemiBold'
      : 'NotoSansBengali_400Regular';
    if (BENGALI_SMALL.includes(variant)) {
      fontSize   = 14;
      lineHeight = 26;
    }
  }

  // Default color is text-primary; className can override via NativeWind
  return (
    <Text
      className={className}
      style={[
        { fontFamily, fontSize, lineHeight, color: '#F0F4FF' },
        (base as any).letterSpacing ? { letterSpacing: (base as any).letterSpacing } : null,
        style,
      ]}
      {...props}
    >
      {children}
    </Text>
  );
};
