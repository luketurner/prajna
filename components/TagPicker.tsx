import {
  View,
  Text,
  Pressable,
  StyleSheet,
  useColorScheme,
  ActivityIndicator,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { Colors } from "@/constants/Colors";
import type { Tag } from "@/specs/001-meditation-app/contracts/repository-interfaces";

interface TagPickerProps {
  tags: Tag[];
  selectedTagIds: number[];
  onToggleTag: (tagId: number) => void;
  isLoading?: boolean;
}

export function TagPicker({
  tags,
  selectedTagIds,
  onToggleTag,
  isLoading = false,
}: TagPickerProps) {
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={colors.tint} />
      </View>
    );
  }

  if (tags.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
          No tags yet. Create tags in Settings.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.text }]}>Tags</Text>
      <View style={styles.tagsContainer}>
        {tags.map((tag) => {
          const isSelected = selectedTagIds.includes(tag.id);
          return (
            <Pressable
              key={tag.id}
              onPress={() => onToggleTag(tag.id)}
              style={[
                styles.tag,
                {
                  backgroundColor: isSelected
                    ? colors.tint
                    : colors.backgroundSecondary,
                  borderColor: isSelected ? colors.tint : colors.border,
                },
              ]}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: isSelected }}
              accessibilityLabel={tag.name}
            >
              {isSelected && (
                <MaterialIcons
                  name="check"
                  size={14}
                  color={colors.background}
                  style={styles.checkIcon}
                />
              )}
              <Text
                style={[
                  styles.tagText,
                  { color: isSelected ? colors.background : colors.text },
                ]}
              >
                {tag.name}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  loadingContainer: {
    padding: 20,
    alignItems: "center",
  },
  emptyContainer: {
    padding: 16,
  },
  emptyText: {
    fontSize: 14,
    fontStyle: "italic",
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tag: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
  },
  checkIcon: {
    marginRight: 4,
  },
  tagText: {
    fontSize: 14,
    fontWeight: "500",
  },
});
