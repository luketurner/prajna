import { Text, View } from "react-native";
import { useGoals } from "../hooks";

export default function Home() {
  const { data: goals } = useGoals();
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Text>{JSON.stringify(goals)}</Text>
    </View>
  );
}
