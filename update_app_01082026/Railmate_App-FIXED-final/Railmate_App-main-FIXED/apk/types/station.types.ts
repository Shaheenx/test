// types/station.types.ts
// Single source of truth for Station type — re-exports from database.types.
// latitude/longitude overridden as optional: search results and static
// station data don't always carry coordinates (see routeEngine.ts callers).
import type { Station as DBStation } from './database.types';

export type Station = Omit<DBStation, 'latitude' | 'longitude'> & {
  latitude?: number | null;
  longitude?: number | null;
};