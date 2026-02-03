import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRepositories } from "@/data/database-provider";
import { queryKeys } from "@/data/query-keys";
import type {
  CreateTagInput,
  UpdateTagInput,
} from "@/specs/001-meditation-app/contracts/repository-interfaces";

export function useTags() {
  const { tagRepository } = useRepositories();

  return useQuery({
    queryKey: queryKeys.tags.all,
    queryFn: () => tagRepository.getAll(),
  });
}

export function useTag(id: number) {
  const { tagRepository } = useRepositories();

  return useQuery({
    queryKey: queryKeys.tags.byId(id),
    queryFn: () => tagRepository.getById(id),
    enabled: id > 0,
  });
}

export function useCreateTag() {
  const { tagRepository } = useRepositories();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateTagInput) => tagRepository.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tags.all });
    },
  });
}

export function useUpdateTag() {
  const { tagRepository } = useRepositories();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateTagInput) => tagRepository.update(input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tags.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.tags.byId(variables.id),
      });
      // Also invalidate sessions since they display tag names
      queryClient.invalidateQueries({ queryKey: queryKeys.sessions.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.sessions.tagBreakdown });
    },
  });
}

export function useDeleteTag() {
  const { tagRepository } = useRepositories();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => tagRepository.delete(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tags.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.tags.byId(id) });
      // Invalidate sessions since cascade removes tag associations
      queryClient.invalidateQueries({ queryKey: queryKeys.sessions.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.sessions.tagBreakdown });
    },
  });
}
