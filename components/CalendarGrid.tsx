import { Colors } from "@/constants/Colors";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  format,
  getDay,
  isSameDay,
  startOfMonth,
  subMonths,
} from "date-fns";
import { MaterialIcons } from "@expo/vector-icons";
import {
  Pressable,
  StyleSheet,
  Text,
  useColorScheme,
  useWindowDimensions,
  View,
} from "react-native";

interface CalendarGridProps {
  currentMonth: Date;
  sessionDates: Set<string>;
  selectedDate: string | null;
  onDatePress: (date: string) => void;
  onMonthChange: (date: Date) => void;
}

const DAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

export function CalendarGrid({
  currentMonth,
  sessionDates,
  selectedDate,
  onDatePress,
  onMonthChange,
}: CalendarGridProps) {
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const { width: windowWidth } = useWindowDimensions();
  const cellSize = (windowWidth - 32) / 7;

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const leadingBlanks = getDay(monthStart);
  const today = new Date();

  const cells: (Date | null)[] = [
    ...Array.from({ length: leadingBlanks }, () => null),
    ...days,
  ];

  const rows: (Date | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    rows.push(cells.slice(i, i + 7));
  }

  return (
    <View style={styles.container}>
      <View style={styles.monthNav}>
        <Pressable onPress={() => onMonthChange(subMonths(currentMonth, 1))}>
          <MaterialIcons
            name="chevron-left"
            size={28}
            color={colors.text}
          />
        </Pressable>
        <Text style={[styles.monthLabel, { color: colors.text }]}>
          {format(currentMonth, "MMMM yyyy")}
        </Text>
        <Pressable onPress={() => onMonthChange(addMonths(currentMonth, 1))}>
          <MaterialIcons
            name="chevron-right"
            size={28}
            color={colors.text}
          />
        </Pressable>
      </View>

      <View style={styles.weekRow}>
        {DAY_LABELS.map((label, i) => (
          <View key={i} style={{ width: cellSize, alignItems: "center" }}>
            <Text style={[styles.dayLabel, { color: colors.textSecondary }]}>
              {label}
            </Text>
          </View>
        ))}
      </View>

      {rows.map((row, rowIndex) => (
        <View key={rowIndex} style={styles.weekRow}>
          {row.map((day, colIndex) => {
            if (!day) {
              return <View key={`blank-${colIndex}`} style={{ width: cellSize, height: cellSize }} />;
            }

            const dateStr = format(day, "yyyy-MM-dd");
            const hasSession = sessionDates.has(dateStr);
            const isSelected = selectedDate === dateStr;
            const isToday = isSameDay(day, today);

            return (
              <Pressable
                key={dateStr}
                onPress={() => onDatePress(dateStr)}
                style={[
                  styles.cell,
                  {
                    width: cellSize,
                    height: cellSize,
                  },
                  isSelected && {
                    backgroundColor: colors.tint,
                    borderRadius: cellSize / 2,
                  },
                  isToday &&
                    !isSelected && {
                      borderWidth: 1,
                      borderColor: colors.border,
                      borderRadius: cellSize / 2,
                    },
                ]}
              >
                <Text
                  style={[
                    styles.dayNumber,
                    {
                      color: isSelected ? colors.background : colors.text,
                    },
                  ]}
                >
                  {day.getDate()}
                </Text>
                {hasSession && (
                  <View
                    style={[
                      styles.dot,
                      {
                        backgroundColor: isSelected
                          ? colors.background
                          : colors.tint,
                      },
                    ]}
                  />
                )}
              </Pressable>
            );
          })}
          {row.length < 7 &&
            Array.from({ length: 7 - row.length }, (_, i) => (
              <View key={`pad-${i}`} style={{ width: cellSize, height: cellSize }} />
            ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  monthNav: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  monthLabel: {
    fontSize: 18,
    fontWeight: "600",
  },
  weekRow: {
    flexDirection: "row",
  },
  dayLabel: {
    fontSize: 13,
    fontWeight: "600",
    paddingVertical: 8,
  },
  cell: {
    alignItems: "center",
    justifyContent: "center",
  },
  dayNumber: {
    fontSize: 15,
    fontWeight: "500",
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 2,
    position: "absolute",
    bottom: 6,
  },
});
