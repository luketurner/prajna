import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  useColorScheme,
  Alert,
  Platform,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { format, parseISO, isAfter, startOfDay } from "date-fns";
import { Colors } from "@/constants/Colors";
import { TagPicker } from "./TagPicker";
import type { Tag } from "@/specs/001-meditation-app/contracts/repository-interfaces";

interface SessionFormProps {
  initialDate?: string; // ISO date YYYY-MM-DD
  initialDurationMinutes?: number;
  initialTagIds?: number[];
  tags: Tag[];
  tagsLoading?: boolean;
  onSubmit: (data: {
    date: string;
    durationSeconds: number;
    tagIds: number[];
  }) => void;
  onCancel: () => void;
  submitLabel?: string;
  isSubmitting?: boolean;
}

export function SessionForm({
  initialDate,
  initialDurationMinutes = 0,
  initialTagIds = [],
  tags,
  tagsLoading = false,
  onSubmit,
  onCancel,
  submitLabel = "Save",
  isSubmitting = false,
}: SessionFormProps) {
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];

  const [date, setDate] = useState<Date>(
    initialDate ? parseISO(initialDate) : new Date()
  );
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [durationMinutes, setDurationMinutes] = useState(
    initialDurationMinutes > 0 ? String(initialDurationMinutes) : ""
  );
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>(initialTagIds);

  useEffect(() => {
    if (initialTagIds.length > 0) {
      setSelectedTagIds(initialTagIds);
    }
  }, [initialTagIds]);

  const handleToggleTag = (tagId: number) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId]
    );
  };

  const handleDateChange = (_: unknown, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === "ios");
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  const validate = (): boolean => {
    const today = startOfDay(new Date());
    const selectedDate = startOfDay(date);

    // Check future date
    if (isAfter(selectedDate, today)) {
      Alert.alert("Invalid Date", "Session date cannot be in the future.");
      return false;
    }

    // Check duration
    const minutes = parseInt(durationMinutes, 10);
    if (isNaN(minutes) || minutes <= 0) {
      Alert.alert("Invalid Duration", "Duration must be greater than 0 minutes.");
      return false;
    }

    return true;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    const minutes = parseInt(durationMinutes, 10);
    const seconds = minutes * 60;

    // Warn for >4 hour duration
    if (minutes > 240) {
      Alert.alert(
        "Long Duration",
        `${minutes} minutes is over 4 hours. Are you sure this is correct?`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Save Anyway",
            onPress: () => {
              onSubmit({
                date: format(date, "yyyy-MM-dd"),
                durationSeconds: seconds,
                tagIds: selectedTagIds,
              });
            },
          },
        ]
      );
    } else {
      onSubmit({
        date: format(date, "yyyy-MM-dd"),
        durationSeconds: seconds,
        tagIds: selectedTagIds,
      });
    }
  };

  return (
    <View style={styles.container}>
      {/* Date Picker */}
      <View style={styles.field}>
        <Text style={[styles.label, { color: colors.text }]}>Date</Text>
        <Pressable
          onPress={() => setShowDatePicker(true)}
          style={[
            styles.input,
            { backgroundColor: colors.backgroundSecondary, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.inputText, { color: colors.text }]}>
            {format(date, "MMM d, yyyy")}
          </Text>
        </Pressable>
        {showDatePicker && (
          <DateTimePicker
            value={date}
            mode="date"
            display="default"
            onChange={handleDateChange}
            maximumDate={new Date()}
          />
        )}
      </View>

      {/* Duration Input */}
      <View style={styles.field}>
        <Text style={[styles.label, { color: colors.text }]}>
          Duration (minutes)
        </Text>
        <TextInput
          value={durationMinutes}
          onChangeText={setDurationMinutes}
          keyboardType="number-pad"
          placeholder="e.g., 20"
          placeholderTextColor={colors.textSecondary}
          style={[
            styles.input,
            styles.textInput,
            {
              backgroundColor: colors.backgroundSecondary,
              borderColor: colors.border,
              color: colors.text,
            },
          ]}
        />
      </View>

      {/* Tag Picker */}
      <TagPicker
        tags={tags}
        selectedTagIds={selectedTagIds}
        onToggleTag={handleToggleTag}
        isLoading={tagsLoading}
      />

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
    </View>
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
  },
  textInput: {
    fontSize: 16,
  },
  inputText: {
    fontSize: 16,
  },
  buttons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 24,
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
