// eslint.config.js — ESLint 9 flat config
//
// Base: eslint-config-expo (TypeScript, React, React Hooks, import resolution
// for Expo Router / React Native 0.76, matches Part 06.1 tech stack).
//
// Project-specific additions enforce conventions from the Master Reference:
//  - no-console: blocked in production code (Part 17.3 release checklist —
//    "No console.log in production code")
//  - no hardcoded UI strings is NOT enforceable by ESLint alone (Part 03.9
//    i18n requirement) — that's caught in code review / the i18n key-sync
//    check, not here.

const expoConfig = require('eslint-config-expo/flat');
const tsPlugin = require('@typescript-eslint/eslint-plugin');

module.exports = [
  ...expoConfig,

  {
    ignores: [
      'node_modules/**',
      '.expo/**',
      'dist/**',
      'web-build/**',
      'android/**',
      'ios/**',
      'supabase/migrations/**',
      'supabase/functions/**/*.d.ts',
    ],
  },

  {
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    rules: {
      // Part 17.3: "No console.log in production code" — allow warn/error
      // for legitimate error-path logging, block plain console.log.
      'no-console': ['warn', { allow: ['warn', 'error'] }],

      // Catches stale imports/exports left behind during refactors
      // (e.g. the toggleTheme / avatarUrl mismatches fixed in the
      // Community tab rewrite) before they reach typecheck.
      'no-unused-vars': 'off', // superseded by the TS-aware rule below
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],

      // React Hooks correctness — critical for the FSM/async patterns
      // used throughout the report submission and auth flows.
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',

      // Allow JSX in .tsx without an explicit React import (new JSX transform).
      'react/react-in-jsx-scope': 'off',
    },
  },

  {
    // Test files and scripts get a relaxed console rule.
    files: ['scripts/**/*.ts', '**/*.test.ts', '**/*.test.tsx'],
    rules: {
      'no-console': 'off',
    },
  },
];
