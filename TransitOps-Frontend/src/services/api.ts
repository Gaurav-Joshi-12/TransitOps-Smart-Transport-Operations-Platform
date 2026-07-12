import type {
  Vehicle, Driver, Trip, MaintenanceLog, FuelLog, Expense, User, Role,
} from "@/lib/types";
import { store } from "@/lib/store";

const API_BASE = "http://localhost:8080/api";

// ---------- MAPPERS ----------
function mapVehicle(v: any): Vehicle {
  return {
    id: String(v.id),
    regNo: v.regNo ?? "",
    name: v.name ?? "",
    type: v.type ?? "",
    maxLoadKg: v.maxLoadKg ?? 0,
    odometer: v.odometer ?? 0,
    acquisitionCost: v.acquisitionCost ?? 0,
    status: v.status ?? "Available",
    // pass through extra fields like region and revenue
    ...(v.region != null ? { region: v.region } : {}),
    ...(v.revenue != null ? { revenue: v.revenue } : {}),
  } as Vehicle & { region?: string; revenue?: number };
}

function mapDriver(d: any): Driver {
  return {
    id: String(d.id),
    name: d.name ?? "",
    licenseNo: d.licenseNo ?? "",
    licenseCategory: d.licenseCategory ?? "",
    licenseExpiry: d.licenseExpiry ?? "",
    contact: d.contact ?? "",
    safetyScore: d.safetyScore ?? 0,
    status: d.status ?? "Available",
  };
}

function mapTrip(t: any): Trip {
  return {
    id: String(t.id),
    source: t.source ?? "",
    destination: t.destination ?? "",
    vehicleId: String(t.vehicle?.id ?? t.vehicleId ?? ""),
    driverId: String(t.driver?.id ?? t.driverId ?? ""),
    cargoWeightKg: t.cargoWeightKg ?? 0,
    plannedDistance: t.plannedDistance ?? 0,
    status: t.status ?? "Draft",
    finalOdometer: t.finalOdometer ?? undefined,
    fuelConsumed: t.fuelConsumed ?? undefined,
  };
}

function mapMaintenance(m: any): MaintenanceLog {
  return {
    id: String(m.id),
    vehicleId: String(m.vehicle?.id ?? m.vehicleId ?? ""),
    description: m.description ?? "",
    cost: m.cost ?? 0,
    status: m.status ?? "Open",
    openedAt: m.openedAt ?? "",
    closedAt: m.closedAt ?? undefined,
  };
}

function mapFuel(f: any): FuelLog {
  return {
    id: String(f.id),
    vehicleId: String(f.vehicle?.id ?? f.vehicleId ?? ""),
    liters: f.liters ?? 0,
    cost: f.cost ?? 0,
    date: f.date ?? "",
  };
}

function mapExpense(e: any): Expense {
  return {
    id: String(e.id),
    vehicleId: String(e.vehicle?.id ?? e.vehicleId ?? ""),
    type: e.type ?? "",
    amount: e.amount ?? 0,
    date: e.date ?? "",
  };
}

