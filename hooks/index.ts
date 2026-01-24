import { useQuery } from "@tanstack/react-query";
import * as SQLite from "expo-sqlite";
import { createContext, useContext } from "react";
import { ImmerHook } from "use-immer";

export interface Goal {
  id: number;
  name: string;
  year: string;
  target: number;
  current: number;
}

export const useGoals = () => {
  const db = SQLite.useSQLiteContext();
  return useQuery({
    queryKey: ["goals"],
    queryFn: async (): Promise<Goal[]> => {
      return await db.getAllSync<Goal>(`select * from goals`);
    },
  });
};

export interface AppState {}

export const defaultState: AppState = {};

export const AppStateContext = createContext<ImmerHook<AppState>>([
  defaultState,
  () => {},
]);

export const useAppState = () => {
  return useContext(AppStateContext);
};
