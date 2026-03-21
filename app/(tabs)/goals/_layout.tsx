import { Colors } from "@/constants/Colors";
import { MaterialIcons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import { Pressable, StyleSheet, useColorScheme } from "react-native";

export default function GoalsLayout() {
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const router = useRouter();

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.headerBar },
        headerTintColor: colors.text,
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: "Goals",
          headerRight: () => (
            <Pressable
              onPress={() => router.push("/create-goal" as never)}
              style={styles.headerButton}
              accessibilityLabel="Create new goal"
              accessibilityRole="button"
            >
              <MaterialIcons name="add" size={28} color={colors.tint} />
            </Pressable>
          ),
        }}
      />
      <Stack.Screen
        name="[goalId]"
        options={{
          title: "Goal Details",
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
