package com.transitops.service;

import com.transitops.entity.MaintenanceLog;
import com.transitops.entity.Vehicle;
import com.transitops.enums.MaintenanceStatus;
import com.transitops.enums.VehicleStatus;
import com.transitops.exception.BusinessValidationException;
import com.transitops.exception.ResourceNotFoundException;
import com.transitops.repository.MaintenanceLogRepository;
import com.transitops.repository.VehicleRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.Instant;
import java.util.List;

@Service
public class MaintenanceService {

    private final MaintenanceLogRepository maintenanceRepository;
    private final VehicleRepository vehicleRepository;

    public MaintenanceService(MaintenanceLogRepository maintenanceRepository, VehicleRepository vehicleRepository) {
        this.maintenanceRepository = maintenanceRepository;
        this.vehicleRepository = vehicleRepository;
    }

    public List<MaintenanceLog> getMaintenanceLogs(Long vehicleId, MaintenanceStatus status) {
        if (vehicleId != null && status != null) {
            return maintenanceRepository.findByVehicleIdAndStatus(vehicleId, status);
        } else if (vehicleId != null) {
            return maintenanceRepository.findByVehicleId(vehicleId);
        } else if (status != null) {
            return maintenanceRepository.findByStatus(status);
        }
        return maintenanceRepository.findAll();
    }

    @Transactional
    public MaintenanceLog createMaintenanceLog(MaintenanceLog log) {
        if (log.getVehicle() == null || log.getVehicle().getId() == null) {
            throw new BusinessValidationException("Vehicle ID must be provided");
        }

        Vehicle vehicle = vehicleRepository.findById(log.getVehicle().getId())
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle not found"));

        if (vehicle.getStatus() == VehicleStatus.RETIRED) {
            throw new BusinessValidationException("Cannot open maintenance for a RETIRED vehicle");
        }

        vehicle.setStatus(VehicleStatus.IN_SHOP);
        vehicleRepository.save(vehicle);

        log.setVehicle(vehicle);
        log.setStatus(MaintenanceStatus.OPEN);
        return maintenanceRepository.save(log);
    }

    @Transactional
    public MaintenanceLog closeMaintenanceLog(Long id) {
        MaintenanceLog log = maintenanceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Maintenance log not found with id " + id));

        if (log.getStatus() == MaintenanceStatus.CLOSED) {
            throw new BusinessValidationException("Maintenance log is already closed");
        }

        log.setStatus(MaintenanceStatus.CLOSED);
        log.setClosedAt(Instant.now());

        Vehicle vehicle = log.getVehicle();
        if (vehicle.getStatus() != VehicleStatus.RETIRED) {
            vehicle.setStatus(VehicleStatus.AVAILABLE);
            vehicleRepository.save(vehicle);
        }

        return maintenanceRepository.save(log);
    }
}
