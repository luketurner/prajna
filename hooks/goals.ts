import {
  createKeysForObject,
  createValuesForObject,
  toParams,
  updateForObject,
} from "@/util/sql";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import * as SQLite from "expo-sqlite";
import { useCallback } from "react";
import { useAppState } from "./state";

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

export const useSelectedGoal = (): Goal | undefined => {
  const { data: goals } = useGoals();
  const [{ selectedGoal }] = useAppState();
  if (!selectedGoal) return undefined;
  return goals?.find((g) => g.id === selectedGoal);
};

export const useUpdateGoal = () => {
  const queryClient = useQueryClient();
  const db = SQLite.useSQLiteContext();
  return useCallback(
    async (id: Goal["id"], data: Partial<Goal>) => {
      await db.runAsync(
        `update goals set ${updateForObject(data)} where id = $id`,
        {
          ...toParams(data),
          $id: id,
        },
      );
      queryClient.invalidateQueries({ queryKey: ["goals", id] });
    },
    [db, queryClient],
  );
};

export const useCreateGoal = () => {
  const queryClient = useQueryClient();
  const db = SQLite.useSQLiteContext();
  return useCallback(
    async (data: Partial<Goal>) => {
      await db.runAsync(
        `insert into goals (${createKeysForObject(data)}) values ${createValuesForObject(data)}`,
        toParams(data),
      );
      queryClient.invalidateQueries({ queryKey: ["goals"] });
    },
    [db, queryClient],
  );
};

export const useDeleteGoal = () => {
  const queryClient = useQueryClient();
  const db = SQLite.useSQLiteContext();
  return useCallback(
    async (id: Goal["id"]) => {
      await db.runAsync(`delete from goals where id = $id`, {
        $id: id,
      });
      queryClient.invalidateQueries({ queryKey: ["goals", id] });
    },
    [db, queryClient],
  );
};
