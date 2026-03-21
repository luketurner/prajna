import { Colors } from "@/constants/Colors";
import { Stack } from "expo-router";
import { useColorScheme } from "react-native";

export default function StatsLayout() {
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];

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
          title: "Stats",
        }}
      />
    </Stack>
  );
}
