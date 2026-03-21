import { Colors } from "@/constants/Colors";
import { AccelerometerProvider } from "@/contexts/AccelerometerContext";
import { RepositoryProvider } from "@/data/database-provider";
import { migrateDbIfNeeded } from "@/data/migrations";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { SQLiteProvider } from "expo-sqlite";
import { StatusBar } from "expo-status-bar";
import { Suspense } from "react";
import { ActivityIndicator, View, useColorScheme } from "react-native";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: Infinity, // Local DB data - invalidate manually
      gcTime: 1000 * 60 * 60, // 1 hour
    },
  },
});

function LoadingFallback() {
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: colors.background,
      }}
    >
      <ActivityIndicator size="large" color={colors.tint} />
    </View>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];

  return (
    <QueryClientProvider client={queryClient}>
      <Suspense fallback={<LoadingFallback />}>
        <SQLiteProvider databaseName="prajna.db" onInit={migrateDbIfNeeded}>
          <RepositoryProvider>
            <AccelerometerProvider>
            <StatusBar style="light" />
            <Stack
              screenOptions={{
                headerStyle: { backgroundColor: colors.headerBar },
                headerTintColor: colors.text,
                contentStyle: { backgroundColor: colors.background },
              }}
            >
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen
                name="manual-entry"
                options={{
                  presentation: "formSheet",
                  title: "Log Session",
                  headerShown: true,
                }}
              />
              <Stack.Screen
                name="save-session"
                options={{
                  presentation: "formSheet",
                  title: "Save Session",
                  headerShown: true,
                }}
              />
              <Stack.Screen
                name="edit-session"
                options={{
                  presentation: "formSheet",
                  title: "Edit Session",
                  headerShown: true,
                }}
              />
              <Stack.Screen
                name="create-goal"
                options={{
                  presentation: "formSheet",
                  title: "Create Goal",
                  headerShown: true,
                }}
              />
            </Stack>
            </AccelerometerProvider>
          </RepositoryProvider>
        </SQLiteProvider>
      </Suspense>
    </QueryClientProvider>
  );
}
