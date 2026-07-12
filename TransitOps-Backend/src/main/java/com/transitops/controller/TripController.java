package com.transitops.controller;

import com.transitops.dto.TripCompleteRequest;
import com.transitops.entity.Trip;
import com.transitops.enums.TripStatus;
import com.transitops.service.TripService;
import org.springframework.http.ResponseEntity;
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
    public ResponseEntity<List<Trip>> getTrips(@RequestParam(required = false) TripStatus status) {
        return ResponseEntity.ok(tripService.getTrips(status));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Trip> getTrip(@PathVariable Long id) {
        return ResponseEntity.ok(tripService.getTrip(id));
    }

    @PostMapping
    public ResponseEntity<Trip> createTrip(@RequestBody Trip trip) {
        return ResponseEntity.ok(tripService.createTrip(trip));
    }

    @PostMapping("/{id}/dispatch")
    public ResponseEntity<Trip> dispatchTrip(@PathVariable Long id) {
        return ResponseEntity.ok(tripService.dispatchTrip(id));
    }

    @PostMapping("/{id}/complete")
    public ResponseEntity<Trip> completeTrip(@PathVariable Long id, @RequestBody TripCompleteRequest request) {
        return ResponseEntity.ok(tripService.completeTrip(id, request));
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<Trip> cancelTrip(@PathVariable Long id) {
        return ResponseEntity.ok(tripService.cancelTrip(id));
    }
}
