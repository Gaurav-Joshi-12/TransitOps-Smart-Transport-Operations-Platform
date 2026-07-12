import { useSyncExternalStore } from "react";
import type {
  User, Vehicle, Driver, Trip, MaintenanceLog, FuelLog, Expense,
} from "./types";

interface State {
  currentUser: User | null;
  vehicles: Vehicle[];
  drivers: Driver[];
  trips: Trip[];
  maintenance: MaintenanceLog[];
  fuel: FuelLog[];
  expenses: Expense[];
}

let state: State = {
  currentUser: null,
  vehicles: [],
  drivers: [],
  trips: [],
  maintenance: [],
  fuel: [],
  expenses: [],
};

const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export const store = {
  get: () => state,
  set: (patch: Partial<State> | ((s: State) => Partial<State>)) => {
    const p = typeof patch === "function" ? patch(state) : patch;
    state = { ...state, ...p };
    emit();
  },
  subscribe: (l: () => void) => {
    listeners.add(l);
    return () => listeners.delete(l);
  },
};

export function useStore<T>(selector: (s: State) => T): T {
  return useSyncExternalStore(
    store.subscribe,
    () => selector(state),
    () => selector(state),
  );
}

export const uid = (p = "id") => `${p}_${Math.random().toString(36).slice(2, 9)}`;
