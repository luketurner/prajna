import { GoldShimmer } from "@/components/GoldShimmer";
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
              styles.segmentInner,
              i > 0 && { borderLeftWidth: 1, borderLeftColor: colors.border },
              selected && { backgroundColor: colors.primaryButton },
            ]}
          >
            {selected ? (
              <GoldShimmer mode="text">
                <Text style={styles.segmentText}>{opt.label}</Text>
              </GoldShimmer>
            ) : (
              <Text style={[styles.segmentText, { color: colors.text }]}>
                {opt.label}
              </Text>
            )}
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
    alignItems: "center",
    justifyContent: "center",
  },
  segmentInner: {
    paddingVertical: 8,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  segmentText: {
    fontSize: 13,
    fontWeight: "bold",
  },
});
