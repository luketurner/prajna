import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  StyleSheet,
  useColorScheme,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useTags, useCreateTag, useUpdateTag, useDeleteTag } from "@/hooks/useTags";
import { Colors } from "@/constants/Colors";
import type { Tag } from "@/specs/001-meditation-app/contracts/repository-interfaces";

export default function SettingsScreen() {
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];

  const { data: tags = [] } = useTags();
  const createTag = useCreateTag();
  const updateTag = useUpdateTag();
  const deleteTag = useDeleteTag();

  const [newTagName, setNewTagName] = useState("");
  const [editingTagId, setEditingTagId] = useState<number | null>(null);
  const [editingTagName, setEditingTagName] = useState("");

  const handleCreateTag = async () => {
    const trimmed = newTagName.trim();
    if (!trimmed) {
      Alert.alert("Error", "Tag name cannot be empty.");
      return;
    }

    // Check for duplicate
    if (tags.some((t) => t.name.toLowerCase() === trimmed.toLowerCase())) {
      Alert.alert("Error", "A tag with this name already exists.");
      return;
    }

    try {
      await createTag.mutateAsync({ name: trimmed });
      setNewTagName("");
    } catch {
      Alert.alert("Error", "Failed to create tag.");
    }
  };

  const handleStartEdit = (tag: Tag) => {
    setEditingTagId(tag.id);
    setEditingTagName(tag.name);
  };

  const handleCancelEdit = () => {
    setEditingTagId(null);
    setEditingTagName("");
  };

  const handleSaveEdit = async () => {
    if (editingTagId === null) return;

    const trimmed = editingTagName.trim();
    if (!trimmed) {
      Alert.alert("Error", "Tag name cannot be empty.");
      return;
    }

    // Check for duplicate (excluding current tag)
    if (
      tags.some(
        (t) =>
          t.id !== editingTagId &&
          t.name.toLowerCase() === trimmed.toLowerCase()
      )
    ) {
      Alert.alert("Error", "A tag with this name already exists.");
      return;
    }

    try {
      await updateTag.mutateAsync({ id: editingTagId, name: trimmed });
      handleCancelEdit();
    } catch {
      Alert.alert("Error", "Failed to update tag.");
    }
  };

  const handleDeleteTag = (tag: Tag) => {
    Alert.alert(
      "Delete Tag",
      `Are you sure you want to delete "${tag.name}"? This will remove the tag from all sessions.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteTag.mutateAsync(tag.id);
            } catch {
              Alert.alert("Error", "Failed to delete tag.");
            }
          },
        },
      ]
    );
  };

  const renderTagItem = ({ item }: { item: Tag }) => {
    const isEditing = editingTagId === item.id;

    if (isEditing) {
      return (
        <View style={[styles.tagItem, { borderBottomColor: colors.border }]}>
          <TextInput
            value={editingTagName}
            onChangeText={setEditingTagName}
            autoFocus
            style={[
              styles.editInput,
              {
                backgroundColor: colors.backgroundSecondary,
                borderColor: colors.border,
                color: colors.text,
              },
            ]}
            onSubmitEditing={handleSaveEdit}
          />
          <View style={styles.editActions}>
            <Pressable onPress={handleCancelEdit} style={styles.iconButton}>
              <MaterialIcons name="close" size={24} color={colors.textSecondary} />
            </Pressable>
            <Pressable onPress={handleSaveEdit} style={styles.iconButton}>
              <MaterialIcons name="check" size={24} color={colors.success} />
            </Pressable>
          </View>
        </View>
      );
    }

    return (
      <View style={[styles.tagItem, { borderBottomColor: colors.border }]}>
        <Text style={[styles.tagName, { color: colors.text }]}>{item.name}</Text>
        <View style={styles.tagActions}>
          <Pressable
            onPress={() => handleStartEdit(item)}
            style={styles.iconButton}
            accessibilityLabel={`Edit ${item.name}`}
          >
            <MaterialIcons name="edit" size={20} color={colors.textSecondary} />
          </Pressable>
          <Pressable
            onPress={() => handleDeleteTag(item)}
            style={styles.iconButton}
            accessibilityLabel={`Delete ${item.name}`}
          >
            <MaterialIcons name="delete" size={20} color={colors.error} />
          </Pressable>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Manage Tags
        </Text>
        <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
          Create and organize tags for your meditation sessions
        </Text>
      </View>

      {/* Add New Tag */}
      <View style={[styles.addSection, { borderBottomColor: colors.border }]}>
        <TextInput
          value={newTagName}
          onChangeText={setNewTagName}
          placeholder="New tag name"
          placeholderTextColor={colors.textSecondary}
          style={[
            styles.addInput,
            {
              backgroundColor: colors.backgroundSecondary,
              borderColor: colors.border,
              color: colors.text,
            },
          ]}
          onSubmitEditing={handleCreateTag}
          returnKeyType="done"
        />
        <Pressable
          onPress={handleCreateTag}
          style={[styles.addButton, { backgroundColor: colors.tint }]}
          disabled={createTag.isPending}
        >
          <MaterialIcons name="add" size={24} color={colors.background} />
        </Pressable>
      </View>

      {/* Tags List */}
      {tags.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialIcons
            name="label-outline"
            size={48}
            color={colors.textSecondary}
          />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            No tags yet. Create your first tag above.
          </Text>
        </View>
      ) : (
        <FlatList
          data={tags}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderTagItem}
          contentContainerStyle={styles.listContent}
        />
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingBottom: 12,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
  },
  addSection: {
    flexDirection: "row",
    padding: 16,
    gap: 12,
    borderBottomWidth: 1,
  },
  addInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  listContent: {
    paddingBottom: 20,
  },
  tagItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  tagName: {
    fontSize: 16,
    fontWeight: "500",
  },
  tagActions: {
    flexDirection: "row",
    gap: 8,
  },
  iconButton: {
    padding: 4,
  },
  editInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 16,
    marginRight: 8,
  },
  editActions: {
    flexDirection: "row",
    gap: 4,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  emptyText: {
    fontSize: 14,
    marginTop: 12,
    textAlign: "center",
  },
});
