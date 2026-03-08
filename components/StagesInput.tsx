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

interface StagesInputProps {
  stages: number[]; // durations in minutes
  onChange: (stages: number[]) => void;
  disabled?: boolean;
}

const MIN_DURATION = 1;
const MAX_DURATION = 1440;

export function StagesInput({ stages, onChange, disabled }: StagesInputProps) {
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];

  // Track text for each stage separately so partial input doesn't get clobbered
  const [texts, setTexts] = useState<string[]>(() =>
    stages.map((s) => s.toString()),
  );

  const handleChangeText = (index: number, input: string) => {
    const cleaned = input.replace(/[^0-9]/g, "");
    const newTexts = [...texts];
    newTexts[index] = cleaned;
    setTexts(newTexts);

    if (cleaned === "") return; // don't update stages for empty input

    let parsed = parseInt(cleaned, 10);
    if (isNaN(parsed) || parsed < MIN_DURATION) return;
    if (parsed > MAX_DURATION) parsed = MAX_DURATION;

    const newStages = [...stages];
    newStages[index] = parsed;
    onChange(newStages);
  };

  const handleBlur = (index: number) => {
    // On blur, sync text to actual stage value
    const newTexts = [...texts];
    newTexts[index] = stages[index].toString();
    setTexts(newTexts);
  };

  const handleAdd = () => {
    const lastDuration = stages.length > 0 ? stages[stages.length - 1] : 15;
    const newStages = [...stages, lastDuration];
    onChange(newStages);
    setTexts([...texts, lastDuration.toString()]);
  };

  const handleRemove = (index: number) => {
    const newStages = stages.filter((_, i) => i !== index);
    const newTexts = texts.filter((_, i) => i !== index);
    onChange(newStages);
    setTexts(newTexts);
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.textSecondary }]}>
        Stages
      </Text>

      {stages.map((_, index) => (
        <View key={index} style={styles.stageRow}>
          <Text style={[styles.stageNumber, { color: colors.textSecondary }]}>
            {index + 1}.
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                color: colors.text,
                borderColor: colors.border,
                backgroundColor: colors.backgroundSecondary,
              },
            ]}
            value={texts[index] ?? stages[index].toString()}
            onChangeText={(t) => handleChangeText(index, t)}
            onBlur={() => handleBlur(index)}
            keyboardType="number-pad"
            editable={!disabled}
            maxLength={4}
            accessibilityLabel={`Stage ${index + 1} duration in minutes`}
          />
          <Text style={[styles.unit, { color: colors.textSecondary }]}>
            min
          </Text>
          {stages.length > 1 && !disabled && (
            <Pressable
              onPress={() => handleRemove(index)}
              style={styles.removeButton}
              accessibilityLabel={`Remove stage ${index + 1}`}
              accessibilityRole="button"
            >
              <MaterialIcons name="close" size={20} color={colors.error} />
            </Pressable>
          )}
        </View>
      ))}

      {!disabled && (
        <Pressable
          onPress={handleAdd}
          style={[styles.addButton, { borderColor: colors.border }]}
          accessibilityLabel="Add stage"
          accessibilityRole="button"
        >
          <MaterialIcons name="add" size={20} color={colors.textSecondary} />
          <Text style={[styles.addText, { color: colors.textSecondary }]}>
            Add Stage
          </Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    marginBottom: 24,
    gap: 8,
  },
  label: {
    fontSize: 14,
    marginBottom: 4,
  },
  stageRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  stageNumber: {
    fontSize: 16,
    width: 24,
    textAlign: "right",
    fontVariant: ["tabular-nums"],
  },
  input: {
    fontSize: 24,
    fontVariant: ["tabular-nums"],
    textAlign: "center",
    width: 80,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderRadius: 12,
  },
  unit: {
    fontSize: 14,
  },
  removeButton: {
    padding: 4,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderRadius: 12,
    borderStyle: "dashed",
    marginTop: 4,
  },
  addText: {
    fontSize: 14,
    fontWeight: "500",
  },
});
