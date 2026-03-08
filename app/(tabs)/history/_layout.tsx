import { Stack, useRouter } from "expo-router";
import { Pressable, useColorScheme, StyleSheet } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { Colors } from "@/constants/Colors";

export default function HistoryLayout() {
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const router = useRouter();

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: "History",
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
