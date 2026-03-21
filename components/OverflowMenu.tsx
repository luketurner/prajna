import { Colors } from "@/constants/Colors";
import { MaterialIcons } from "@expo/vector-icons";
import {
  Modal,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";

interface OverflowMenuItem {
  label: string;
  icon?: keyof typeof MaterialIcons.glyphMap;
  onPress: () => void;
}

interface OverflowMenuProps {
  visible: boolean;
  onClose: () => void;
  items: OverflowMenuItem[];
}

export function OverflowMenu({ visible, onClose, items }: OverflowMenuProps) {
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const statusBarHeight = StatusBar.currentHeight ?? 0;
  const headerBarHeight = 56;
  const menuTop = statusBarHeight + headerBarHeight;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <View
          style={[
            styles.menu,
            {
              marginTop: menuTop,
              backgroundColor: colors.background,
              borderColor: colors.border,
            },
          ]}
        >
          {items.map((item, index) => (
            <Pressable
              key={index}
              onPress={() => {
                onClose();
                item.onPress();
              }}
              style={({ pressed }) => [
                styles.menuItem,
                pressed && { opacity: 0.6 },
                index < items.length - 1 && {
                  borderBottomWidth: StyleSheet.hairlineWidth,
                  borderBottomColor: colors.border,
                },
              ]}
            >
              {item.icon && (
                <MaterialIcons name={item.icon} size={20} color={colors.text} />
              )}
              <Text style={[styles.menuItemText, { color: colors.text }]}>
                {item.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: "flex-end",
  },
  menu: {
    marginRight: 2,
    borderWidth: 1,
    minWidth: 160,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: "500",
  },
});
