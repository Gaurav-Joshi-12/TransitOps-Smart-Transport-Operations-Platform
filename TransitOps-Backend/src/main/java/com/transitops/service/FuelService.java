package com.transitops.service;

import com.transitops.entity.FuelLog;
import com.transitops.entity.Vehicle;
import com.transitops.exception.ResourceNotFoundException;
import com.transitops.repository.FuelLogRepository;
import com.transitops.repository.VehicleRepository;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class FuelService {

    private final FuelLogRepository fuelLogRepository;
    private final VehicleRepository vehicleRepository;

    public FuelService(FuelLogRepository fuelLogRepository, VehicleRepository vehicleRepository) {
        this.fuelLogRepository = fuelLogRepository;
        this.vehicleRepository = vehicleRepository;
    }

    public List<FuelLog> getFuelLogs(Long vehicleId) {
        if (vehicleId != null) {
            return fuelLogRepository.findByVehicleId(vehicleId);
        }
        return fuelLogRepository.findAll();
    }

    public FuelLog createFuelLog(FuelLog log) {
        if (log.getVehicle() != null && log.getVehicle().getId() != null) {
            Vehicle v = vehicleRepository.findById(log.getVehicle().getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Vehicle not found"));
            log.setVehicle(v);
        }
        return fuelLogRepository.save(log);
    }
}
