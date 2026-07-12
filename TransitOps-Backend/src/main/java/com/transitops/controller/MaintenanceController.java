package com.transitops.controller;

import com.transitops.entity.MaintenanceLog;
import com.transitops.enums.MaintenanceStatus;
import com.transitops.service.MaintenanceService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/maintenance")
public class MaintenanceController {

    private final MaintenanceService maintenanceService;

    public MaintenanceController(MaintenanceService maintenanceService) {
        this.maintenanceService = maintenanceService;
    }

    @GetMapping
    public ResponseEntity<List<MaintenanceLog>> getMaintenanceLogs(
            @RequestParam(required = false) Long vehicleId,
            @RequestParam(required = false) MaintenanceStatus status) {
        return ResponseEntity.ok(maintenanceService.getMaintenanceLogs(vehicleId, status));
    }

    @PostMapping
    public ResponseEntity<MaintenanceLog> createMaintenanceLog(@RequestBody MaintenanceLog log) {
        return ResponseEntity.ok(maintenanceService.createMaintenanceLog(log));
    }

    @PostMapping("/{id}/close")
    public ResponseEntity<MaintenanceLog> closeMaintenanceLog(@PathVariable Long id) {
        return ResponseEntity.ok(maintenanceService.closeMaintenanceLog(id));
    }
}
