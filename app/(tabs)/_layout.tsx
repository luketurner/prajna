import { Tabs, useRouter } from "expo-router";
import { Pressable, View, StyleSheet, useColorScheme } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { Colors } from "@/constants/Colors";

function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const router = useRouter();

  // Insert FAB between History (index 1) and Goals (index 2)
  const renderItems = () => {
    const items: React.ReactNode[] = [];

    state.routes.forEach((route, index) => {
      const { options } = descriptors[route.key];
      const isFocused = state.index === index;

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

      // Get icon name based on route
      let iconName: keyof typeof MaterialIcons.glyphMap = "timer";
      if (route.name === "index") iconName = "timer";
      else if (route.name === "history") iconName = "history";
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

      // Insert FAB after History tab (index 1)
      if (index === 1) {
        items.push(
          <Pressable
            key="fab"
            onPress={() => router.push("/manual-entry" as never)}
            style={[styles.fab, { backgroundColor: colors.fab }]}
            accessibilityRole="button"
            accessibilityLabel="Log a session manually"
          >
            <MaterialIcons name="add" size={28} color={colors.fabIcon} />
          </Pressable>
        );
      }
    });

    return items;
  };

  return (
    <View style={[styles.tabBar, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
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
        headerRight: () => (
          <Pressable
            onPress={() => router.push("/settings" as never)}
            style={{ marginRight: 16 }}
            accessibilityLabel="Settings"
          >
            <MaterialIcons name="settings" size={24} color={colors.icon} />
          </Pressable>
        ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Timer",
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: "History",
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="goals"
        options={{
          title: "Goals",
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: "Stats",
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: "row",
    borderTopWidth: 1,
    paddingBottom: 20,
    paddingTop: 8,
    alignItems: "center",
    justifyContent: "space-around",
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
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
