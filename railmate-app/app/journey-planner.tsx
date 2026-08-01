// app/journey-planner.tsx
// Route wrapper for the multi-transfer Journey Planner.
// The component itself lives in lib/journey-planner/ alongside its
// route-computation engine and data — kept out of app/ since it's
// not a screen on its own until wrapped here.

export { default } from '../lib/journey-planner/JourneyPlanner';
