import type {
  Vehicle, Driver, Trip, MaintenanceLog, FuelLog, Expense, User, Role,
} from "@/lib/types";
import { store, uid } from "@/lib/store";
import { seedUsers } from "@/lib/mock-data";

// Simulated latency for realism (kept tiny for demo snappiness)
const delay = <T,>(v: T, ms = 120) => new Promise<T>((r) => setTimeout(() => r(v), ms));

// ---------- AUTH ----------
export const authService = {
  async login(email: string, _password: string): Promise<{ token: string; user: User }> {
    const user = seedUsers.find((u) => u.email.toLowerCase() === email.toLowerCase())
      ?? seedUsers[0];
    const token = "mock.jwt." + btoa(user.id + ":" + Date.now());
    if (typeof window !== "undefined") {
      localStorage.setItem("transitops_token", token);
      localStorage.setItem("transitops_user", JSON.stringify(user));
    }
    store.set({ currentUser: user });
    return delay({ token, user });
  },
  logout() {
    if (typeof window !== "undefined") {
      localStorage.removeItem("transitops_token");
      localStorage.removeItem("transitops_user");
    }
    store.set({ currentUser: null });
  },
  restore(): User | null {
    if (typeof window === "undefined") return null;
    const raw = localStorage.getItem("transitops_user");
    if (!raw) return null;
    try {
      const user = JSON.parse(raw) as User;
      store.set({ currentUser: user });
      return user;
    } catch {
      return null;
    }
  },
  availableAccounts(): { email: string; role: Role; name: string }[] {
    return seedUsers.map((u) => ({ email: u.email, role: u.role, name: u.name }));
  },
};

// ---------- VEHICLES ----------
export async function getVehicles() { return delay(store.get().vehicles); }
export async function createVehicle(v: Omit<Vehicle, "id">) {
  const dup = store.get().vehicles.some((x) => x.regNo.toLowerCase() === v.regNo.toLowerCase());
  if (dup) throw new Error("A vehicle with this registration number already exists.");
  const nv: Vehicle = { ...v, id: uid("v") };
  store.set((s) => ({ vehicles: [...s.vehicles, nv] }));
  return delay(nv);
}
export async function updateVehicle(id: string, patch: Partial<Vehicle>) {
  store.set((s) => ({ vehicles: s.vehicles.map((v) => (v.id === id ? { ...v, ...patch } : v)) }));
  return delay(store.get().vehicles.find((v) => v.id === id)!);
}

// ---------- DRIVERS ----------
export async function getDrivers() { return delay(store.get().drivers); }
export async function createDriver(d: Omit<Driver, "id">) {
  const nd: Driver = { ...d, id: uid("d") };
  store.set((s) => ({ drivers: [...s.drivers, nd] }));
  return delay(nd);
}
export async function updateDriver(id: string, patch: Partial<Driver>) {
  store.set((s) => ({ drivers: s.drivers.map((d) => (d.id === id ? { ...d, ...patch } : d)) }));
  return delay(store.get().drivers.find((d) => d.id === id)!);
}

// ---------- TRIPS ----------
export async function getTrips() { return delay(store.get().trips); }
export async function createTrip(t: Omit<Trip, "id" | "status">) {
  const nt: Trip = { ...t, id: uid("t"), status: "Draft" };
  store.set((s) => ({ trips: [...s.trips, nt] }));
  return delay(nt);
}
export async function dispatchTrip(id: string) {
  const trip = store.get().trips.find((t) => t.id === id);
  if (!trip) throw new Error("Trip not found");
  if (trip.status !== "Draft") throw new Error("Only Draft trips can be dispatched.");
  store.set((s) => ({
    trips: s.trips.map((t) => (t.id === id ? { ...t, status: "Dispatched" } : t)),
    vehicles: s.vehicles.map((v) => (v.id === trip.vehicleId ? { ...v, status: "On Trip" } : v)),
    drivers: s.drivers.map((d) => (d.id === trip.driverId ? { ...d, status: "On Trip" } : d)),
  }));
  return delay(true);
}
export async function completeTrip(id: string, finalOdometer: number, fuelConsumed: number) {
  const trip = store.get().trips.find((t) => t.id === id);
  if (!trip) throw new Error("Trip not found");
  if (trip.status !== "Dispatched") throw new Error("Only Dispatched trips can be completed.");
  store.set((s) => ({
    trips: s.trips.map((t) => (t.id === id
      ? { ...t, status: "Completed", finalOdometer, fuelConsumed } : t)),
    vehicles: s.vehicles.map((v) => (v.id === trip.vehicleId
      ? { ...v, status: "Available", odometer: finalOdometer } : v)),
    drivers: s.drivers.map((d) => (d.id === trip.driverId ? { ...d, status: "Available" } : d)),
  }));
  return delay(true);
}
export async function cancelTrip(id: string) {
  const trip = store.get().trips.find((t) => t.id === id);
  if (!trip) throw new Error("Trip not found");
  if (trip.status !== "Dispatched") throw new Error("Only Dispatched trips can be cancelled.");
  store.set((s) => ({
    trips: s.trips.map((t) => (t.id === id ? { ...t, status: "Cancelled" } : t)),
    vehicles: s.vehicles.map((v) => (v.id === trip.vehicleId ? { ...v, status: "Available" } : v)),
    drivers: s.drivers.map((d) => (d.id === trip.driverId ? { ...d, status: "Available" } : d)),
  }));
  return delay(true);
}

// ---------- MAINTENANCE ----------
export async function getMaintenance() { return delay(store.get().maintenance); }
export async function openMaintenance(vehicleId: string, description: string) {
  const veh = store.get().vehicles.find((v) => v.id === vehicleId);
  if (!veh) throw new Error("Vehicle not found");
  if (veh.status === "Retired") throw new Error("Retired vehicle cannot enter maintenance.");
  const log: MaintenanceLog = {
    id: uid("m"), vehicleId, description, status: "Open",
    openedAt: new Date().toISOString().slice(0, 10),
  };
  store.set((s) => ({
    maintenance: [...s.maintenance, log],
    vehicles: s.vehicles.map((v) => (v.id === vehicleId ? { ...v, status: "In Shop" } : v)),
  }));
  return delay(log);
}
export async function closeMaintenance(id: string) {
  const log = store.get().maintenance.find((m) => m.id === id);
  if (!log) throw new Error("Log not found");
  store.set((s) => ({
    maintenance: s.maintenance.map((m) => (m.id === id
      ? { ...m, status: "Closed", closedAt: new Date().toISOString().slice(0, 10) } : m)),
    vehicles: s.vehicles.map((v) => {
      if (v.id !== log.vehicleId) return v;
      if (v.status === "Retired") return v;
      return { ...v, status: "Available" };
    }),
  }));
  return delay(true);
}

// ---------- FUEL / EXPENSES ----------
export async function getFuelLogs() { return delay(store.get().fuel); }
export async function createFuelLog(f: Omit<FuelLog, "id">) {
  const nf: FuelLog = { ...f, id: uid("f") };
  store.set((s) => ({ fuel: [...s.fuel, nf] }));
  return delay(nf);
}
export async function getExpenses() { return delay(store.get().expenses); }
export async function createExpense(e: Omit<Expense, "id">) {
  const ne: Expense = { ...e, id: uid("e") };
  store.set((s) => ({ expenses: [...s.expenses, ne] }));
  return delay(ne);
}
