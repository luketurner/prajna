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

export interface Session {
  id: number;
  startedAt: number;
  duration: number;
  status: "active" | "finished";
}

export const useSessions = () => {
  const db = SQLite.useSQLiteContext();
  return useQuery({
    queryKey: ["sessions"],
    queryFn: async (): Promise<Session[]> => {
      return await db.getAllSync<Session>(`select * from sessions`);
    },
  });
};

export const useSelectedGoal = (): Session | undefined => {
  const { data: sessions } = useSessions();
  const [{ selectedSession }] = useAppState();
  if (!selectedSession) return undefined;
  return sessions?.find((x) => x.id === selectedSession);
};

export const useUpdateSession = () => {
  const queryClient = useQueryClient();
  const db = SQLite.useSQLiteContext();
  return useCallback(
    async (id: Session["id"], data: Partial<Session>) => {
      await db.runAsync(
        `update sessions set ${updateForObject(data)} where id = $id`,
        {
          ...toParams(data),
          $id: id,
        },
      );
      queryClient.invalidateQueries({ queryKey: ["sessions", id] });
    },
    [db, queryClient],
  );
};

export const useCreateSession = () => {
  const queryClient = useQueryClient();
  const db = SQLite.useSQLiteContext();
  return useCallback(
    async (data: Partial<Session>) => {
      await db.runAsync(
        `insert into sessions (${createKeysForObject(data)}) values ${createValuesForObject(data)}`,
        toParams(data),
      );
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
    },
    [db, queryClient],
  );
};

export const useDeleteSession = () => {
  const queryClient = useQueryClient();
  const db = SQLite.useSQLiteContext();
  return useCallback(
    async (id: Session["id"]) => {
      await db.runAsync(`delete from sessions where id = $id`, {
        $id: id,
      });
      queryClient.invalidateQueries({ queryKey: ["sessions", id] });
    },
    [db, queryClient],
  );
};
