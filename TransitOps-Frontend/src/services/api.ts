import type {
  Vehicle, Driver, Trip, MaintenanceLog, FuelLog, Expense, User, Role,
} from "@/lib/types";
import { store } from "@/lib/store";

const API_BASE = "http://localhost:8080/api";

function toFrontendStatus(s: string) {
  if (!s) return s;
  return s.split('_').map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(' ');
}
function toBackendStatus(s: string) {
  if (!s) return s;
  return s.toUpperCase().replace(/ /g, '_');
}

function mapVehicle(v: any): Vehicle {
  return { ...v, id: String(v.id), status: toFrontendStatus(v.status) };
}
function unmapVehicle(v: any): any {
  return { ...v, status: toBackendStatus(v.status) };
}
function mapDriver(d: any): Driver {
  return { ...d, id: String(d.id), status: toFrontendStatus(d.status) };
}
function unmapDriver(d: any): any {
  return { ...d, status: toBackendStatus(d.status) };
}
function mapTrip(t: any): Trip {
  return { ...t, id: String(t.id), status: toFrontendStatus(t.status), vehicleId: String(t.vehicle?.id), driverId: String(t.driver?.id) };
}
function mapMaintenance(m: any): MaintenanceLog {
  return { ...m, id: String(m.id), status: toFrontendStatus(m.status), vehicleId: String(m.vehicle?.id) };
}
function mapFuel(f: any): FuelLog {
  return { ...f, id: String(f.id), vehicleId: String(f.vehicle?.id) };
}
function mapExpense(e: any): Expense {
  return { ...e, id: String(e.id), vehicleId: String(e.vehicle?.id) };
}

async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  const token = typeof window !== "undefined" ? localStorage.getItem("transitops_token") : null;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  const res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
  if (!res.ok) {
    let errorMsg = "API Error";
    try {
      const errJson = await res.json();
      errorMsg = errJson.message || errorMsg;
    } catch {}
    throw new Error(errorMsg);
  }
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

