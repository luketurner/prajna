import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRepositories } from "@/data/database-provider";
import { queryKeys } from "@/data/query-keys";
import type {
  CreateGoalInput,
  UpdateGoalInput,
} from "@/specs/001-meditation-app/contracts/repository-interfaces";

export function useGoals() {
  const { goalRepository } = useRepositories();

  return useQuery({
    queryKey: queryKeys.goals.all,
    queryFn: () => goalRepository.getAll(),
  });
}

export function useGoal(id: number) {
  const { goalRepository } = useRepositories();

  return useQuery({
    queryKey: queryKeys.goals.byId(id),
    queryFn: () => goalRepository.getById(id),
    enabled: id > 0,
  });
}

export function useCreateGoal() {
  const { goalRepository } = useRepositories();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateGoalInput) => goalRepository.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.goals.all });
    },
  });
}

export function useUpdateGoal() {
  const { goalRepository } = useRepositories();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateGoalInput) => goalRepository.update(input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.goals.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.goals.byId(variables.id),
      });
    },
  });
}

export function useDeleteGoal() {
  const { goalRepository } = useRepositories();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => goalRepository.delete(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.goals.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.goals.byId(id) });
    },
  });
}
