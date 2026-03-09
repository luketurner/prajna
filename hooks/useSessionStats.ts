import { useQuery } from "@tanstack/react-query";
import { useRepositories } from "@/data/database-provider";
import { queryKeys } from "@/data/query-keys";
import { useStatsSettings } from "@/hooks/useStatsSettings";

export function useSessionStats() {
  const { sessionRepository, goalRepository } = useRepositories();
  const { earliestDateSource } = useStatsSettings();

  return useQuery({
    queryKey: [
      ...queryKeys.sessions.stats,
      ...queryKeys.goals.all,
      earliestDateSource,
    ],
    queryFn: async () => {
      let earliestDate: string | undefined;
      if (earliestDateSource === "earliest_goal") {
        const goalDate = await goalRepository.getEarliestGoalDate();
        if (goalDate) {
          earliestDate = goalDate;
        }
      }

      return sessionRepository.getStats(earliestDate);
    },
  });
}
