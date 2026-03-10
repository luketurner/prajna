import { Colors } from "@/constants/Colors";
import { Pressable, StyleSheet, Text, View } from "react-native";

interface SegmentedControlProps<T extends string> {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  colors: (typeof Colors)["light"];
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  colors,
}: SegmentedControlProps<T>) {
  return (
    <View style={[styles.row, { borderColor: colors.border }]}>
      {options.map((opt, i) => {
        const selected = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            style={[
              styles.segment,
              selected && { backgroundColor: colors.tint },
              i > 0 && { borderLeftWidth: 1, borderLeftColor: colors.border },
            ]}
          >
            <Text
              style={[
                styles.segmentText,
                { color: selected ? colors.background : colors.text },
              ]}
            >
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    borderWidth: 1,
    borderRadius: 8,
    overflow: "hidden",
  },
  segment: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  segmentText: {
    fontSize: 13,
    fontWeight: "600",
  },
});
