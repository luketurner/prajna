import { Colors } from "@/constants/Colors";
import { MaterialIcons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import { Pressable, StyleSheet, useColorScheme } from "react-native";

export default function HistoryLayout() {
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const router = useRouter();

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.headerBar },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: 700 },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: "Past Sessions",
          headerRight: () => (
            <Pressable
              onPress={() => router.push("/manual-entry" as never)}
              style={styles.headerButton}
              accessibilityLabel="Log a session manually"
              accessibilityRole="button"
            >
              <MaterialIcons name="add" size={28} color={colors.tint} />
            </Pressable>
          ),
        }}
      />
      <Stack.Screen
        name="[sessionId]"
        options={{
          title: "Session Details",
        }}
      />
    </Stack>
  );
}

const styles = StyleSheet.create({
  headerButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
});
