import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';

interface AvatarProps {
  uri?: string | null;
  name?: string;
  size?: number;
  badge?: string; // emoji or color dot
}

// TASK 1 FIX — see delivery notes for the full investigation.
//
// Root cause: this component rendered the photo with React Native's core
// <Image> (from 'react-native'). Core Image on Android is backed by a
// native image pipeline that keys its disk/memory cache more aggressively
// than iOS's, and in practice it can keep serving a previously-decoded
// bitmap for a URL it has seen before — even across a full JS reload —
// regardless of the ?t=timestamp cache-busting query param already being
// generated correctly in profile-edit.tsx. The URL logic was already
// correct (verified: the value passed into `uri` below is the fresh,
// cache-busted `avatar_url` coming straight from the upload's own upsert
// response); the render layer was the actual break point.
//
// Fix: use expo-image's <Image>, and explicitly disable its cache for this
// component. expo-image's cache is more predictable and configurable than
// core Image's, and cachePolicy="none" guarantees every render re-fetches
// from the network — the right tradeoff for a small avatar that the user
// can change at any time, where "always show what's actually on the
// server" matters more than saving a network request.
export const Avatar: React.FC<AvatarProps> = ({ uri, name, size = 40, badge }) => {
  // Track WHICH uri last failed to load, rather than a plain boolean. This
  // means a new uri (e.g. after a re-upload) automatically gets a fresh
  // attempt without needing an effect to "reset" a flag — derived during
  // render, which is the correct pattern here (an effect that calls setState
  // synchronously just to mirror a prop causes an avoidable extra render).
  const [erroredUri, setErroredUri] = useState<string | null>(null);
  const imgError = erroredUri === uri;
  const initials = name
    ? name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
    : '?';
  const bg = stringToColor(name ?? '?');

  return (
    <View style={{ width: size, height: size }}>
      {uri && !imgError ? (
        <Image
          source={{ uri }}
          style={[s.img, { width: size, height: size, borderRadius: size / 2 }]}
          cachePolicy="none"
          onError={() => setErroredUri(uri ?? null)}
        />
      ) : (
        <View style={[s.placeholder, { width: size, height: size, borderRadius: size / 2, backgroundColor: bg }]}>
          <Text style={[s.initials, { fontSize: size * 0.36 }]}>{initials}</Text>
        </View>
      )}
      {badge && (
        <View style={[s.badge, { width: size * 0.32, height: size * 0.32, borderRadius: size * 0.16, bottom: -2, right: -2 }]}>
          <Text style={{ fontSize: size * 0.2 }}>{badge}</Text>
        </View>
      )}
    </View>
  );
};

function stringToColor(s: string): string {
  const colors = ['#1A5C3A','#1A3A5C','#5C1A3A','#3A1A5C','#5C3A1A','#1A4A5C','#3A5C1A'];
  let hash = 0;
  for (let i = 0; i < s.length; i++) hash = s.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

const s = StyleSheet.create({
  img:         { },
  placeholder: { alignItems: 'center', justifyContent: 'center' },
  initials:    { fontFamily: 'Inter_600SemiBold', color: '#fff' },
  badge:       { position: 'absolute', backgroundColor: '#0F1929', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#1E2E42' },
});
