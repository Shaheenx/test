# Crash fix — this package

## What broke, exactly

The light/dark mode codemod from earlier moved `const C = colors` inside
each component (correct — `C` needs `useThemeColors()`, which is a hook
and can only be called inside a component). But 6 files also had a
*second*, separate module-scope constant — `LEVELS`, `DISTRIBUTION`,
`SCORE_COLORS`, `FILTERS`, `SEAT_STYLE`, `QUICK_ACTIONS` — declared
*outside* the component, that also referenced `C`. The codemod never
checked for this second pattern. Since these constants evaluate the
moment the file is imported, this crashed Expo Router's route table
construction itself, not just the individual screens — that's why the
crash cascaded everywhere regardless of which login path was used.

Found by writing a proper AST scanner (`@babel/parser` + `@babel/traverse`,
not text-matching) that walks every file and flags any reference to `C`
with no enclosing function — i.e., genuinely at module scope. Confirmed
exactly 6 files affected, no hidden extras.

## Fixed in this package (4 of 6)

- `app/badges-reputation.tsx` — `LEVELS` → `getLevels(colors)`, called via `useMemo` inside the component
- `app/delay-analytics.tsx` — `DISTRIBUTION` → `getDistribution(colors)`, same pattern
- `app/leaderboard.tsx` — `SCORE_COLORS` → `getScoreColors(colors)`, same pattern
- `app/notifications.tsx` — `FILTERS` → `getFilters(colors)`, same pattern

Each one: verified with the real parser (zero syntax errors, 158 files
checked) and re-run through the AST module-scope scanner to confirm the
specific `C` reference is gone.

## Not fixed — you're taking these two

- `app/(tabs)/index.tsx` — `QUICK_ACTIONS` (lines ~320-326), same pattern
- `app/seat-fare.tsx` — `SEAT_STYLE` (lines ~54-57), same pattern

Same fix shape as the four above:
```ts
// before (module scope, breaks):
const QUICK_ACTIONS = [
  { ..., icon: <Icon color={C.primary} ... />, ... },
];

// after:
const getQuickActions = (C: ThemeColors) => [
  { ..., icon: <Icon color={C.primary} ... />, ... },
];
// then inside the component, alongside the other useMemo calls:
const QUICK_ACTIONS = useMemo(() => getQuickActions(colors), [colors]);
```

`ThemeColors` is already imported in both files (from the theme hook
import added by the codemod) — no new import needed.

## Still open from your longer message, not touched this round

- Email auth currently uses Supabase magic-link (`check your email for
  the sign-in link`), not a code-entry screen matching phone's OTP flow
- `seat-fare.tsx` seat *availability* — needs to link out to
  eticket.railway.gov.bd rather than show anything in-app
  (fares themselves can stay sourced from railway.gov.bd public data)
- About/version screen and a full sweep of "Coming Soon" placeholders
  under Settings

Didn't touch any of these — the crash was the only thing that mattered
this round.
