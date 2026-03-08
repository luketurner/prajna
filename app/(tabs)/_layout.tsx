import { Tabs, useRouter } from "expo-router";
import { Pressable, View, StyleSheet, useColorScheme } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "@/constants/Colors";

function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Tab bar order: [stats] [history] [TIMER FAB] [goals] [manual-entry]
  const renderItems = () => {
    const items: React.ReactNode[] = [];

    state.routes.forEach((route) => {
      const { options } = descriptors[route.key];
      const isFocused = state.index === state.routes.indexOf(route);

      const onPress = () => {
        const event = navigation.emit({
          type: "tabPress",
          target: route.key,
          canPreventDefault: true,
        });

        if (!isFocused && !event.defaultPrevented) {
          navigation.navigate(route.name);
        }
      };

      // Timer tab renders as the center FAB instead of a regular tab
      if (route.name === "index") {
        return;
      }

      // Get icon name based on route
      let iconName: keyof typeof MaterialIcons.glyphMap = "timer";
      if (route.name === "history") iconName = "history";
      else if (route.name === "goals") iconName = "flag";
      else if (route.name === "stats") iconName = "bar-chart";

      items.push(
        <Pressable
          key={route.key}
          onPress={onPress}
          style={styles.tabItem}
          accessibilityRole="button"
          accessibilityState={isFocused ? { selected: true } : {}}
          accessibilityLabel={options.tabBarAccessibilityLabel}
        >
          <MaterialIcons
            name={iconName}
            size={24}
            color={isFocused ? colors.tabIconSelected : colors.tabIconDefault}
          />
        </Pressable>
      );

      // Insert Timer FAB after History tab
      if (route.name === "history") {
        items.push(
          <Pressable
            key="fab"
            onPress={() => navigation.navigate("index")}
            style={[styles.fab, { backgroundColor: colors.fab }]}
            accessibilityRole="button"
            accessibilityLabel="Timer"
          >
            <MaterialIcons name="timer" size={28} color={colors.fabIcon} />
          </Pressable>
        );
      }

      // Insert manual entry button after Goals tab
      if (route.name === "goals") {
        items.push(
          <Pressable
            key="log-session"
            onPress={() => router.push("/manual-entry" as never)}
            style={styles.tabItem}
            accessibilityRole="button"
            accessibilityLabel="Log a session manually"
          >
            <MaterialIcons
              name="add"
              size={24}
              color={colors.tabIconDefault}
            />
          </Pressable>
        );
      }
    });

    return items;
  };

  return (
    <View style={[styles.tabBar, { backgroundColor: colors.background, borderTopColor: colors.border, paddingBottom: Math.max(insets.bottom, 8) }]}>
      {renderItems()}
    </View>
  );
}

export default function TabLayout() {
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const router = useRouter();

  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Timer",
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: "Stats",
        }}
      />
      <Tabs.Screen
        name="history"
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
      <Tabs.Screen
        name="goals"
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
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: "row",
    borderTopWidth: 1,
    paddingBottom: 8,
    paddingTop: 8,
    alignItems: "center",
    justifyContent: "space-around",
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
  },
  headerButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 8,
    marginTop: -28,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
});
