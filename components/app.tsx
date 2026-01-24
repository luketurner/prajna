import { AppState, AppStateContext, defaultState } from "@/hooks";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import * as SQLite from "expo-sqlite";
import { useImmer } from "use-immer";

export const queryClient = new QueryClient();

export const App = ({ children }: React.PropsWithChildren) => {
  // const existingState = window.localStorage.getItem(appStateKey);
  const [state, setState] = useImmer<AppState>(
    // existingState ? JSON.parse(existingState) : defaultState
    defaultState,
  );

  // useEffect(() => {
  //   if (state) {
  //     window.localStorage.setItem(appStateKey, JSON.stringify(state));
  //   }
  // }, [state]);
  return (
    <QueryClientProvider client={queryClient}>
      <SQLite.SQLiteProvider databaseName="bucket" onInit={migrate}>
        <AppStateContext.Provider value={[state, setState]}>
          {children}
        </AppStateContext.Provider>
      </SQLite.SQLiteProvider>
    </QueryClientProvider>
  );
};

async function migrate(db: SQLite.SQLiteDatabase) {
  await db.execAsync(`
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;
  DROP TABLE goals;

  CREATE TABLE IF NOT EXISTS goals (
    id INTEGER PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    year TEXT NOT NULL,
    target INTEGER NOT NULL,
    current INTEGER NOT NULL
  );

  INSERT INTO goals (name, year, target, current) VALUES ('Meditate', '2026', 60000, 0);
  `);
}
