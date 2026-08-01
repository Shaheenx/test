import React, { useMemo } from 'react';
import { View, StyleSheet, Image } from 'react-native';
import * as PhosphorIcons from 'phosphor-react-native';
import { AppText } from './AppText';
import { Button } from './Button/Button';
import { useThemeColors, ThemeColors } from '../../hooks/useThemeColors';

const EMPTY_IMAGES: Record<string, any> = {
  'empty-search':       require('../../assets/images/empty-search.png'),
  'empty-saved-routes': require('../../assets/images/empty-saved-routes.png'),
  'empty-reports':      require('../../assets/images/empty-reports.png'),
};

interface EmptyStateProps {
  iconName: keyof typeof PhosphorIcons;
  title: string;
  description: string;
  ctaLabel?: string;
  onCta?: () => void;
  imageKey?: keyof typeof EMPTY_IMAGES;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  iconName,
  title,
  description,
  ctaLabel,
  onCta,
  imageKey,
}) => {
  const colors = useThemeColors();
  const C = colors;
  const styles = useMemo(() => createStyles(colors), [colors]);
   
  const Icon = (PhosphorIcons as any)[iconName];
  const emptyImage = imageKey ? EMPTY_IMAGES[imageKey] : null;

  return (
    <View style={styles.container}>
      {emptyImage
        ? <Image source={emptyImage} style={styles.image} resizeMode="contain" />
        : Icon && <Icon size={48} color={C['text-tertiary']} weight="regular" />
      }

      <AppText variant="h3" align="center" style={styles.title}>
        {title}
      </AppText>

      <AppText
        variant="body"
        color={C['text-secondary']}
        align="center"
        style={styles.description}
      >
        {description}
      </AppText>

      {ctaLabel && onCta && (
        <Button
          variant="primary"
          size="md"
          label={ctaLabel}
          onPress={onCta}
        />
      )}
    </View>
  );
};

const createStyles = (C: ThemeColors) => StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
  },
  image: {
    width: 180,
    height: 180,
    marginBottom: 8,
    opacity: 0.9,
  },
  title: {
    marginTop: 16,
  },
  description: {
    marginTop: 8,
    marginBottom: 24,
  },
});
