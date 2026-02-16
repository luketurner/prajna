import {
  View,
  Text,
  Pressable,
  StyleSheet,
  useColorScheme,
  ActivityIndicator,
  Alert,
  ScrollView,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { format, parseISO } from "date-fns";
import { MaterialIcons } from "@expo/vector-icons";
import { useSession, useDeleteSession } from "@/hooks/useSessions";
import { Colors } from "@/constants/Colors";

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`;
  }
  if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  }
  return `${secs}s`;
}

export default function SessionDetailScreen() {
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const router = useRouter();
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();

  const id = parseInt(sessionId ?? "0", 10);
  const { data: session, isLoading } = useSession(id);
  const deleteSession = useDeleteSession();

  const handleEdit = () => {
    router.push({
      pathname: "/edit-session" as never,
      params: { sessionId: sessionId },
    });
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete Session",
      "Are you sure you want to delete this session? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteSession.mutateAsync(id);
              router.back();
            } catch {
              Alert.alert("Error", "Failed to delete session.");
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.tint} />
      </View>
    );
  }

  if (!session) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.text }}>Session not found</Text>
      </View>
    );
  }

  const date = parseISO(session.date);

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        {/* Duration */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>
            Duration
          </Text>
          <Text style={[styles.duration, { color: colors.tint }]}>
            {formatDuration(session.durationSeconds)}
          </Text>
        </View>

        {/* Date */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Date</Text>
          <Text style={[styles.value, { color: colors.text }]}>
            {format(date, "EEEE, MMMM d, yyyy")}
          </Text>
        </View>

        {/* Source */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>
            Recorded Via
          </Text>
          <Text style={[styles.value, { color: colors.text }]}>
            {session.source === "timer" ? "Timer" : "Manual Entry"}
          </Text>
        </View>

        {/* Tags */}
        {session.tags.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>
              Tags
            </Text>
            <View style={styles.tagsContainer}>
              {session.tags.map((tag) => (
                <View
                  key={tag.id}
                  style={[styles.tag, { backgroundColor: colors.backgroundSecondary }]}
                >
                  <Text style={[styles.tagText, { color: colors.text }]}>
                    {tag.name}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          <Pressable
            onPress={handleEdit}
            style={[styles.actionButton, { backgroundColor: colors.tint }]}
          >
            <MaterialIcons name="edit" size={20} color={colors.background} />
            <Text style={[styles.actionButtonText, { color: colors.background }]}>Edit</Text>
          </Pressable>

          <Pressable
            onPress={handleDelete}
            style={[styles.actionButton, styles.deleteButton, { borderColor: colors.error }]}
            disabled={deleteSession.isPending}
          >
            <MaterialIcons name="delete" size={20} color={colors.error} />
            <Text style={[styles.actionButtonText, { color: colors.error }]}>
              Delete
            </Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
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
  content: {
    padding: 24,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 6,
  },
  duration: {
    fontSize: 36,
    fontWeight: "700",
  },
  value: {
    fontSize: 18,
    fontWeight: "500",
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tag: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
  },
  tagText: {
    fontSize: 14,
    fontWeight: "500",
  },
  actions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 24,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
  deleteButton: {
    backgroundColor: "transparent",
    borderWidth: 2,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
