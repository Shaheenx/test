# RailMate Bangladesh

> Your smart companion for every train journey across Bangladesh.

---

## About

RailMate is a real-time train tracking and community update app built for Bangladeshi travelers. It helps passengers find trains, check live delay reports, get platform alerts, and connect with fellow travelers — all in one place.

This is the **first mobile app built by [Navicore](https://navicore.io)**, developed in collaboration with **Anthropic Claude**.

**Built by Najmul Hasan** — CEO, Navicore

---

## Features

- **Train Search** — Find trains between any two stations with fares and schedules
- **Live Updates** — Real-time delay, crowding, and platform change reports from the community
- **Community Reports** — Submit and verify train status reports, earn trust badges
- **Smart Alerts** — Get notified before departure and when delays are reported
- **Bilingual** — Full support for English and Bengali (বাংলা)
- **Offline Fallback** — Core station data available without internet

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React Native + Expo (SDK 56) |
| Navigation | Expo Router (file-based) |
| Styling | NativeWind + custom theme |
| State | Zustand + AsyncStorage |
| Backend | Supabase (PostgreSQL + Auth + Storage + Realtime) |
| Icons | Phosphor React Native |
| Build | EAS Build (Expo Application Services) |
| AI Partner | Anthropic Claude |

---

## Getting Started

```bash
# Install dependencies
npm install

# Start the dev server
npx expo start

# Build for Android (preview)
npx eas build --platform android --profile preview
```

### Environment

Copy `.env.example` to `.env` and fill in your Supabase credentials:

```
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

---

## Package

`com.railmate.bd` — Android

---

## Credits

Designed and built by **Najmul Hasan**, CEO of **Navicore**.

This is the first app shipped by Navicore — built entirely with **Anthropic Claude** as the AI development partner.

---

*RailMate Bangladesh — Travel Smart. Travel RailMate.*
