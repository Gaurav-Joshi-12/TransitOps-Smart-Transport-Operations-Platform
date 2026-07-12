package com.transitops.controller;

import com.transitops.entity.Vehicle;
import com.transitops.enums.VehicleStatus;
import com.transitops.service.VehicleService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/vehicles")
public class VehicleController {

    private final VehicleService vehicleService;

    public VehicleController(VehicleService vehicleService) {
        this.vehicleService = vehicleService;
    }

    @GetMapping
    public ResponseEntity<List<Vehicle>> getVehicles(
            @RequestParam(required = false) String type,
            @RequestParam(required = false) VehicleStatus status,
            @RequestParam(required = false) String region) {
        return ResponseEntity.ok(vehicleService.getVehicles(type, status, region));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Vehicle> getVehicle(@PathVariable Long id) {
        return ResponseEntity.ok(vehicleService.getVehicle(id));
    }

    @PostMapping
    @PreAuthorize("hasRole('ROLE_FLEET_MANAGER')")
    public ResponseEntity<Vehicle> createVehicle(@RequestBody Vehicle vehicle) {
        return ResponseEntity.ok(vehicleService.createVehicle(vehicle));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ROLE_FLEET_MANAGER')")
    public ResponseEntity<Vehicle> updateVehicle(@PathVariable Long id, @RequestBody Vehicle vehicle) {
        return ResponseEntity.ok(vehicleService.updateVehicle(id, vehicle));
    }
}
