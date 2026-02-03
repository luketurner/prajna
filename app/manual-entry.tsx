import { useRouter } from "expo-router";
import { Alert, useColorScheme, View, StyleSheet } from "react-native";
import { SessionForm } from "@/components/SessionForm";
import { useTags } from "@/hooks/useTags";
import { useCreateSession } from "@/hooks/useSessions";
import { Colors } from "@/constants/Colors";

export default function ManualEntryScreen() {
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const router = useRouter();

  const { data: tags = [], isLoading: tagsLoading } = useTags();
  const createSession = useCreateSession();

  const handleSubmit = async (data: {
    date: string;
    durationSeconds: number;
    tagIds: number[];
  }) => {
    try {
      await createSession.mutateAsync({
        date: data.date,
        durationSeconds: data.durationSeconds,
        source: "manual",
        tagIds: data.tagIds,
      });
      router.back();
    } catch {
      Alert.alert("Error", "Failed to save session. Please try again.");
    }
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SessionForm
        tags={tags}
        tagsLoading={tagsLoading}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        submitLabel="Save Session"
        isSubmitting={createSession.isPending}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
