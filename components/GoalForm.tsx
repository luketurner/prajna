import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  useColorScheme,
  Alert,
  Platform,
  ScrollView,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import {
  format,
  parseISO,
  startOfYear,
  endOfYear,
  startOfMonth,
  endOfMonth,
  isAfter,
} from "date-fns";
import { Colors } from "@/constants/Colors";

type PeriodType = "year" | "month" | "custom";

interface GoalFormProps {
  initialTargetHours?: number;
  initialPeriodType?: PeriodType;
  initialStartDate?: string;
  initialEndDate?: string;
  onSubmit: (data: {
    targetHours: number;
    periodType: PeriodType;
    startDate: string;
    endDate: string;
  }) => void;
  onCancel: () => void;
  submitLabel?: string;
  isSubmitting?: boolean;
}

export function GoalForm({
  initialTargetHours,
  initialPeriodType = "year",
  initialStartDate,
  initialEndDate,
  onSubmit,
  onCancel,
  submitLabel = "Save",
  isSubmitting = false,
}: GoalFormProps) {
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const now = new Date();

  const [targetHours, setTargetHours] = useState(
    initialTargetHours ? String(initialTargetHours) : ""
  );
  const [periodType, setPeriodType] = useState<PeriodType>(initialPeriodType);
  const [startDate, setStartDate] = useState<Date>(
    initialStartDate ? parseISO(initialStartDate) : startOfYear(now)
  );
  const [endDate, setEndDate] = useState<Date>(
    initialEndDate ? parseISO(initialEndDate) : endOfYear(now)
  );
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const handlePeriodTypeChange = (type: PeriodType) => {
    setPeriodType(type);
    if (type === "year") {
      setStartDate(startOfYear(now));
      setEndDate(endOfYear(now));
    } else if (type === "month") {
      setStartDate(startOfMonth(now));
      setEndDate(endOfMonth(now));
    }
    // 'custom' keeps current dates
  };

  const handleStartDateChange = (_: unknown, selectedDate?: Date) => {
    setShowStartPicker(Platform.OS === "ios");
    if (selectedDate) {
      setStartDate(selectedDate);
    }
  };

  const handleEndDateChange = (_: unknown, selectedDate?: Date) => {
    setShowEndPicker(Platform.OS === "ios");
    if (selectedDate) {
      setEndDate(selectedDate);
    }
  };

  const validate = (): boolean => {
    const hours = parseFloat(targetHours);
    if (isNaN(hours) || hours <= 0) {
      Alert.alert("Invalid Target", "Target hours must be greater than 0.");
      return false;
    }

    if (isAfter(startDate, endDate)) {
      Alert.alert("Invalid Dates", "End date must be after start date.");
      return false;
    }

    return true;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    onSubmit({
      targetHours: parseFloat(targetHours),
      periodType,
      startDate: format(startDate, "yyyy-MM-dd"),
      endDate: format(endDate, "yyyy-MM-dd"),
    });
  };

  return (
    <ScrollView style={styles.container}>
      {/* Target Hours */}
      <View style={styles.field}>
        <Text style={[styles.label, { color: colors.text }]}>
          Target Hours
        </Text>
        <TextInput
          value={targetHours}
          onChangeText={setTargetHours}
          keyboardType="decimal-pad"
          placeholder="e.g., 100"
          placeholderTextColor={colors.textSecondary}
          style={[
            styles.input,
            {
              backgroundColor: colors.backgroundSecondary,
              borderColor: colors.border,
              color: colors.text,
            },
          ]}
        />
      </View>

      {/* Period Type Selector */}
      <View style={styles.field}>
        <Text style={[styles.label, { color: colors.text }]}>Period</Text>
        <View style={styles.periodSelector}>
          {(["year", "month", "custom"] as PeriodType[]).map((type) => (
            <Pressable
              key={type}
              onPress={() => handlePeriodTypeChange(type)}
              style={[
                styles.periodOption,
                {
                  backgroundColor:
                    periodType === type
                      ? colors.tint
                      : colors.backgroundSecondary,
                  borderColor:
                    periodType === type ? colors.tint : colors.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.periodOptionText,
                  { color: periodType === type ? "#fff" : colors.text },
                ]}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Date Range (always shown, but only editable for 'custom') */}
      <View style={styles.dateRow}>
        <View style={[styles.field, { flex: 1 }]}>
          <Text style={[styles.label, { color: colors.text }]}>Start Date</Text>
          <Pressable
            onPress={() => periodType === "custom" && setShowStartPicker(true)}
            style={[
              styles.input,
              {
                backgroundColor: colors.backgroundSecondary,
                borderColor: colors.border,
                opacity: periodType === "custom" ? 1 : 0.6,
              },
            ]}
            disabled={periodType !== "custom"}
          >
            <Text style={[styles.inputText, { color: colors.text }]}>
              {format(startDate, "MMM d, yyyy")}
            </Text>
          </Pressable>
          {showStartPicker && (
            <DateTimePicker
              value={startDate}
              mode="date"
              display="default"
              onChange={handleStartDateChange}
            />
          )}
        </View>

        <View style={[styles.field, { flex: 1, marginLeft: 12 }]}>
          <Text style={[styles.label, { color: colors.text }]}>End Date</Text>
          <Pressable
            onPress={() => periodType === "custom" && setShowEndPicker(true)}
            style={[
              styles.input,
              {
                backgroundColor: colors.backgroundSecondary,
                borderColor: colors.border,
                opacity: periodType === "custom" ? 1 : 0.6,
              },
            ]}
            disabled={periodType !== "custom"}
          >
            <Text style={[styles.inputText, { color: colors.text }]}>
              {format(endDate, "MMM d, yyyy")}
            </Text>
          </Pressable>
          {showEndPicker && (
            <DateTimePicker
              value={endDate}
              mode="date"
              display="default"
              onChange={handleEndDateChange}
            />
          )}
        </View>
      </View>

      {/* Buttons */}
      <View style={styles.buttons}>
        <Pressable
          onPress={onCancel}
          style={[styles.button, styles.cancelButton, { borderColor: colors.border }]}
          disabled={isSubmitting}
        >
          <Text style={[styles.buttonText, { color: colors.text }]}>Cancel</Text>
        </Pressable>
        <Pressable
          onPress={handleSubmit}
          style={[styles.button, styles.submitButton, { backgroundColor: colors.tint }]}
          disabled={isSubmitting}
        >
          <Text style={[styles.buttonText, { color: "#fff" }]}>
            {isSubmitting ? "Saving..." : submitLabel}
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  field: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  inputText: {
    fontSize: 16,
  },
  periodSelector: {
    flexDirection: "row",
    gap: 8,
  },
  periodOption: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
  },
  periodOptionText: {
    fontSize: 14,
    fontWeight: "600",
  },
  dateRow: {
    flexDirection: "row",
  },
  buttons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 24,
    marginBottom: 40,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  cancelButton: {
    borderWidth: 1,
  },
  submitButton: {},
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
