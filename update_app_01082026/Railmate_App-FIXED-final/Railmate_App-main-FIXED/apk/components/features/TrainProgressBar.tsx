import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import type { LiveTrainPosition } from '../../types/liveTracking.types';
import { useThemeColors, ThemeColors } from '../../hooks/useThemeColors';

interface TrainProgressBarProps {
  progress: number; // 0–100
  status: LiveTrainPosition['live_status'];
}

function statusColor(status: LiveTrainPosition['live_status']): string {
  switch (status) {
    case 'ON_TIME':   return C.primary;
    case 'DELAYED':   return C.danger;
    case 'ARRIVED':   return C['border-strong'];
    case 'SCHEDULED':
    default:          return C['text-tertiary'];
  }
}

export function TrainProgressBar({ progress, status }: TrainProgressBarProps) {
  const colors = useThemeColors();
  const C = colors;
  const s = useMemo(() => createS(colors), [colors]);
  const fill = statusColor(status);
  const clampedProgress = Math.max(0, Math.min(100, progress));

  return (
    <View style={s.track}>
      <View style={[s.fill, { width: `${clampedProgress}%` as any, backgroundColor: fill }]} />
      {clampedProgress > 0 && clampedProgress < 100 && (
        <View
          style={[
            s.dot,
            {
              left: `${clampedProgress}%` as any,
              backgroundColor: fill,
              transform: [{ translateX: -5 }],
            },
          ]}
        />
      )}
    </View>
  );
}

const createS = (C: ThemeColors) => StyleSheet.create({
  track: {
    width: '100%',
    height: 4,
    borderRadius: 2,
    backgroundColor: C['bg-overlay'],
    overflow: 'visible',
    marginTop: 8,
    position: 'relative',
  },
  fill: {
    height: 4,
    borderRadius: 2,
  },
  dot: {
    position: 'absolute',
    top: -3,
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});
