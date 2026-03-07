/**
 * TanStack Query key factory for the Meditation Timer app.
 * Provides type-safe query keys for cache management.
 */
export const queryKeys = {
  sessions: {
    all: ["sessions"] as const,
    byId: (id: number) => ["sessions", id] as const,
    stats: ["sessions", "stats"] as const,
  },
  goals: {
    all: ["goals"] as const,
    byId: (id: number) => ["goals", id] as const,
  },
} as const;
