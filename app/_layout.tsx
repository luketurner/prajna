import { Suspense } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SQLiteProvider } from "expo-sqlite";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ActivityIndicator, Platform, View, useColorScheme } from "react-native";
import * as Notifications from "expo-notifications";
import { migrateDbIfNeeded } from "@/data/migrations";
import { RepositoryProvider } from "@/data/database-provider";
import { Colors } from "@/constants/Colors";

// Configure foreground notification handler — suppress pop-ups for timer ticks,
// but allow sound for alarm notifications
Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    const isAlarm =
      notification.request.content.data?.type === "meditation-alarm";
    return {
      shouldShowAlert: isAlarm,
      shouldShowBanner: isAlarm,
      shouldShowList: true,
      shouldPlaySound: isAlarm,
      shouldSetBadge: false,
    };
  },
});

// Create Android notification channels
if (Platform.OS === "android") {
  Notifications.setNotificationChannelAsync("meditation-timer", {
    name: "Meditation Timer",
    importance: Notifications.AndroidImportance.DEFAULT,
    vibrationPattern: [0],
    sound: null,
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    showBadge: false,
  });

  Notifications.setNotificationChannelAsync("meditation-alarm", {
    name: "Meditation Alarm",
    importance: Notifications.AndroidImportance.HIGH,
    sound: "bell.mp3",
    vibrationPattern: [0, 250, 250, 250],
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    showBadge: false,
  });
}

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
            <StatusBar style="light" />
            <Stack
              screenOptions={{
                headerStyle: { backgroundColor: colors.background },
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
              <Stack.Screen
                name="settings"
                options={{
                  presentation: "modal",
                  title: "Settings",
                  headerShown: true,
                }}
              />
            </Stack>
          </RepositoryProvider>
        </SQLiteProvider>
      </Suspense>
    </QueryClientProvider>
  );
}
