package com.transitops.service;

import com.transitops.entity.Vehicle;
import com.transitops.enums.VehicleStatus;
import com.transitops.exception.ResourceConflictException;
import com.transitops.exception.ResourceNotFoundException;
import com.transitops.repository.VehicleRepository;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class VehicleService {

    private final VehicleRepository vehicleRepository;

    public VehicleService(VehicleRepository vehicleRepository) {
        this.vehicleRepository = vehicleRepository;
    }

    public List<Vehicle> getVehicles(String type, VehicleStatus status, String region) {
        // Basic filtering, for more complex we'd use Specifications
        List<Vehicle> vehicles = vehicleRepository.findAll();
        if (type != null) {
            vehicles.removeIf(v -> !type.equals(v.getType()));
        }
        if (status != null) {
            vehicles.removeIf(v -> status != v.getStatus());
        }
        if (region != null) {
            vehicles.removeIf(v -> !region.equals(v.getRegion()));
        }
        return vehicles;
    }

    public Vehicle getVehicle(Long id) {
        return vehicleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle not found with id " + id));
    }

    public Vehicle createVehicle(Vehicle vehicle) {
        if (vehicleRepository.existsByRegNo(vehicle.getRegNo())) {
            throw new ResourceConflictException("Vehicle with registration number " + vehicle.getRegNo() + " already exists");
        }
        if (vehicle.getStatus() == null) {
            vehicle.setStatus(VehicleStatus.AVAILABLE);
        }
        return vehicleRepository.save(vehicle);
    }

    public Vehicle updateVehicle(Long id, Vehicle vehicleDetails) {
        Vehicle vehicle = getVehicle(id);
        
        if (!vehicle.getRegNo().equals(vehicleDetails.getRegNo()) && vehicleRepository.existsByRegNo(vehicleDetails.getRegNo())) {
            throw new ResourceConflictException("Vehicle with registration number " + vehicleDetails.getRegNo() + " already exists");
        }

        vehicle.setRegNo(vehicleDetails.getRegNo());
        vehicle.setName(vehicleDetails.getName());
        vehicle.setType(vehicleDetails.getType());
        vehicle.setMaxLoadKg(vehicleDetails.getMaxLoadKg());
        vehicle.setOdometer(vehicleDetails.getOdometer());
        vehicle.setAcquisitionCost(vehicleDetails.getAcquisitionCost());
        vehicle.setRegion(vehicleDetails.getRegion());
        vehicle.setRevenue(vehicleDetails.getRevenue());
        vehicle.setStatus(vehicleDetails.getStatus());

        return vehicleRepository.save(vehicle);
    }
}