// ---------- HTTP ----------
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

  if (res.status === 401 || res.status === 403) {
    // Token expired or no access — clear session
    if (typeof window !== "undefined") {
      localStorage.removeItem("transitops_token");
      localStorage.removeItem("transitops_user");
    }
    store.set({ currentUser: null });
    throw new Error(res.status === 401 ? "Session expired. Please log in again." : "You don't have permission to perform this action.");
  }

  if (!res.ok) {
    let errorMsg = `Request failed (${res.status})`;
    try {
      const errJson = await res.json();
      errorMsg = errJson.message || errJson.error || errorMsg;
    } catch { /* ignore */ }
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

    const token: string = data.token;
    const rawUser = data.user ?? data;

    const user: User = {
      id: String(rawUser.id),
      name: rawUser.name ?? email.split("@")[0],
      email: rawUser.email ?? email,
      role: rawUser.role as Role,
    };

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
    store.set({
      currentUser: null,
      vehicles: [],
      drivers: [],
      trips: [],
      maintenance: [],
      fuel: [],
      expenses: [],
    });
  },

  restore(): User | null {
    if (typeof window === "undefined") return null;
    const token = localStorage.getItem("transitops_token");
    const raw = localStorage.getItem("transitops_user");
    if (!token || !raw) return null;
    try {
      const user = JSON.parse(raw) as User;
      store.set({ currentUser: user });
      return user;
    } catch {
      localStorage.removeItem("transitops_token");
      localStorage.removeItem("transitops_user");
      return null;
    }
  },

  availableAccounts(): { email: string; role: Role; name: string }[] {
    return [
      { email: "fleetmanager@transitops.com", role: "FLEET_MANAGER" as Role, name: "Fleet Manager" },
      { email: "driver@transitops.com", role: "DRIVER" as Role, name: "Alex (Driver)" },
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
  const data = await fetchWithAuth("/vehicles", { method: "POST", body: JSON.stringify(v) });
  const mapped = mapVehicle(data);
  store.set((s) => ({ vehicles: [...s.vehicles, mapped] }));
  return mapped;
}

export async function updateVehicle(id: string, patch: Partial<Vehicle>) {
  const v = store.get().vehicles.find((x) => x.id === id);
  const data = await fetchWithAuth(`/vehicles/${id}`, {
    method: "PUT",
    body: JSON.stringify({ ...v, ...patch }),
  });
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
  const data = await fetchWithAuth("/drivers", { method: "POST", body: JSON.stringify(d) });
  const mapped = mapDriver(data);
  store.set((s) => ({ drivers: [...s.drivers, mapped] }));
  return mapped;
}

export async function updateDriver(id: string, patch: Partial<Driver>) {
  const d = store.get().drivers.find((x) => x.id === id);
  const data = await fetchWithAuth(`/drivers/${id}`, {
    method: "PUT",
    body: JSON.stringify({ ...d, ...patch }),
  });
  const mapped = mapDriver(data);
  store.set((s) => ({ drivers: s.drivers.map((x) => (x.id === id ? mapped : x)) }));
  return mapped;
}

export async function updateDriverStatus(id: string, status: string, safetyScore?: number) {
  const data = await fetchWithAuth(`/drivers/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status, safetyScore }),
  });
  const mapped = mapDriver(data);
  store.set((s) => ({ drivers: s.drivers.map((x) => (x.id === id ? mapped : x)) }));
  return mapped;
}

// ---------- TRIPS ----------
export async function getTrips(params?: { driverId?: string }) {
  let url = "/trips";
  if (params?.driverId) {
    url += `?driverId=${params.driverId}`;
  }
  const data = await fetchWithAuth(url);
  const mapped = data.map(mapTrip);
  store.set({ trips: mapped });
  return mapped;
}

export async function createTrip(t: Omit<Trip, "id" | "status">) {
  const payload = {
    source: t.source,
    destination: t.destination,
    cargoWeightKg: t.cargoWeightKg,
    plannedDistance: t.plannedDistance,
    vehicle: { id: Number(t.vehicleId) },
    driver: { id: Number(t.driverId) },
  };
  const data = await fetchWithAuth("/trips", { method: "POST", body: JSON.stringify(payload) });
  const mapped = mapTrip(data);
  store.set((s) => ({ trips: [...s.trips, mapped] }));
  return mapped;
}

export async function dispatchTrip(id: string) {
  await fetchWithAuth(`/trips/${id}/dispatch`, { method: "POST" });
  await Promise.allSettled([getTrips(), getVehicles(), getDrivers()]);
  return true;
}

export async function completeTrip(id: string, finalOdometer: number, fuelConsumed: number) {
  await fetchWithAuth(`/trips/${id}/complete`, {
    method: "POST",
    body: JSON.stringify({ finalOdometer, fuelConsumed }),
  });
  await Promise.allSettled([getTrips(), getVehicles(), getDrivers()]);
  return true;
}

export async function cancelTrip(id: string) {
  await fetchWithAuth(`/trips/${id}/cancel`, { method: "POST" });
  await Promise.allSettled([getTrips(), getVehicles(), getDrivers()]);
  return true;
}

// ---------- MAINTENANCE ----------
export async function getMaintenance() {
  const data = await fetchWithAuth("/maintenance");
  const mapped = data.map(mapMaintenance);
  store.set({ maintenance: mapped });
  return mapped;
}

export async function openMaintenance(vehicleId: string, description: string, cost: number) {
  const payload = { vehicle: { id: Number(vehicleId) }, description, cost };
  const data = await fetchWithAuth("/maintenance", { method: "POST", body: JSON.stringify(payload) });
  const mapped = mapMaintenance(data);
  store.set((s) => ({ maintenance: [...s.maintenance, mapped] }));
  await getVehicles();
  return mapped;
}

export async function closeMaintenance(id: string) {
  await fetchWithAuth(`/maintenance/${id}/close`, { method: "POST" });
  await Promise.allSettled([getMaintenance(), getVehicles()]);
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
  const payload = { vehicle: { id: Number(f.vehicleId) }, liters: f.liters, cost: f.cost, date: f.date };
  const data = await fetchWithAuth("/fuel-logs", { method: "POST", body: JSON.stringify(payload) });
  const mapped = mapFuel(data);
  store.set((s) => ({ fuel: [...s.fuel, mapped] }));
  return mapped;
}

export async function askChatbot(message: string) {
  return await fetchWithAuth("/chat", {
    method: "POST",
    body: JSON.stringify({ message }),
  });
}

export async function getExpenses() {
  const data = await fetchWithAuth("/expenses");
  const mapped = data.map(mapExpense);
  store.set({ expenses: mapped });
  return mapped;
}

export async function createExpense(e: Omit<Expense, "id">) {
  const payload = { vehicle: { id: Number(e.vehicleId) }, type: e.type, amount: e.amount, date: e.date };
  const data = await fetchWithAuth("/expenses", { method: "POST", body: JSON.stringify(payload) });
  const mapped = mapExpense(data);
  store.set((s) => ({ expenses: [...s.expenses, mapped] }));
  return mapped;
}

// ---------- DASHBOARD ----------
export async function getDashboardKpis(params?: { type?: string; status?: string; region?: string }) {
  const parts: string[] = [];
  if (params?.type && params.type.trim()) parts.push(`type=${encodeURIComponent(params.type)}`);
  if (params?.status && params.status.trim()) parts.push(`status=${encodeURIComponent(params.status)}`);
  if (params?.region && params.region.trim()) parts.push(`region=${encodeURIComponent(params.region)}`);
  const url = "/dashboard/kpis" + (parts.length > 0 ? "?" + parts.join("&") : "");
  return fetchWithAuth(url);
}

// ---------- REPORTS ----------
export async function getReportInsights(params?: { type?: string; status?: string; region?: string }) {
  const parts: string[] = [];
  if (params?.type && params.type.trim()) parts.push(`type=${encodeURIComponent(params.type)}`);
  if (params?.status && params.status.trim()) parts.push(`status=${encodeURIComponent(params.status)}`);
  if (params?.region && params.region.trim()) parts.push(`region=${encodeURIComponent(params.region)}`);
  const url = "/reports/insights" + (parts.length > 0 ? "?" + parts.join("&") : "");
  return fetchWithAuth(url, { method: "POST" });
}
