import { GoldShimmer } from "@/components/GoldShimmer";
import { TimerDisplay } from "@/components/TimerDisplay";
import { Colors } from "@/constants/Colors";
import { useCreateSession } from "@/hooks/useSessions";
import { format } from "date-fns";
import { useLocalSearchParams, useRouter } from "expo-router";
import Storage from "expo-sqlite/kv-store";
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SaveSessionScreen() {
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const router = useRouter();
  const { durationMs } = useLocalSearchParams<{ durationMs: string }>();

  const elapsedMs = parseInt(durationMs ?? "0", 10);
  const durationSeconds = Math.floor(elapsedMs / 1000);

  const createSession = useCreateSession();

  const handleSave = async () => {
    if (durationSeconds <= 0) {
      Alert.alert(
        "Invalid Duration",
        "Session duration must be greater than 0.",
      );
      return;
    }

    try {
      await createSession.mutateAsync({
        date: format(new Date(), "yyyy-MM-dd"),
        durationSeconds,
        source: "timer",
      });

      // Clear the timer state from kv-store
      Storage.removeItemSync("timer_state");

      router.back();
    } catch {
      Alert.alert("Error", "Failed to save session. Please try again.");
    }
  };

  const handleDiscard = () => {
    Alert.alert(
      "Discard Session?",
      "Are you sure you want to discard this session?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Discard",
          style: "destructive",
          onPress: () => {
            Storage.removeItemSync("timer_state");
            router.back();
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <View style={styles.durationContainer}>
        <Text style={[styles.label, { color: colors.textSecondary }]}>
          Session Duration
        </Text>
        <TimerDisplay elapsedMs={elapsedMs} />
      </View>

      <View style={styles.dateContainer}>
        <Text style={[styles.label, { color: colors.textSecondary }]}>
          Date
        </Text>
        <Text style={[styles.dateText, { color: colors.text }]}>
          {format(new Date(), "EEEE, MMMM d, yyyy")}
        </Text>
      </View>

      <View style={styles.buttons}>
        <Pressable
          onPress={handleDiscard}
          style={[
            styles.button,
            styles.discardButton,
            { borderColor: colors.error },
          ]}
          disabled={createSession.isPending}
        >
          <Text style={[styles.buttonText, { color: colors.error }]}>
            Discard
          </Text>
        </Pressable>
        <Pressable
          onPress={handleSave}
          disabled={createSession.isPending}
          style={[
            styles.button,
            styles.saveButton,
            { borderRadius: 12, backgroundColor: colors.primaryButton },
          ]}
        >
          <GoldShimmer mode="text">
            <Text style={[styles.buttonText, { fontWeight: "bold" }]}>
              {createSession.isPending ? "Saving..." : "Save Session"}
            </Text>
          </GoldShimmer>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
  },
  durationContainer: {
    alignItems: "center",
    marginBottom: 32,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  dateContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  dateText: {
    fontSize: 18,
    fontWeight: "500",
  },
  buttons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 32,
  },
  button: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  discardButton: {
    borderWidth: 2,
  },
  saveButton: {},
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
