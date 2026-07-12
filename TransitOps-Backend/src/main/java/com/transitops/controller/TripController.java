package com.transitops.controller;

import com.transitops.dto.TripCompleteRequest;
import com.transitops.entity.Trip;
import com.transitops.enums.TripStatus;
import com.transitops.service.TripService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/trips")
public class TripController {

    private final TripService tripService;

    public TripController(TripService tripService) {
        this.tripService = tripService;
    }

    @GetMapping
    public ResponseEntity<List<Trip>> getTrips(
            @RequestParam(required = false) TripStatus status,
            @RequestParam(required = false) Long driverId) {
        return ResponseEntity.ok(tripService.getTrips(status, driverId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Trip> getTrip(@PathVariable Long id) {
        return ResponseEntity.ok(tripService.getTrip(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ROLE_FLEET_MANAGER', 'ROLE_DRIVER')")
    public ResponseEntity<Trip> createTrip(@RequestBody Trip trip) {
        return ResponseEntity.ok(tripService.createTrip(trip));
    }

    @PostMapping("/{id}/dispatch")
    @PreAuthorize("hasAnyRole('ROLE_FLEET_MANAGER', 'ROLE_DRIVER')")
    public ResponseEntity<Trip> dispatchTrip(@PathVariable Long id) {
        return ResponseEntity.ok(tripService.dispatchTrip(id));
    }

    @PostMapping("/{id}/complete")
    @PreAuthorize("hasAnyRole('ROLE_FLEET_MANAGER', 'ROLE_DRIVER')")
    public ResponseEntity<Trip> completeTrip(@PathVariable Long id, @RequestBody TripCompleteRequest request) {
        return ResponseEntity.ok(tripService.completeTrip(id, request));
    }

    @PostMapping("/{id}/cancel")
    @PreAuthorize("hasAnyRole('ROLE_FLEET_MANAGER', 'ROLE_DRIVER')")
    public ResponseEntity<Trip> cancelTrip(@PathVariable Long id) {
        return ResponseEntity.ok(tripService.cancelTrip(id));
    }
}
