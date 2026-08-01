// utils/trainClassLabel.ts
//
// Display labels for the real TrainClass enum (types/database.types.ts).
// Single source of truth so every screen showing a class chip (Search
// Trains' Class picker, Search Results' Available Classes chips, Train
// Detail's fare list) renders identical text.

import { TrainClass } from '../types/database.types';

const LABELS: Record<TrainClass, string> = {
  SHOVON:       'Shovon',
  SHOVON_CHAIR: 'Shovon Chair',
  SNIGDHA:      'Snigdha',
  AC_BERTH:     'AC Berth',
  AC_SEAT:      'AC Seat',
  FIRST_BERTH:  'First Berth',
  FIRST_SEAT:   'First Seat',
  AC_S_CHAIR:   'AC S Chair',
};

export function trainClassLabel(cls: TrainClass): string {
  return LABELS[cls] ?? cls;
}

export const ALL_TRAIN_CLASSES: TrainClass[] = [
  'SHOVON', 'SHOVON_CHAIR', 'SNIGDHA',
  'AC_SEAT', 'AC_BERTH', 'FIRST_SEAT', 'FIRST_BERTH', 'AC_S_CHAIR',
];
