import { CalendarGrid } from "@/components/CalendarGrid";
import { EmptyState } from "@/components/EmptyState";
import { SegmentedControl } from "@/components/SegmentedControl";
import { SessionCard } from "@/components/SessionCard";
import { Colors } from "@/constants/Colors";
import type { Session } from "@/data/repository-interfaces";
import { useSessions } from "@/hooks/useSessions";
import { format } from "date-fns";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";

const VIEW_OPTIONS: { value: "list" | "calendar"; label: string }[] = [
  { value: "list", label: "List" },
  { value: "calendar", label: "Calendar" },
];

export default function HistoryScreen() {
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const router = useRouter();

  const { data: sessions = [], isLoading } = useSessions();

  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const sessionDates = useMemo(
    () => new Set(sessions.map((s) => s.date)),
    [sessions],
  );

  const filteredSessions = useMemo(
    () => (selectedDate ? sessions.filter((s) => s.date === selectedDate) : []),
    [sessions, selectedDate],
  );

  const handleSessionPress = (sessionId: number) => {
    router.push(`/history/${sessionId}` as never);
  };

  const handleViewModeChange = (mode: "list" | "calendar") => {
    setViewMode(mode);
    if (mode === "list") {
      setSelectedDate(null);
    }
  };

  const handleMonthChange = (date: Date) => {
    setCurrentMonth(date);
    setSelectedDate(null);
  };

  const handleDatePress = (date: string) => {
    setSelectedDate((prev) => (prev === date ? null : date));
  };

  if (isLoading) {
    return (
      <View style={[styles.centered, {}]}>
        <ActivityIndicator size="large" color={colors.tint} />
      </View>
    );
  }

  if (sessions.length === 0) {
    return (
      <View style={[styles.container, {}]}>
        <EmptyState
          icon="self-improvement"
          title="No Sessions Yet"
          message="Start meditating to see your history here. Tap the timer to begin your first session."
        />
      </View>
    );
  }

  const renderSessionItem = ({ item }: { item: Session }) => (
    <SessionCard session={item} onPress={() => handleSessionPress(item.id)} />
  );

  const toggle = (
    <View style={styles.toggleContainer}>
      <SegmentedControl
        options={VIEW_OPTIONS}
        value={viewMode}
        onChange={handleViewModeChange}
        colors={colors}
      />
    </View>
  );

  if (viewMode === "list") {
    return (
      <View style={[styles.container, {}]}>
        <FlatList
          data={sessions}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderSessionItem}
          ListHeaderComponent={toggle}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      </View>
    );
  }

  const calendarHeader = (
    <>
      {toggle}
      <CalendarGrid
        currentMonth={currentMonth}
        sessionDates={sessionDates}
        selectedDate={selectedDate}
        onDatePress={handleDatePress}
        onMonthChange={handleMonthChange}
      />
      {selectedDate && filteredSessions.length > 0 && (
        <Text style={[styles.dateHeader, { color: colors.textSecondary }]}>
          {format(new Date(selectedDate + "T00:00:00"), "EEEE, MMMM d")}
        </Text>
      )}
      {selectedDate && filteredSessions.length === 0 && (
        <Text style={[styles.promptText, { color: colors.textSecondary }]}>
          No sessions on this date
        </Text>
      )}
    </>
  );

  return (
    <View style={[styles.container, {}]}>
      <FlatList
        data={selectedDate ? filteredSessions : []}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderSessionItem}
        ListHeaderComponent={calendarHeader}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listContent: {
    paddingVertical: 12,
  },
  toggleContainer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  dateHeader: {
    fontSize: 14,
    fontWeight: "600",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  promptText: {
    fontSize: 14,
    textAlign: "center",
    paddingVertical: 24,
  },
});
