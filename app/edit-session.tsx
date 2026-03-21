import { SessionForm } from "@/components/SessionForm";
import { Colors } from "@/constants/Colors";
import { useSession, useUpdateSession } from "@/hooks/useSessions";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function EditSessionScreen() {
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const router = useRouter();
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();

  const id = parseInt(sessionId ?? "0", 10);
  const { data: session, isLoading: sessionLoading } = useSession(id);
  const updateSession = useUpdateSession();

  const handleSubmit = async (data: {
    date: string;
    durationSeconds: number;
  }) => {
    try {
      await updateSession.mutateAsync({
        id,
        date: data.date,
        durationSeconds: data.durationSeconds,
      });
      router.back();
    } catch {
      Alert.alert("Error", "Failed to update session. Please try again.");
    }
  };

  if (sessionLoading || !session) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.tint} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <SessionForm
        initialDate={session.date}
        initialDurationMinutes={Math.floor(session.durationSeconds / 60)}
        onSubmit={handleSubmit}
        submitLabel="Update Session"
        isSubmitting={updateSession.isPending}
      />
    </SafeAreaView>
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
});
