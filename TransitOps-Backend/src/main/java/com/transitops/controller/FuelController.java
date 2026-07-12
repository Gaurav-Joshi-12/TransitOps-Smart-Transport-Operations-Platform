package com.transitops.controller;

import com.transitops.entity.FuelLog;
import com.transitops.service.FuelService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/fuel-logs")
public class FuelController {

    private final FuelService fuelService;

    public FuelController(FuelService fuelService) {
        this.fuelService = fuelService;
    }

    @GetMapping
    public ResponseEntity<List<FuelLog>> getFuelLogs(@RequestParam(required = false) Long vehicleId) {
        return ResponseEntity.ok(fuelService.getFuelLogs(vehicleId));
    }

    @PostMapping
    public ResponseEntity<FuelLog> createFuelLog(@RequestBody FuelLog log) {
        return ResponseEntity.ok(fuelService.createFuelLog(log));
    }
}
