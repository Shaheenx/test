// lib/reputation.ts
//
// Shared trust-score level lookup, extracted so the Task 2 badge-preview
// modal (components/features/BadgePreviewModal) can show the same level
// as app/badges-reputation.tsx without duplicating the threshold logic
// in two places that could drift apart. Thresholds match the LEVELS
// array in app/badges-reputation.tsx exactly — if those ever change,
// update both.

import { Flag, ShieldCheck, Clock, Diamond, Lightning, Star, type IconProps } from 'phosphor-react-native';
import React from 'react';

export interface ReputationLevel {
  num: number;
  name: string;
  range: string;
  min: number;
}

export const REPUTATION_LEVELS: ReputationLevel[] = [
  { num: 1, name: 'Rookie Reporter', range: '0 - 99', min: 0 },
  { num: 2, name: 'Active Reporter', range: '100 - 299', min: 100 },
  { num: 3, name: 'Reliable Reporter', range: '300 - 599', min: 300 },
  { num: 4, name: 'Trusted Reporter', range: '600 - 999', min: 600 },
  { num: 5, name: 'Expert Reporter', range: '1000+', min: 1000 },
];

export function getReputationLevel(trustScore: number): ReputationLevel {
  let current = REPUTATION_LEVELS[0];
  for (const lvl of REPUTATION_LEVELS) {
    if (trustScore >= lvl.min) current = lvl;
  }
  return current;
}

export const BADGE_ICONS: Record<string, React.ComponentType<IconProps>> = {
  CONTRIBUTOR: Flag,
  VERIFIED: ShieldCheck,
  REPORTER: Star,
  ELITE_REPORTER: Diamond,
  TRUSTED_REPORTER: ShieldCheck,
  DELAY_MASTER: Clock,
  SPEED_REPORTER: Lightning,
};
