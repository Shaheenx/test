// lib/mapKit.ts
//
// Defensive wrapper around react-native-maps.
//
// Root cause this file exists to fix: `react-native-maps` ships a native
// module. It is only present in a build that (a) has the dependency
// installed and (b) was compiled by EAS *after* that dependency was added.
// Expo Go can never load it — there is no build step involved. A static
// `import MapView from 'react-native-maps'` at the top of a screen file
// crashes the ENTIRE app on any client that predates the native rebuild,
// not just the map screen. That's a worse failure mode than a placeholder.
//
// This module resolves the native package lazily via `require` inside a
// try/catch and exposes `isMapAvailable` so screens can branch on it. Once
// `npx expo install react-native-maps` has been run and a new EAS dev/
// production build has been installed, `isMapAvailable` flips to `true`
// with no other code changes required anywhere that imports from here.

import type * as ReactNativeMapsNS from 'react-native-maps';

type MapViewT = typeof ReactNativeMapsNS.default;
type MarkerT = typeof ReactNativeMapsNS.Marker;
type PolylineT = typeof ReactNativeMapsNS.Polyline;
type ProviderT = ReactNativeMapsNS.Provider;

let MapView: MapViewT | null = null;
let Marker: MarkerT | null = null;
let Polyline: PolylineT | null = null;
let PROVIDER_GOOGLE: ProviderT;
let isMapAvailable = false;

try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const maps = require('react-native-maps');
  MapView = maps.default;
  Marker = maps.Marker;
  Polyline = maps.Polyline;
  PROVIDER_GOOGLE = maps.PROVIDER_GOOGLE;
  isMapAvailable = !!MapView;
} catch {
  // Package not installed, or native module not linked into this binary.
  isMapAvailable = false;
}

export { MapView, Marker, Polyline, PROVIDER_GOOGLE, isMapAvailable };

/**
 * RailMate "Night Train" map style — built from the Part 03 §3.2 dark-mode
 * token set, not an arbitrary palette. Google Maps JSON styling only
 * accepts literal hex, so these are the design tokens' resolved values:
 *   geometry        -> --color-bg-base     (#080D17)
 *   water           -> --color-bg-elevated (#0F1929)
 *   roads           -> --color-border-strong (#2A3F57)
 *   labels          -> --color-text-secondary (#8FA3C0)
 *   label stroke    -> --color-bg-base     (#080D17)
 * POIs and transit labels are suppressed — a route map's job is to show
 * the rail line and stops, not restaurants and bus stops.
 */
export const NIGHT_TRAIN_MAP_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#080D17' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#080D17' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#8FA3C0' }] },
  { featureType: 'administrative', elementType: 'geometry', stylers: [{ color: '#1E2E42' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#2A3F57' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#4E6480' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0F1929' }] },
] as const;
