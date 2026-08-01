// components/features/ReportCard/ReportCardSkeleton.tsx
//
// Shimmer skeleton shown while the community feed is loading.
// Uses Animated to create a pulsing opacity effect.

import React, { useEffect, useState } from 'react';
import { Animated, View } from 'react-native';

function SkeletonBlock({ className }: { className: string }) {
  const [opacity] = useState(() => new Animated.Value(0.4));

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.4,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={{ opacity }}
      className={`bg-bg-elevated rounded-md ${className}`}
    />
  );
}

export default function ReportCardSkeleton() {
  return (
    <View className="flex-row bg-bg-card rounded-xl overflow-hidden mb-3 border border-border">
      {/* Accent bar */}
      <View className="w-[3px] bg-bg-elevated" />

      <View className="flex-1 px-3 py-3 gap-3">
        {/* Top row */}
        <View className="flex-row items-center gap-2">
          <SkeletonBlock className="w-10 h-5 rounded-full" />
          <SkeletonBlock className="flex-1 h-5" />
        </View>

        {/* Middle */}
        <View className="flex-row items-start gap-2">
          <SkeletonBlock className="w-4 h-4 rounded-full mt-0.5" />
          <View className="flex-1 gap-1.5">
            <SkeletonBlock className="w-full h-4" />
            <SkeletonBlock className="w-2/3 h-3" />
          </View>
        </View>

        {/* Bottom row */}
        <View className="flex-row items-center gap-2">
          <SkeletonBlock className="w-6 h-6 rounded-full" />
          <SkeletonBlock className="w-24 h-3" />
          <View className="flex-1" />
          <SkeletonBlock className="w-14 h-6 rounded-full" />
          <SkeletonBlock className="w-14 h-6 rounded-full" />
        </View>
      </View>
    </View>
  );
}
