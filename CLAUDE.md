# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

**Note**: This project uses `AGENTS.md` files for detailed guidance.

## Primary Reference

Please see `AGENTS.md` in this same directory for the main project documentation and guidance.

## Active Technologies
- TypeScript 5.9 (strict mode) + Expo SDK 54, React Native 0.81.4, React 19.1, expo-router ~6.0.8, @tanstack/react-query ^5.90.20, date-fns ^4.1.0, @expo/vector-icons ^15.0.2 (001-meditation-app)
- expo-sqlite ~16.0.10 (local SQLite database: `prajna.db`); expo-sqlite/kv-store for timer crash recovery (001-meditation-app)
- expo-sqlite ~16.0.10 (local SQLite database: `prajna.db`) — no schema changes needed (002-goal-progress-tracking)
- TypeScript 5.9 (strict mode) + Expo SDK 54, React Native 0.81.4, React 19.1, expo-router ~6.0.8, expo-notifications (new), expo-audio (new) (003-meditation-countdown-notify)
- expo-sqlite ~16.0.10 (prajna.db — no schema changes); expo-sqlite/kv-store (extended persisted timer state) (003-meditation-countdown-notify)

## Recent Changes
- 001-meditation-app: Added TypeScript 5.9 (strict mode) + Expo SDK 54, React Native 0.81.4, React 19.1, expo-router ~6.0.8, @tanstack/react-query ^5.90.20, date-fns ^4.1.0, @expo/vector-icons ^15.0.2
