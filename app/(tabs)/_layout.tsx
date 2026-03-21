import { FabricBackground } from "@/components/FabricBackground";
import { GoldShimmer } from "@/components/GoldShimmer";
import { Colors } from "@/constants/Colors";
import { MaterialIcons } from "@expo/vector-icons";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { type Theme, ThemeProvider } from "@react-navigation/native";
import { Tabs } from "expo-router";
import { Pressable, StyleSheet, useColorScheme, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const insets = useSafeAreaInsets();

  // Tab bar order: [stats] [history] [TIMER FAB] [goals] [settings]
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
      else if (route.name === "settings") iconName = "settings";

      items.push(
        <Pressable
          key={route.key}
          onPress={onPress}
          style={styles.tabItem}
          accessibilityRole="button"
          accessibilityState={isFocused ? { selected: true } : {}}
          accessibilityLabel={options.tabBarAccessibilityLabel}
        >
          <GoldShimmer mode="icon" disabled={!isFocused}>
            <MaterialIcons
              name={iconName}
              size={24}
              color={isFocused ? "#000" : colors.tabIconDefault}
            />
          </GoldShimmer>
        </Pressable>,
      );

      // Insert Timer FAB after History tab
      if (route.name === "history") {
        items.push(
          <GoldShimmer
            key="fab"
            mode="view"
            style={[styles.fab, { borderRadius: 28 }]}
          >
            <Pressable
              onPress={() => navigation.navigate("index")}
              style={styles.fabInner}
              accessibilityRole="button"
              accessibilityLabel="Timer"
            >
              <MaterialIcons name="timer" size={28} color={colors.headerBar} />
            </Pressable>
          </GoldShimmer>,
        );
      }
    });

    return items;
  };

  return (
    <View
      style={[
        styles.tabBar,
        {
          backgroundColor: colors.headerBar,
          borderTopColor: colors.headerBarBorder,
          paddingBottom: Math.max(insets.bottom, 8),
        },
      ]}
    >
      {renderItems()}
    </View>
  );
}

export default function TabLayout() {
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];

  const transparentTheme: Theme = {
    dark: true,
    colors: {
      primary: colors.tint,
      background: "transparent",
      card: colors.headerBar,
      text: colors.text,
      border: colors.border,
      notification: colors.tint,
    },
    fonts: {
      regular: { fontFamily: "System", fontWeight: "400" },
      medium: { fontFamily: "System", fontWeight: "500" },
      bold: { fontFamily: "System", fontWeight: "700" },
      heavy: { fontFamily: "System", fontWeight: "900" },
    },
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <FabricBackground />
      <ThemeProvider value={transparentTheme}>
        <Tabs
          tabBar={(props) => <CustomTabBar {...props} />}
          screenOptions={{
            headerShown: false,
          }}
        >
          <Tabs.Screen
            name="index"
            options={{
              title: "Meditation Timer",
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
              title: "Past Sessions",
            }}
          />
          <Tabs.Screen
            name="goals"
            options={{
              title: "Goals",
            }}
          />
          <Tabs.Screen
            name="settings"
            options={{
              title: "Settings",
            }}
          />
        </Tabs>
      </ThemeProvider>
    </View>
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
    paddingTop: 8,
    paddingBottom: 12,
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
  fabInner: {
    width: 56,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
  },
});
