package com.transitops.service;

import com.transitops.dto.DashboardKpis;
import com.transitops.entity.FuelLog;
import com.transitops.entity.MaintenanceLog;
import com.transitops.entity.Trip;
import com.transitops.entity.Vehicle;
import com.transitops.enums.DriverStatus;
import com.transitops.enums.TripStatus;
import com.transitops.enums.VehicleStatus;
import com.transitops.repository.*;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class ReportService {

    private final VehicleRepository vehicleRepository;
    private final DriverRepository driverRepository;
    private final TripRepository tripRepository;
    private final MaintenanceLogRepository maintenanceRepository;
    private final FuelLogRepository fuelRepository;

    public ReportService(VehicleRepository vehicleRepository, DriverRepository driverRepository, TripRepository tripRepository, MaintenanceLogRepository maintenanceRepository, FuelLogRepository fuelRepository) {
        this.vehicleRepository = vehicleRepository;
        this.driverRepository = driverRepository;
        this.tripRepository = tripRepository;
        this.maintenanceRepository = maintenanceRepository;
        this.fuelRepository = fuelRepository;
    }

    public DashboardKpis getDashboardKpis() {
        List<Vehicle> vehicles = vehicleRepository.findAll();
        long activeVehicles = vehicles.stream().filter(v -> v.getStatus() == VehicleStatus.ON_TRIP).count();
        long availableVehicles = vehicles.stream().filter(v -> v.getStatus() == VehicleStatus.AVAILABLE).count();
        long inMaintenance = vehicles.stream().filter(v -> v.getStatus() == VehicleStatus.IN_SHOP).count();
        
        double utilization = vehicles.isEmpty() ? 0 : ((double) activeVehicles / vehicles.size()) * 100;

        List<Trip> trips = tripRepository.findAll();
        long activeTrips = trips.stream().filter(t -> t.getStatus() == TripStatus.DISPATCHED).count();
        long pendingTrips = trips.stream().filter(t -> t.getStatus() == TripStatus.DRAFT).count();

        long driversOnDuty = driverRepository.findByStatus(DriverStatus.ON_TRIP).size();

        return new DashboardKpis(activeVehicles, availableVehicles, inMaintenance, activeTrips, pendingTrips, driversOnDuty, utilization);
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
        // Mock utilization data for hackathon
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

    public List<Map<String, Object>> getVehicleRoi() {
        return vehicleRepository.findAll().stream().map(v -> {
            List<FuelLog> fuelLogs = fuelRepository.findByVehicleId(v.getId());
            List<MaintenanceLog> maintLogs = maintenanceRepository.findByVehicleId(v.getId());
            
            BigDecimal fuelCost = fuelLogs.stream().map(FuelLog::getCost).filter(c -> c != null).reduce(BigDecimal.ZERO, BigDecimal::add);
            BigDecimal maintCost = maintLogs.stream().map(MaintenanceLog::getCost).filter(c -> c != null).reduce(BigDecimal.ZERO, BigDecimal::add);
            BigDecimal totalCost = fuelCost.add(maintCost);
            
            BigDecimal revenue = v.getRevenue() != null ? v.getRevenue() : BigDecimal.ZERO;
            BigDecimal acquisitionCost = v.getAcquisitionCost() != null && v.getAcquisitionCost().compareTo(BigDecimal.ZERO) > 0 
                ? v.getAcquisitionCost() : BigDecimal.ONE; // Prevent division by zero
            
            // ROI = (revenue - (maintenanceCost + fuelCost)) / acquisitionCost
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

    public String exportCsv(String type) {
        // Minimal CSV export mock for hackathon
        return "id,name,value\n1,mock,data";
    }
}
