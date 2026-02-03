import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRepositories } from "@/data/database-provider";
import { queryKeys } from "@/data/query-keys";
import type {
  SessionWithTags,
  CreateSessionInput,
  UpdateSessionInput,
} from "@/specs/001-meditation-app/contracts/repository-interfaces";

export function useSessions() {
  const { sessionRepository } = useRepositories();

  return useQuery({
    queryKey: queryKeys.sessions.all,
    queryFn: () => sessionRepository.getAll(),
  });
}

export function useSession(id: number) {
  const { sessionRepository } = useRepositories();

  return useQuery({
    queryKey: queryKeys.sessions.byId(id),
    queryFn: () => sessionRepository.getById(id),
    enabled: id > 0,
  });
}

export function useCreateSession() {
  const { sessionRepository } = useRepositories();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateSessionInput) => sessionRepository.create(input),
    onSuccess: () => {
      // Invalidate sessions list, stats, and goals (sessions affect goal progress)
      queryClient.invalidateQueries({ queryKey: queryKeys.sessions.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.sessions.stats });
      queryClient.invalidateQueries({ queryKey: queryKeys.sessions.tagBreakdown });
      queryClient.invalidateQueries({ queryKey: queryKeys.goals.all });
    },
  });
}

export function useUpdateSession() {
  const { sessionRepository } = useRepositories();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateSessionInput) => sessionRepository.update(input),
    onSuccess: (_, variables) => {
      // Invalidate specific session, list, stats, and goals
      queryClient.invalidateQueries({ queryKey: queryKeys.sessions.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.sessions.byId(variables.id),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.sessions.stats });
      queryClient.invalidateQueries({ queryKey: queryKeys.sessions.tagBreakdown });
      queryClient.invalidateQueries({ queryKey: queryKeys.goals.all });
    },
  });
}

export function useDeleteSession() {
  const { sessionRepository } = useRepositories();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => sessionRepository.delete(id),
    onSuccess: (_, id) => {
      // Invalidate sessions list, stats, and goals
      queryClient.invalidateQueries({ queryKey: queryKeys.sessions.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.sessions.byId(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.sessions.stats });
      queryClient.invalidateQueries({ queryKey: queryKeys.sessions.tagBreakdown });
      queryClient.invalidateQueries({ queryKey: queryKeys.goals.all });
    },
  });
}
