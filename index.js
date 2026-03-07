import { registerForegroundService } from "./services/foreground-timer";

// Register the Notifee foreground service handler before the app starts.
// This must happen at the top level, outside of any React component.
registerForegroundService();

// Import the default Expo Router entry point
import "expo-router/entry";
