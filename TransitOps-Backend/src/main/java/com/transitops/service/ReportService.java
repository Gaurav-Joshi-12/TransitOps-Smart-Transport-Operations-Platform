package com.transitops.service;

import com.transitops.dto.DashboardKpis;
import com.transitops.entity.FuelLog;
import com.transitops.entity.MaintenanceLog;
import com.transitops.entity.Trip;
import com.transitops.entity.Vehicle;
import com.transitops.entity.Driver;
import com.transitops.entity.Expense;
import com.transitops.enums.DriverStatus;
import com.transitops.enums.TripStatus;
import com.transitops.enums.VehicleStatus;
import com.transitops.repository.*;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class ReportService {

    private final VehicleRepository vehicleRepository;
    private final DriverRepository driverRepository;
    private final TripRepository tripRepository;
    private final MaintenanceLogRepository maintenanceRepository;
    private final FuelLogRepository fuelRepository;
    private final ExpenseRepository expenseRepository;

    public ReportService(VehicleRepository vehicleRepository, DriverRepository driverRepository, TripRepository tripRepository, MaintenanceLogRepository maintenanceRepository, FuelLogRepository fuelRepository, ExpenseRepository expenseRepository) {
        this.vehicleRepository = vehicleRepository;
        this.driverRepository = driverRepository;
        this.tripRepository = tripRepository;
        this.maintenanceRepository = maintenanceRepository;
        this.fuelRepository = fuelRepository;
        this.expenseRepository = expenseRepository;
    }

    public DashboardKpis getDashboardKpis(String type, VehicleStatus status, String region) {
        List<Vehicle> allVehicles = vehicleRepository.findAll();
        
        List<Vehicle> vehicles = allVehicles.stream()
                .filter(v -> type == null || type.trim().isEmpty() || v.getType().equalsIgnoreCase(type))
                .filter(v -> status == null || v.getStatus() == status)
                .filter(v -> region == null || region.trim().isEmpty() || v.getRegion().equalsIgnoreCase(region))
                .collect(Collectors.toList());

        long activeVehicles = vehicles.stream().filter(v -> v.getStatus() != VehicleStatus.RETIRED).count();
        long availableVehicles = vehicles.stream().filter(v -> v.getStatus() == VehicleStatus.AVAILABLE).count();
        long vehiclesInMaintenance = vehicles.stream().filter(v -> v.getStatus() == VehicleStatus.IN_SHOP).count();

        long onTripVehicles = vehicles.stream().filter(v -> v.getStatus() == VehicleStatus.ON_TRIP).count();
        double fleetUtilizationPercent = activeVehicles == 0 ? 0.0 : ((double) onTripVehicles / activeVehicles) * 100.0;

        List<Trip> allTrips = tripRepository.findAll();
        List<Trip> trips = allTrips;
        if (type != null || status != null || region != null) {
            Set<Long> allowedVehicleIds = vehicles.stream().map(Vehicle::getId).collect(Collectors.toSet());
            trips = allTrips.stream()
                    .filter(t -> t.getVehicle() != null && allowedVehicleIds.contains(t.getVehicle().getId()))
                    .collect(Collectors.toList());
        }

        long activeTrips = trips.stream().filter(t -> t.getStatus() == TripStatus.DISPATCHED).count();
        long pendingTrips = trips.stream().filter(t -> t.getStatus() == TripStatus.DRAFT).count();

        List<Driver> allDrivers = driverRepository.findAll();
        long driversOnDuty = 0;
        if (type != null || status != null || region != null) {
            Set<Long> onTripDriverIds = trips.stream()
                    .filter(t -> t.getStatus() == TripStatus.DISPATCHED && t.getDriver() != null)
                    .map(t -> t.getDriver().getId())
                    .collect(Collectors.toSet());
            driversOnDuty = allDrivers.stream()
                    .filter(d -> d.getStatus() == DriverStatus.ON_TRIP && onTripDriverIds.contains(d.getId()))
                    .count();
        } else {
            driversOnDuty = allDrivers.stream().filter(d -> d.getStatus() == DriverStatus.ON_TRIP).count();
        }

        return new DashboardKpis(activeVehicles, availableVehicles, vehiclesInMaintenance, activeTrips, pendingTrips, driversOnDuty, fleetUtilizationPercent);
    }

    public List<Map<String, Object>> getFuelEfficiency() {
        return vehicleRepository.findAll().stream().map(v -> {
            List<Trip> vTrips = tripRepository.findAll().stream()
                    .filter(t -> t.getVehicle() != null && t.getVehicle().getId().equals(v.getId()) && t.getStatus() == TripStatus.COMPLETED)
                    .collect(Collectors.toList());
            
            double totalDistance = vTrips.stream().mapToDouble(t -> t.getPlannedDistance() != null ? t.getPlannedDistance() : 0.0).sum();
            double totalFuel = vTrips.stream().mapToDouble(t -> t.getFuelConsumed() != null ? t.getFuelConsumed() : 0.0).sum();
            
            Map<String, Object> map = new HashMap<>();
            map.put("vehicleId", v.getId());
            map.put("regNo", v.getRegNo());
            map.put("distance", totalDistance);
            map.put("fuel", totalFuel);
            map.put("efficiency", totalFuel > 0 ? totalDistance / totalFuel : 0);
            return map;
        }).collect(Collectors.toList());
    }

    public List<Map<String, Object>> getFleetUtilization() {
        return vehicleRepository.findAll().stream().map(v -> {
            Map<String, Object> map = new HashMap<>();
            map.put("vehicleId", v.getId());
            map.put("regNo", v.getRegNo());
            map.put("status", v.getStatus());
            return map;
        }).collect(Collectors.toList());
    }

    public List<Map<String, Object>> getOperationalCost() {
        return vehicleRepository.findAll().stream().map(v -> {
            List<FuelLog> fuelLogs = fuelRepository.findByVehicleId(v.getId());
            List<MaintenanceLog> maintLogs = maintenanceRepository.findByVehicleId(v.getId());
            
            BigDecimal fuelCost = fuelLogs.stream().map(FuelLog::getCost).filter(c -> c != null).reduce(BigDecimal.ZERO, BigDecimal::add);
            BigDecimal maintCost = maintLogs.stream().map(MaintenanceLog::getCost).filter(c -> c != null).reduce(BigDecimal.ZERO, BigDecimal::add);
            
            Map<String, Object> map = new HashMap<>();
            map.put("vehicleId", v.getId());
            map.put("regNo", v.getRegNo());
            map.put("fuelCost", fuelCost);
            map.put("maintenanceCost", maintCost);
            map.put("totalCost", fuelCost.add(maintCost));
            return map;
        }).collect(Collectors.toList());
    }

    public List<Map<String, Object>> getOperationalCostByRegion(String region) {
        return getOperationalCost().stream()
                .filter(m -> {
                    Vehicle v = vehicleRepository.findById((Long) m.get("vehicleId")).orElse(null);
                    return v != null && v.getRegion() != null && v.getRegion().equalsIgnoreCase(region);
                }).collect(Collectors.toList());
    }

    public List<Map<String, Object>> getVehicleRoi() {
        return vehicleRepository.findAll().stream().map(v -> {
            List<FuelLog> fuelLogs = fuelRepository.findByVehicleId(v.getId());
            List<MaintenanceLog> maintLogs = maintenanceRepository.findByVehicleId(v.getId());
            
            BigDecimal fuelCost = fuelLogs.stream().map(FuelLog::getCost).filter(c -> c != null).reduce(BigDecimal.ZERO, BigDecimal::add);
            BigDecimal maintCost = maintLogs.stream().map(MaintenanceLog::getCost).filter(c -> c != null).reduce(BigDecimal.ZERO, BigDecimal::add);
            BigDecimal totalCost = fuelCost.add(maintCost);
            
            BigDecimal revenue = v.getRevenue() != null ? v.getRevenue() : BigDecimal.ZERO;
            BigDecimal acquisitionCost = v.getAcquisitionCost() != null && v.getAcquisitionCost().compareTo(BigDecimal.ZERO) > 0 
                ? v.getAcquisitionCost() : BigDecimal.ONE;
            
            BigDecimal roi = revenue.subtract(totalCost).divide(acquisitionCost, 4, java.math.RoundingMode.HALF_UP);
            
            Map<String, Object> map = new HashMap<>();
            map.put("vehicleId", v.getId());
            map.put("regNo", v.getRegNo());
            map.put("revenue", revenue);
            map.put("totalCost", totalCost);
            map.put("roi", roi);
            return map;
        }).collect(Collectors.toList());
    }

    public Map<String, Object> getVehicleRoiByRegNo(String regNo) {
        return getVehicleRoi().stream()
                .filter(m -> regNo.equalsIgnoreCase((String) m.get("regNo")))
                .findFirst()
                .orElse(null);
    }

    public String exportCsv(String type) {
        StringBuilder sb = new StringBuilder();
        if ("vehicles".equalsIgnoreCase(type)) {
            sb.append("ID,Registration No,Name,Type,Max Load (kg),Odometer (km),Acquisition Cost,Region,Revenue,Status\n");
            for (Vehicle v : vehicleRepository.findAll()) {
                sb.append(v.getId()).append(",")
                  .append(escapeCsv(v.getRegNo())).append(",")
                  .append(escapeCsv(v.getName())).append(",")
                  .append(escapeCsv(v.getType())).append(",")
                  .append(v.getMaxLoadKg()).append(",")
                  .append(v.getOdometer()).append(",")
                  .append(v.getAcquisitionCost()).append(",")
                  .append(escapeCsv(v.getRegion())).append(",")
                  .append(v.getRevenue()).append(",")
                  .append(v.getStatus() != null ? v.getStatus().getLabel() : "").append("\n");
            }
        } else if ("trips".equalsIgnoreCase(type)) {
            sb.append("ID,Source,Destination,Vehicle ID,Driver ID,Cargo Weight (kg),Planned Distance (km),Status,Final Odometer (km),Fuel Consumed (L)\n");
            for (Trip t : tripRepository.findAll()) {
                sb.append(t.getId()).append(",")
                  .append(escapeCsv(t.getSource())).append(",")
                  .append(escapeCsv(t.getDestination())).append(",")
                  .append(t.getVehicle() != null ? t.getVehicle().getId() : "").append(",")
                  .append(t.getDriver() != null ? t.getDriver().getId() : "").append(",")
                  .append(t.getCargoWeightKg()).append(",")
                  .append(t.getPlannedDistance()).append(",")
                  .append(t.getStatus() != null ? t.getStatus().getLabel() : "").append(",")
                  .append(t.getFinalOdometer() != null ? t.getFinalOdometer() : "").append(",")
                  .append(t.getFuelConsumed() != null ? t.getFuelConsumed() : "").append("\n");
            }
        } else if ("fuel".equalsIgnoreCase(type)) {
            sb.append("ID,Vehicle ID,Liters,Cost,Date\n");
            for (FuelLog f : fuelRepository.findAll()) {
                sb.append(f.getId()).append(",")
                  .append(f.getVehicle() != null ? f.getVehicle().getId() : "").append(",")
                  .append(f.getLiters()).append(",")
                  .append(f.getCost()).append(",")
                  .append(f.getDate()).append("\n");
            }
        } else if ("expenses".equalsIgnoreCase(type)) {
            sb.append("ID,Vehicle ID,Type,Amount,Date\n");
            for (Expense e : expenseRepository.findAll()) {
                sb.append(e.getId()).append(",")
                  .append(e.getVehicle() != null ? e.getVehicle().getId() : "").append(",")
                  .append(escapeCsv(e.getType())).append(",")
                  .append(e.getAmount()).append(",")
                  .append(e.getDate()).append("\n");
            }
        } else {
            throw new IllegalArgumentException("Unknown CSV type: " + type);
        }
        return sb.toString();
    }

    private String escapeCsv(String value) {
        if (value == null) return "";
        if (value.contains(",") || value.contains("\"") || value.contains("\n")) {
            return "\"" + value.replace("\"", "\"\"") + "\"";
        }
        return value;
    }
}
