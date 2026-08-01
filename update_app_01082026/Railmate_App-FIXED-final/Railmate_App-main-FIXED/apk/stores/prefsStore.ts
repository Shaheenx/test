import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type DistanceUnit = 'km' | 'mi';

export interface JourneyPrefs {
  showAlternativeRoutes: boolean;
  delayAlerts: boolean;
  crowdingUpdates: boolean;
  platformChangeAlerts: boolean;
}

export interface DefaultLocation {
  stationId: number;
  name_en: string;
  name_bn: string;
  division: string | null;
}

interface PrefsStore {
  language: 'bn' | 'en';
  theme: 'dark' | 'light' | 'system';
  hasFinishedOnboarding: boolean;
  distanceUnit: DistanceUnit;
  journeyPrefs: JourneyPrefs;
  // null until the user explicitly picks one via Settings > Default Location.
  defaultLocation: DefaultLocation | null;
  setLanguage: (lang: 'bn' | 'en') => void;
  setTheme: (theme: 'dark' | 'light' | 'system') => void;
  finishOnboarding: () => void;
  setDistanceUnit: (unit: DistanceUnit) => void;
  setJourneyPref: (key: keyof JourneyPrefs, value: boolean) => void;
  setDefaultLocation: (location: DefaultLocation | null) => void;
}

export const usePrefsStore = create<PrefsStore>()(
  persist(
    (set) => ({
      language: 'bn',
      theme: 'dark',
      hasFinishedOnboarding: false,
      distanceUnit: 'km',
      journeyPrefs: {
        showAlternativeRoutes: true,
        delayAlerts: true,
        crowdingUpdates: true,
        // Matches the approved Settings reference (Platform Change Alerts
        // shown off by default) — flagged in delivery notes as an assumed
        // default pending product confirmation.
        platformChangeAlerts: false,
      },
      defaultLocation: null,
      setLanguage: (language) => set({ language }),
      setTheme: (theme) => set({ theme }),
      finishOnboarding: () => set({ hasFinishedOnboarding: true }),
      setDistanceUnit: (distanceUnit) => set({ distanceUnit }),
      setJourneyPref: (key, value) =>
        set((state) => ({ journeyPrefs: { ...state.journeyPrefs, [key]: value } })),
      setDefaultLocation: (defaultLocation) => set({ defaultLocation }),
    }),
    {
      name: 'railmate-prefs',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
