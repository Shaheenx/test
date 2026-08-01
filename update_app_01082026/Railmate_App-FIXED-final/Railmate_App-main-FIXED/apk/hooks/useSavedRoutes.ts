// hooks/useSavedRoutes.ts
//
// Manages saved routes with dual-storage:
//   1. AsyncStorage — immediate local persistence (works offline, no auth needed)
//   2. Supabase — synced to user account when authenticated
//
// On sign-in, local routes are merged into the remote list so nothing is lost.
//
// Free vs. Pro tier enforcement lives in lib/featureGates.ts
// (LIMITS.savedRoutes = { free: 3, pro: Infinity }, checked via
// canPerformAction()) — that is the single source of truth for the cap.
// See saveRoute() below.

import 'react-native-get-random-values';
import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { nanoid } from 'nanoid';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../stores/authStore';
import { supabase } from '../lib/supabase';
import { canPerformAction } from '../lib/featureGates';
import { logger } from '../lib/logger';

const LOCAL_STORAGE_KEY = 'railmate_saved_routes';
// Defensive ceiling on the remote *fetch* only — this is NOT a plan limit.
// Free (3) vs. Pro (unlimited) is enforced in saveRoute() via
// lib/featureGates.ts, not here.
const REMOTE_FETCH_CAP = 100;

export interface SavedRoute {
  id: string;
  fromStation: { id: string; name_en: string; name_bn: string; code: string };
  toStation:   { id: string; name_en: string; name_bn: string; code: string };
  savedAt: string;
}

export const useSavedRoutes = () => {
  const [savedRoutes, setSavedRoutes] = useState<SavedRoute[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, isPremium } = useAuthStore();
  const router = useRouter();

  // ─── Load ────────────────────────────────────────────────────────────────────

  const loadRoutes = useCallback(async () => {
    setLoading(true);
    try {
      // Always load local first for instant render
      const raw = await AsyncStorage.getItem(LOCAL_STORAGE_KEY);
      const local: SavedRoute[] = raw ? JSON.parse(raw) : [];

      if (user?.id) {
        // Fetch remote routes
        const { data, error } = await supabase
          .from('saved_routes')
          .select('id, from_station_id, to_station_id, saved_at, from_station:stations!saved_routes_from_station_id_fkey(id, name_en, name_bn, code), to_station:stations!saved_routes_to_station_id_fkey(id, name_en, name_bn, code)')
          .eq('user_id', user.id)
          .order('saved_at', { ascending: false })
          .limit(REMOTE_FETCH_CAP);

        if (!error && data && data.length > 0) {
          const remote: SavedRoute[] = (data as any[]).map((row) => ({
            id: row.id,
            fromStation: row.from_station,
            toStation: row.to_station,
            savedAt: row.saved_at,
          }));
          setSavedRoutes(remote);
          // Persist remote list locally too (offline cache)
          await AsyncStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(remote));
          return;
        }

        // If Supabase has no routes but local does, push local routes to remote
        if (local.length > 0) {
          await Promise.allSettled(
            local.map((r) =>
              supabase.from('saved_routes').upsert({
                id: r.id,
                user_id: user.id,
                from_station_id: r.fromStation.id,
                to_station_id: r.toStation.id,
                saved_at: r.savedAt,
              }, { onConflict: 'id' })
            )
          );
        }
      }

      setSavedRoutes(local);
    } catch (err) {
      logger.error('loadRoutes error', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    // This is a standard fetch-on-mount pattern. The lint rule flags the
    // synchronous `setLoading(true)` call inside `loadRoutes`, but this is a
    // necessary and safe operation before an async data fetch.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadRoutes(); // Load initial data on mount
  }, [loadRoutes]);

  // ─── Save ─────────────────────────────────────────────────────────────────────

  const saveRoute = useCallback(
    async (
      fromStation: SavedRoute['fromStation'],
      toStation: SavedRoute['toStation'],
    ): Promise<boolean> => {
      try {
        const alreadySaved = savedRoutes.some(
          (r) =>
            r.fromStation.id === fromStation.id &&
            r.toStation.id === toStation.id
        );
        if (alreadySaved) return true;

        // BUG FIX: this previously hardcoded `MAX_ROUTES = 10` (comment:
        // "raised from 3"), which violated the monetization spec (free
        // tier = 3 saved routes, Pro = unlimited). Worse, once at the cap
        // it silently evicted the oldest saved route via
        // `.slice(0, MAX_ROUTES)` instead of ever telling the user — a
        // save would appear to "succeed" while quietly deleting a
        // different route. Free users hitting the real cap now get routed
        // to the Pro upgrade screen instead, matching the /coming-soon
        // pattern used elsewhere in the app (see app/settings.tsx,
        // app/route-map.tsx).
        if (!canPerformAction('savedRoutes', savedRoutes.length, isPremium)) {
          router.push('/coming-soon?feature=Pro+Upgrade' as any);
          return false;
        }

        const newRoute: SavedRoute = {
          id: nanoid(),
          fromStation,
          toStation,
          savedAt: new Date().toISOString(),
        };

        const updated = [newRoute, ...savedRoutes];
        setSavedRoutes(updated);
        await AsyncStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));

        if (user?.id) {
          const { error } = await supabase.from('saved_routes').insert({
            id: newRoute.id,
            user_id: user.id,
            from_station_id: fromStation.id,
            to_station_id: toStation.id,
            saved_at: newRoute.savedAt,
          });
          if (error) logger.warn('saveRoute remote error', { message: error.message });
        }

        return true;
      } catch (err) {
        logger.error('saveRoute error', err);
        return false;
      }
    },
    [savedRoutes, user, isPremium, router]
  );

  // ─── Delete ───────────────────────────────────────────────────────────────────

  const deleteRoute = useCallback(
    async (id: string): Promise<void> => {
      try {
        const updated = savedRoutes.filter((r) => r.id !== id);
        setSavedRoutes(updated);
        await AsyncStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));

        if (user?.id) {
          const { error } = await supabase
            .from('saved_routes')
            .delete()
            .match({ id, user_id: user.id });
          if (error) logger.warn('deleteRoute remote error', { message: error.message });
        }
      } catch (err) {
        logger.error('deleteRoute error', err);
      }
    },
    [savedRoutes, user]
  );

  const isRouteSaved = useCallback(
    (fromId: string, toId: string): boolean =>
      savedRoutes.some(
        (r) => r.fromStation.id === fromId && r.toStation.id === toId
      ),
    [savedRoutes]
  );

  return {
    savedRoutes,
    loading,
    saveRoute,
    deleteRoute,
    isRouteSaved,
    refresh: loadRoutes,
  };
};
