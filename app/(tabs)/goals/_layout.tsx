import { Stack, useRouter } from "expo-router";
import { useColorScheme, Pressable } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { Colors } from "@/constants/Colors";

export default function GoalsLayout() {
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
          title: "Goals",
          headerRight: () => (
            <Pressable
              onPress={() => router.push("/create-goal" as never)}
              style={{ marginRight: 8 }}
              accessibilityLabel="Create new goal"
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
