import type {
  IGoalRepository,
  ISessionRepository,
} from "@/data/repository-interfaces";
import { useSQLiteContext } from "expo-sqlite";
import { createContext, useContext, useMemo, type ReactNode } from "react";
import { GoalRepository } from "./repositories/goal-repository";
import { SessionRepository } from "./repositories/session-repository";

interface RepositoryContextValue {
  sessionRepository: ISessionRepository;
  goalRepository: IGoalRepository;
}

const RepositoryContext = createContext<RepositoryContextValue | null>(null);

interface RepositoryProviderProps {
  children: ReactNode;
}

export function RepositoryProvider({ children }: RepositoryProviderProps) {
  const db = useSQLiteContext();

  const repositories = useMemo(
    () => ({
      sessionRepository: new SessionRepository(db),
      goalRepository: new GoalRepository(db),
    }),
    [db],
  );

  return (
    <RepositoryContext.Provider value={repositories}>
      {children}
    </RepositoryContext.Provider>
  );
}

export function useRepositories(): RepositoryContextValue {
  const context = useContext(RepositoryContext);
  if (!context) {
    throw new Error("useRepositories must be used within RepositoryProvider");
  }
  return context;
}
