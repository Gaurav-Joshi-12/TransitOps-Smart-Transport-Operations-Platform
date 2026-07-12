package com.transitops.service;

import com.transitops.dto.TripCompleteRequest;
import com.transitops.entity.Driver;
import com.transitops.entity.Trip;
import com.transitops.entity.Vehicle;
import com.transitops.enums.DriverStatus;
import com.transitops.enums.TripStatus;
import com.transitops.enums.VehicleStatus;
import com.transitops.exception.BusinessValidationException;
import com.transitops.exception.ResourceNotFoundException;
import com.transitops.repository.DriverRepository;
import com.transitops.repository.TripRepository;
import com.transitops.repository.VehicleRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDate;
import java.util.List;

@Service
public class TripService {

    private final TripRepository tripRepository;
    private final VehicleRepository vehicleRepository;
    private final DriverRepository driverRepository;

    public TripService(TripRepository tripRepository, VehicleRepository vehicleRepository, DriverRepository driverRepository) {
        this.tripRepository = tripRepository;
        this.vehicleRepository = vehicleRepository;
        this.driverRepository = driverRepository;
    }

    public List<Trip> getTrips(TripStatus status, Long driverId) {
        if (status != null && driverId != null) {
            return tripRepository.findByStatusAndDriverId(status, driverId);
        } else if (status != null) {
            return tripRepository.findByStatus(status);
        } else if (driverId != null) {
            return tripRepository.findByDriverId(driverId);
        }
        return tripRepository.findAll();
    }

    public Trip getTrip(Long id) {
        return tripRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Trip not found with id " + id));
    }

    public Trip createTrip(Trip trip) {
        if (trip.getVehicle() != null && trip.getVehicle().getId() != null) {
            Vehicle v = vehicleRepository.findById(trip.getVehicle().getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Vehicle not found"));
            trip.setVehicle(v);
        }
        if (trip.getDriver() != null && trip.getDriver().getId() != null) {
            Driver d = driverRepository.findById(trip.getDriver().getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Driver not found"));
            trip.setDriver(d);
        }
        trip.setStatus(TripStatus.DRAFT);
        return tripRepository.save(trip);
    }

    @Transactional
    public Trip dispatchTrip(Long id) {
        Trip trip = getTrip(id);

        if (trip.getStatus() != TripStatus.DRAFT) {
            throw new BusinessValidationException("Trip can only be dispatched from DRAFT status");
        }

        Vehicle vehicle = trip.getVehicle();
        Driver driver = trip.getDriver();

        if (vehicle == null || driver == null) {
            throw new BusinessValidationException("Trip must have a vehicle and a driver assigned");
        }

        if (vehicle.getStatus() != VehicleStatus.AVAILABLE) {
            throw new BusinessValidationException("Vehicle is currently " + vehicle.getStatus() + " (must be AVAILABLE)");
        }

        if (driver.getStatus() != DriverStatus.AVAILABLE) {
            throw new BusinessValidationException("Driver is currently " + driver.getStatus() + " (must be AVAILABLE)");
        }

        if (driver.getStatus() == DriverStatus.SUSPENDED) {
            throw new BusinessValidationException("Driver is SUSPENDED");
        }

        if (driver.getLicenseExpiry() != null && driver.getLicenseExpiry().isBefore(LocalDate.now().plusDays(1))) {
            throw new BusinessValidationException("Driver's license is expired or expires today");
        }

        if (trip.getCargoWeightKg() > vehicle.getMaxLoadKg()) {
            throw new BusinessValidationException("Cargo weight " + trip.getCargoWeightKg() + "kg exceeds vehicle max load " + vehicle.getMaxLoadKg() + "kg");
        }

        vehicle.setStatus(VehicleStatus.ON_TRIP);
        driver.setStatus(DriverStatus.ON_TRIP);
        trip.setStatus(TripStatus.DISPATCHED);

        vehicleRepository.save(vehicle);
        driverRepository.save(driver);
        return tripRepository.save(trip);
    }

    @Transactional
    public Trip completeTrip(Long id, TripCompleteRequest request) {
        Trip trip = getTrip(id);

        if (trip.getStatus() != TripStatus.DISPATCHED) {
            throw new BusinessValidationException("Trip can only be completed from DISPATCHED status");
        }

        Vehicle vehicle = trip.getVehicle();
        Driver driver = trip.getDriver();

        if (request.getFinalOdometer() == null || request.getFinalOdometer() < vehicle.getOdometer()) {
            throw new BusinessValidationException("Final odometer must be greater than or equal to current odometer (" + vehicle.getOdometer() + ")");
        }

        if (request.getFuelConsumed() == null || request.getFuelConsumed() <= 0) {
            throw new BusinessValidationException("Fuel consumed must be greater than 0");
        }

        trip.setFinalOdometer(request.getFinalOdometer());
        trip.setFuelConsumed(request.getFuelConsumed());
        trip.setStatus(TripStatus.COMPLETED);

        vehicle.setOdometer(request.getFinalOdometer());
        vehicle.setStatus(VehicleStatus.AVAILABLE);
        driver.setStatus(DriverStatus.AVAILABLE);

        vehicleRepository.save(vehicle);
        driverRepository.save(driver);
        return tripRepository.save(trip);
    }

    @Transactional
    public Trip cancelTrip(Long id) {
        Trip trip = getTrip(id);

        if (trip.getStatus() != TripStatus.DISPATCHED && trip.getStatus() != TripStatus.DRAFT) {
            throw new BusinessValidationException("Only DRAFT or DISPATCHED trips can be cancelled");
        }

        Vehicle vehicle = trip.getVehicle();
        Driver driver = trip.getDriver();

        // Only restore status if the trip was dispatched (draft never changed statuses)
        if (trip.getStatus() == TripStatus.DISPATCHED) {
            if (vehicle != null) {
                vehicle.setStatus(VehicleStatus.AVAILABLE);
                vehicleRepository.save(vehicle);
            }
            if (driver != null) {
                driver.setStatus(DriverStatus.AVAILABLE);
                driverRepository.save(driver);
            }
        }

        trip.setStatus(TripStatus.CANCELLED);
        return tripRepository.save(trip);
    }
}
