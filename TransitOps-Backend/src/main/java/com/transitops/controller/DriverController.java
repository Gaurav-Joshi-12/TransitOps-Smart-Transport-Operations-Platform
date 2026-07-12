package com.transitops.controller;

import com.transitops.dto.DriverStatusUpdateRequest;
import com.transitops.entity.Driver;
import com.transitops.enums.DriverStatus;
import com.transitops.service.DriverService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/drivers")
public class DriverController {

    private final DriverService driverService;

    public DriverController(DriverService driverService) {
        this.driverService = driverService;
    }

    @GetMapping
    public ResponseEntity<List<Driver>> getDrivers(@RequestParam(required = false) DriverStatus status) {
        return ResponseEntity.ok(driverService.getDrivers(status));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Driver> getDriver(@PathVariable Long id) {
        return ResponseEntity.ok(driverService.getDriver(id));
    }

    @PostMapping
    @PreAuthorize("hasRole('ROLE_FLEET_MANAGER')")
    public ResponseEntity<Driver> createDriver(@RequestBody Driver driver) {
        return ResponseEntity.ok(driverService.createDriver(driver));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ROLE_FLEET_MANAGER')")
    public ResponseEntity<Driver> updateDriver(@PathVariable Long id, @RequestBody Driver driver) {
        return ResponseEntity.ok(driverService.updateDriver(id, driver));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ROLE_FLEET_MANAGER', 'ROLE_SAFETY_OFFICER')")
    public ResponseEntity<Driver> updateDriverStatus(@PathVariable Long id, @RequestBody DriverStatusUpdateRequest request) {
        return ResponseEntity.ok(driverService.updateDriverStatus(id, request.getStatus(), request.getSafetyScore()));
    }
}
