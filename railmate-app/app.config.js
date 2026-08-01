// app.config.js
// Converted from app.json — a static JSON file can't read process.env, and
// the Android Google Maps key needs to come from an env var, not be
// committed to the repo. Everything below is byte-for-byte the same as the
// current app.json except the added android.config.googleMaps.apiKey line.
//
// Local dev / local prebuild: reads GOOGLE_MAPS_API_KEY_ANDROID from .env
// (Expo CLI loads .env into process.env automatically — no EXPO_PUBLIC_
// prefix needed here since this value is only read at build/prebuild time
// by react-native-maps' native module, never by client JS at runtime).
//
// EAS Cloud builds: set the same var via `eas env:create` (see notes below)
// so it's injected into process.env during the build without ever touching
// git.

module.exports = {
  expo: {
    name: 'RailMate',
    slug: 'railmate',
    owner: 'nusraats-team',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/images/icon.png',
    scheme: 'railmatebd',
    userInterfaceStyle: 'automatic',
    ios: {
      bundleIdentifier: 'com.railmate.bd',
      supportsTablet: false,
      infoPlist: {
        NSLocationWhenInUseUsageDescription: 'RailMate needs your location to show nearby stations.',
        NSLocationAlwaysAndWhenInUseUsageDescription: 'RailMate needs your location to show nearby stations.',
        NSPhotoLibraryUsageDescription: 'RailMate needs photo access to let you upload report photos.',
        NSCameraUsageDescription: 'RailMate needs camera access to let you take report photos.',
      },
      // No googleMapsApiKey here on purpose — iOS falls back to Apple Maps
      // (no key required) until/unless Google Maps parity on iOS is a real
      // requirement. iOS isn't launched yet anyway (Part 10.5, gated on
      // 5K+ Android MAU). Adding one later means a SEPARATE key from the
      // Android one — Google issues them per-platform.
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/images/adaptive-icon.png',
        backgroundColor: '#00A859',
      },
      package: 'com.railmate.bd',
      permissions: [
        'android.permission.ACCESS_FINE_LOCATION',
        'android.permission.ACCESS_COARSE_LOCATION',
        'android.permission.CAMERA',
      ],
      config: {
        googleMaps: {
          apiKey: process.env.GOOGLE_MAPS_API_KEY_ANDROID,
        },
      },
    },
    web: {
      favicon: './assets/images/favicon.png',
      bundler: 'metro',
      output: 'single',
      name: 'RailMate',
      shortName: 'RailMate',
      backgroundColor: '#080D17',
    },
    plugins: [
      'expo-router',
      'expo-font',
      '@react-native-community/datetimepicker',
      'expo-dev-client',
      [
        'expo-location',
        {
          locationAlwaysAndWhenInUsePermission: 'RailMate needs your location to show nearby stations.',
          locationWhenInUsePermission: 'RailMate needs your location to show nearby stations.',
        },
      ],
      [
        'expo-image-picker',
        {
          photosPermission: 'RailMate needs photo access to let you upload report photos.',
          cameraPermission: 'RailMate needs camera access to let you take report photos.',
        },
      ],
      [
        'expo-splash-screen',
        {
          backgroundColor: '#080D17',
          ios: {
            backgroundColor: '#080D17',
            image: './assets/images/splash_new.png',
            resizeMode: 'cover',
          },
          android: {
            backgroundColor: '#080D17',
            image: './assets/images/adaptive-icon.png',
            resizeMode: 'contain',
          },
        },
      ],
      'expo-localization',
      [
        '@sentry/react-native',
        {
          organization: process.env.SENTRY_ORG,
          project: process.env.SENTRY_PROJECT,
          // SENTRY_AUTH_TOKEN is read directly from the environment by
          // Sentry's build tooling — do not add it here.
        },
      ],
      // react-native-maps ships no app.plugin.js (verified against the
      // installed package) — no plugins[] entry needed for it. The
      // android.config.googleMaps.apiKey block above is the only wiring
      // required.
    ],
    extra: {
      router: {
        origin: false,
      },
      eas: {
        projectId: '0700b039-5dad-4171-9387-748a4e673807',
      },
    },
    experiments: {
      typedRoutes: true,
    },
  },
};
