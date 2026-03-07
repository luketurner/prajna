import { useQuery } from "@tanstack/react-query";
import { useRepositories } from "@/data/database-provider";
import { queryKeys } from "@/data/query-keys";

export function useSessionStats() {
  const { sessionRepository } = useRepositories();

  return useQuery({
    queryKey: queryKeys.sessions.stats,
    queryFn: () => sessionRepository.getStats(),
  });
}
