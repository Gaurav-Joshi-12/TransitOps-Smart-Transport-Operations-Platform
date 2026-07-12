import type { Vehicle, Driver, Trip, MaintenanceLog, FuelLog, Expense, User } from "./types";


export const seedUsers: User[] = [
  { id: "u1", name: "Fiona Manager", email: "fleet@transitops.io", role: "FLEET_MANAGER" },
  { id: "u2", name: "Alex Driver", email: "driver@transitops.io", role: "DRIVER" },
  { id: "u3", name: "Sam Safety", email: "safety@transitops.io", role: "SAFETY_OFFICER" },
  { id: "u4", name: "Priya Finance", email: "finance@transitops.io", role: "FINANCIAL_ANALYST" },
];

export const seedVehicles: Vehicle[] = [
  { id: "v1", regNo: "MH-01-VN-0501", name: "Van-05", type: "Cargo Van", maxLoadKg: 500, odometer: 48210, acquisitionCost: 1800000, status: "Available" },
  { id: "v2", regNo: "MH-01-TR-1204", name: "Truck-12", type: "Heavy Truck", maxLoadKg: 8000, odometer: 132540, acquisitionCost: 4200000, status: "On Trip" },
  { id: "v3", regNo: "MH-01-VN-0322", name: "Van-03", type: "Cargo Van", maxLoadKg: 500, odometer: 61230, acquisitionCost: 1750000, status: "In Shop" },
  { id: "v4", regNo: "MH-01-PU-0810", name: "Pickup-08", type: "Pickup", maxLoadKg: 1200, odometer: 22150, acquisitionCost: 1350000, status: "Available" },
  { id: "v5", regNo: "MH-01-VN-0199", name: "Van-01", type: "Cargo Van", maxLoadKg: 500, odometer: 210000, acquisitionCost: 1500000, status: "Retired" },
];

const today = new Date();
const inDays = (d: number) => new Date(today.getTime() + d * 86400000).toISOString().slice(0, 10);

export const seedDrivers: Driver[] = [
  { id: "d1", name: "Alex Kumar", licenseNo: "DL-MH-A2381", licenseCategory: "LMV", licenseExpiry: inDays(420), contact: "+91 98200 11111", safetyScore: 92, status: "Available" },
  { id: "d2", name: "Ravi Shah", licenseNo: "DL-MH-B7712", licenseCategory: "HMV", licenseExpiry: inDays(180), contact: "+91 98200 22222", safetyScore: 88, status: "On Trip" },
  { id: "d3", name: "Meera Iyer", licenseNo: "DL-MH-C4409", licenseCategory: "LMV", licenseExpiry: inDays(-20), contact: "+91 98200 33333", safetyScore: 74, status: "Available" },
  { id: "d4", name: "Karan Patel", licenseNo: "DL-MH-D9021", licenseCategory: "HMV", licenseExpiry: inDays(15), contact: "+91 98200 44444", safetyScore: 65, status: "Suspended" },
  { id: "d5", name: "Nisha Verma", licenseNo: "DL-MH-E5567", licenseCategory: "LMV", licenseExpiry: inDays(700), contact: "+91 98200 55555", safetyScore: 95, status: "Off Duty" },
];

export const seedTrips: Trip[] = [
  { id: "t1", source: "Mumbai DC", destination: "Pune Hub", vehicleId: "v2", driverId: "d2", cargoWeightKg: 6500, plannedDistance: 148, status: "Dispatched" },
  { id: "t2", source: "Mumbai DC", destination: "Nashik", vehicleId: "v1", driverId: "d1", cargoWeightKg: 380, plannedDistance: 165, status: "Completed", finalOdometer: 48210, fuelConsumed: 22 },
  { id: "t3", source: "Pune Hub", destination: "Kolhapur", vehicleId: "v4", driverId: "d5", cargoWeightKg: 950, plannedDistance: 235, status: "Draft" },
  { id: "t4", source: "Mumbai DC", destination: "Surat", vehicleId: "v1", driverId: "d1", cargoWeightKg: 420, plannedDistance: 285, status: "Completed", finalOdometer: 47800, fuelConsumed: 41 },
];

export const seedMaintenance: MaintenanceLog[] = [
  { id: "m1", vehicleId: "v3", description: "Brake pad replacement + alignment", status: "Open", openedAt: inDays(-4) },
  { id: "m2", vehicleId: "v2", description: "Scheduled 100k service", status: "Closed", openedAt: inDays(-40), closedAt: inDays(-35) },
];

export const seedFuel: FuelLog[] = [
  { id: "f1", vehicleId: "v1", liters: 22, cost: 2200, date: inDays(-2) },
  { id: "f2", vehicleId: "v1", liters: 41, cost: 4100, date: inDays(-14) },
  { id: "f3", vehicleId: "v2", liters: 180, cost: 18000, date: inDays(-5) },
  { id: "f4", vehicleId: "v4", liters: 55, cost: 5500, date: inDays(-8) },
];

export const seedExpenses: Expense[] = [
  { id: "e1", vehicleId: "v1", type: "Toll", amount: 450, date: inDays(-2) },
  { id: "e2", vehicleId: "v2", type: "Insurance", amount: 12000, date: inDays(-20) },
  { id: "e3", vehicleId: "v3", type: "Parts", amount: 8500, date: inDays(-4) },
];
