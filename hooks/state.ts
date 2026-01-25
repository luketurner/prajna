import { createContext, useContext } from "react";
import { ImmerHook } from "use-immer";

export interface AppState {
  selectedGoal?: number;
}

export const defaultState: AppState = {
  selectedGoal: undefined,
};

export const AppStateContext = createContext<ImmerHook<AppState>>([
  defaultState,
  () => {},
]);

export const useAppState = () => {
  return useContext(AppStateContext);
};
