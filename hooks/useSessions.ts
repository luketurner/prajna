import { useRepositories } from "@/data/database-provider";
import { queryKeys } from "@/data/query-keys";
import type {
  CreateSessionInput,
  UpdateSessionInput,
} from "@/data/repository-interfaces";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

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
      queryClient.invalidateQueries({ queryKey: queryKeys.sessions.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.sessions.stats });
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
      queryClient.invalidateQueries({ queryKey: queryKeys.sessions.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.sessions.byId(variables.id),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.sessions.stats });
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
      queryClient.invalidateQueries({ queryKey: queryKeys.sessions.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.sessions.byId(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.sessions.stats });
      queryClient.invalidateQueries({ queryKey: queryKeys.goals.all });
    },
  });
}
