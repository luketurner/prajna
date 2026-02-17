import { Colors } from "@/constants/Colors";
import { MaterialIcons } from "@expo/vector-icons";
import { useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  useColorScheme,
  View,
} from "react-native";

interface DurationInputProps {
  value: number | null;
  onChange: (minutes: number | null) => void;
  disabled?: boolean;
}

const MIN_DURATION = 1;
const MAX_DURATION = 1440; // 24 hours in minutes

export function DurationInput({
  value,
  onChange,
  disabled,
}: DurationInputProps) {
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const [text, setText] = useState(value?.toString() ?? "");

  const handleChangeText = (input: string) => {
    // Allow only digits
    const cleaned = input.replace(/[^0-9]/g, "");
    setText(cleaned);

    if (cleaned === "") {
      onChange(null);
      return;
    }

    const parsed = parseInt(cleaned, 10);
    if (!isNaN(parsed) && parsed >= MIN_DURATION && parsed <= MAX_DURATION) {
      onChange(parsed);
    } else if (!isNaN(parsed) && parsed > MAX_DURATION) {
      // Clamp to max
      setText(MAX_DURATION.toString());
      onChange(MAX_DURATION);
    } else {
      onChange(null);
    }
  };

  const handleClear = () => {
    setText("");
    onChange(null);
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.textSecondary }]}>
        Duration (minutes)
      </Text>
      <View style={styles.inputRow}>
        <TextInput
          style={[
            styles.input,
            {
              color: colors.text,
              borderColor: colors.border,
              backgroundColor: colors.backgroundSecondary,
            },
          ]}
          value={text}
          onChangeText={handleChangeText}
          keyboardType="number-pad"
          editable={!disabled}
          maxLength={4}
          testID="duration-input"
          accessibilityLabel="Meditation duration in minutes"
        />
        {text !== "" && !disabled && (
          <Pressable
            onPress={handleClear}
            style={styles.clearButton}
            accessibilityLabel="Clear duration"
            accessibilityRole="button"
          >
            <MaterialIcons
              name="close"
              size={20}
              color={colors.textSecondary}
            />
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  input: {
    fontSize: 24,
    fontVariant: ["tabular-nums"],
    textAlign: "center",
    width: 120,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderRadius: 12,
  },
  clearButton: {
    padding: 4,
  },
});
