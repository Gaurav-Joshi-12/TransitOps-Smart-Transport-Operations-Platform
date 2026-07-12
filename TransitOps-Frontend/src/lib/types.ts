export type Role = "FLEET_MANAGER" | "DRIVER" | "SAFETY_OFFICER" | "FINANCIAL_ANALYST";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export type VehicleStatus = "Available" | "On Trip" | "In Shop" | "Retired";
export interface Vehicle {
  id: string;
  regNo: string;
  name: string;
  type: string;
  maxLoadKg: number;
  odometer: number;
  acquisitionCost: number;
  status: VehicleStatus;
  region?: string;
  revenue?: number;
}

export type DriverStatus = "Available" | "On Trip" | "Off Duty" | "Suspended";
export interface Driver {
  id: string;
  name: string;
  licenseNo: string;
  licenseCategory: string;
  licenseExpiry: string;
  contact: string;
  safetyScore: number;
  status: DriverStatus;
}

export type TripStatus = "Draft" | "Dispatched" | "Completed" | "Cancelled";
export interface Trip {
  id: string;
  source: string;
  destination: string;
  vehicleId: string;
  driverId: string;
  cargoWeightKg: number;
  plannedDistance: number;
  status: TripStatus;
  finalOdometer?: number;
  fuelConsumed?: number;
}

export type MaintenanceStatus = "Open" | "Closed";
export interface MaintenanceLog {
  id: string;
  vehicleId: string;
  description: string;
  cost: number;
  status: MaintenanceStatus;
  openedAt: string;
  closedAt?: string;
}

export interface FuelLog {
  id: string;
  vehicleId: string;
  liters: number;
  cost: number;
  date: string;
}

export interface Expense {
  id: string;
  vehicleId: string;
  type: string;
  amount: number;
  date: string;
}
