import React from 'react';
import { View } from 'react-native';
import { Typography } from '../Typography/Typography';

export type BadgeVariant = 'success' | 'danger' | 'info' | 'neutral' | 'accent';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  className?: string;
  isBengali?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'neutral',
  className = '',
  isBengali = false,
}) => {
  const variantClasses = {
    success: 'bg-success-subtle border-success/20',
    danger: 'bg-danger-subtle border-danger/20',
    info: 'bg-bg-overlay border-info/20',
    neutral: 'bg-bg-card border-border',
    accent: 'bg-accent-subtle border-accent/20',
  };

  const textClasses = {
    success: 'text-success',
    danger: 'text-danger',
    info: 'text-info',
    neutral: 'text-text-secondary',
    accent: 'text-accent',
  };

  return (
    <View className={`px-2 py-0.5 rounded-xs border-[0.5px] items-center justify-center ${variantClasses[variant]} ${className}`}>
      <Typography variant="label" className={`${textClasses[variant]} text-[10px] uppercase`} isBengali={isBengali}>
        {label}
      </Typography>
    </View>
  );
};