// ---------- AUTH ----------
export const authService = {
  async login(email: string, password: string): Promise<{ token: string; user: User }> {
    const data = await fetchWithAuth("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    const { token, user } = data;
    user.id = String(user.id);
    if (typeof window !== "undefined") {
      localStorage.setItem("transitops_token", token);
      localStorage.setItem("transitops_user", JSON.stringify(user));
    }
    store.set({ currentUser: user });
    return { token, user };
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
    return [
      { email: "fleetmanager@transitops.com", role: "FLEET_MANAGER" as Role, name: "Fleet Manager" },
      { email: "driver@transitops.com", role: "DRIVER" as Role, name: "Driver User" },
      { email: "safety@transitops.com", role: "SAFETY_OFFICER" as Role, name: "Safety Officer" },
      { email: "finance@transitops.com", role: "FINANCIAL_ANALYST" as Role, name: "Finance Analyst" },
    ];
  },
};

// ---------- VEHICLES ----------
export async function getVehicles() {
  const data = await fetchWithAuth("/vehicles");
  const mapped = data.map(mapVehicle);
  store.set({ vehicles: mapped });
  return mapped;
}
export async function createVehicle(v: Omit<Vehicle, "id">) {
  const data = await fetchWithAuth("/vehicles", { method: "POST", body: JSON.stringify(unmapVehicle(v)) });
  const mapped = mapVehicle(data);
  store.set((s) => ({ vehicles: [...s.vehicles, mapped] }));
  return mapped;
}
export async function updateVehicle(id: string, patch: Partial<Vehicle>) {
  const v = store.get().vehicles.find(x => x.id === id);
  const data = await fetchWithAuth(`/vehicles/${id}`, { method: "PUT", body: JSON.stringify(unmapVehicle({ ...v, ...patch })) });
  const mapped = mapVehicle(data);
  store.set((s) => ({ vehicles: s.vehicles.map((x) => (x.id === id ? mapped : x)) }));
  return mapped;
}

// ---------- DRIVERS ----------
export async function getDrivers() {
  const data = await fetchWithAuth("/drivers");
  const mapped = data.map(mapDriver);
  store.set({ drivers: mapped });
  return mapped;
}
export async function createDriver(d: Omit<Driver, "id">) {
  const data = await fetchWithAuth("/drivers", { method: "POST", body: JSON.stringify(unmapDriver(d)) });
  const mapped = mapDriver(data);
  store.set((s) => ({ drivers: [...s.drivers, mapped] }));
  return mapped;
}
export async function updateDriver(id: string, patch: Partial<Driver>) {
  const d = store.get().drivers.find(x => x.id === id);
  const data = await fetchWithAuth(`/drivers/${id}`, { method: "PUT", body: JSON.stringify(unmapDriver({ ...d, ...patch })) });
  const mapped = mapDriver(data);
  store.set((s) => ({ drivers: s.drivers.map((x) => (x.id === id ? mapped : x)) }));
  return mapped;
}

// ---------- TRIPS ----------
export async function getTrips() {
  const data = await fetchWithAuth("/trips");
  const mapped = data.map(mapTrip);
  store.set({ trips: mapped });
  return mapped;
}
export async function createTrip(t: Omit<Trip, "id" | "status">) {
  const payload = { ...t, vehicle: { id: t.vehicleId }, driver: { id: t.driverId } };
  const data = await fetchWithAuth("/trips", { method: "POST", body: JSON.stringify(payload) });
  const mapped = mapTrip(data);
  store.set((s) => ({ trips: [...s.trips, mapped] }));
  return mapped;
}
export async function dispatchTrip(id: string) {
  await fetchWithAuth(`/trips/${id}/dispatch`, { method: "POST" });
  await Promise.all([getTrips(), getVehicles(), getDrivers()]);
  return true;
}
export async function completeTrip(id: string, finalOdometer: number, fuelConsumed: number) {
  await fetchWithAuth(`/trips/${id}/complete`, { method: "POST", body: JSON.stringify({ finalOdometer, fuelConsumed }) });
  await Promise.all([getTrips(), getVehicles(), getDrivers()]);
  return true;
}
export async function cancelTrip(id: string) {
  await fetchWithAuth(`/trips/${id}/cancel`, { method: "POST" });
  await Promise.all([getTrips(), getVehicles(), getDrivers()]);
  return true;
}

// ---------- MAINTENANCE ----------
export async function getMaintenance() {
  const data = await fetchWithAuth("/maintenance");
  const mapped = data.map(mapMaintenance);
  store.set({ maintenance: mapped });
  return mapped;
}
export async function openMaintenance(vehicleId: string, description: string) {
  const payload = { vehicle: { id: vehicleId }, description, cost: 0 };
  const data = await fetchWithAuth("/maintenance", { method: "POST", body: JSON.stringify(payload) });
  const mapped = mapMaintenance(data);
  store.set((s) => ({ maintenance: [...s.maintenance, mapped] }));
  await getVehicles();
  return mapped;
}
export async function closeMaintenance(id: string) {
  await fetchWithAuth(`/maintenance/${id}/close`, { method: "POST" });
  await Promise.all([getMaintenance(), getVehicles()]);
  return true;
}

// ---------- FUEL / EXPENSES ----------
export async function getFuelLogs() {
  const data = await fetchWithAuth("/fuel-logs");
  const mapped = data.map(mapFuel);
  store.set({ fuel: mapped });
  return mapped;
}
export async function createFuelLog(f: Omit<FuelLog, "id">) {
  const payload = { ...f, vehicle: { id: f.vehicleId } };
  const data = await fetchWithAuth("/fuel-logs", { method: "POST", body: JSON.stringify(payload) });
  const mapped = mapFuel(data);
  store.set((s) => ({ fuel: [...s.fuel, mapped] }));
  return mapped;
}
export async function getExpenses() {
  const data = await fetchWithAuth("/expenses");
  const mapped = data.map(mapExpense);
  store.set({ expenses: mapped });
  return mapped;
}
export async function createExpense(e: Omit<Expense, "id">) {
  const payload = { ...e, vehicle: { id: e.vehicleId } };
  const data = await fetchWithAuth("/expenses", { method: "POST", body: JSON.stringify(payload) });
  const mapped = mapExpense(data);
  store.set((s) => ({ expenses: [...s.expenses, mapped] }));
  return mapped;
}
