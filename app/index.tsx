import * as SQLite from "expo-sqlite";
import { Text, View } from "react-native";

async function migrate(db: SQLite.SQLiteDatabase) {
  await db.execAsync(`
  PRAGMA journal_mode = WAL;
  CREATE TABLE IF NOT EXISTS goals (
    id INTEGER PRIMARY KEY NOT NULL,
    name TEXT NOT NULL
  );

  INSERT INTO goals (name) VALUES ('Test goal');
  `);
}

export function DebugText() {
  const db = SQLite.useSQLiteContext();
  const results = db.getAllSync(`select * from goals`);
  const data = JSON.stringify(results);
  return <Text>{data}</Text>;
}

export default function Index() {
  return (
    <SQLite.SQLiteProvider databaseName="bucket" onInit={migrate}>
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <DebugText />
        <Text>Edit app/index.tsx to edit this screen.</Text>
      </View>
    </SQLite.SQLiteProvider>
  );
}
