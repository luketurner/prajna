import { useRouter } from "expo-router";
import { Alert, useColorScheme, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { SessionForm } from "@/components/SessionForm";
import { useCreateSession } from "@/hooks/useSessions";
import { Colors } from "@/constants/Colors";

export default function ManualEntryScreen() {
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const router = useRouter();

  const createSession = useCreateSession();

  const handleSubmit = async (data: {
    date: string;
    durationSeconds: number;
  }) => {
    try {
      await createSession.mutateAsync({
        date: data.date,
        durationSeconds: data.durationSeconds,
        source: "manual",
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
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <SessionForm
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        submitLabel="Save Session"
        isSubmitting={createSession.isPending}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
