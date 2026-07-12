package com.transitops.service;

import com.transitops.entity.Driver;
import com.transitops.enums.DriverStatus;
import com.transitops.exception.ResourceConflictException;
import com.transitops.exception.ResourceNotFoundException;
import com.transitops.repository.DriverRepository;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class DriverService {

    private final DriverRepository driverRepository;

    public DriverService(DriverRepository driverRepository) {
        this.driverRepository = driverRepository;
    }

    public List<Driver> getDrivers(DriverStatus status) {
        if (status != null) {
            return driverRepository.findByStatus(status);
        }
        return driverRepository.findAll();
    }

    public Driver getDriver(Long id) {
        return driverRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Driver not found with id " + id));
    }

    public Driver createDriver(Driver driver) {
        if (driverRepository.existsByLicenseNo(driver.getLicenseNo())) {
            throw new ResourceConflictException("Driver with license number " + driver.getLicenseNo() + " already exists");
        }
        if (driver.getStatus() == null) {
            driver.setStatus(DriverStatus.AVAILABLE);
        }
        return driverRepository.save(driver);
    }

    public Driver updateDriver(Long id, Driver driverDetails) {
        Driver driver = getDriver(id);
        
        if (!driver.getLicenseNo().equals(driverDetails.getLicenseNo()) && driverRepository.existsByLicenseNo(driverDetails.getLicenseNo())) {
            throw new ResourceConflictException("Driver with license number " + driverDetails.getLicenseNo() + " already exists");
        }

        driver.setName(driverDetails.getName());
        driver.setLicenseNo(driverDetails.getLicenseNo());
        driver.setLicenseCategory(driverDetails.getLicenseCategory());
        driver.setLicenseExpiry(driverDetails.getLicenseExpiry());
        driver.setContact(driverDetails.getContact());
        driver.setSafetyScore(driverDetails.getSafetyScore());
        driver.setStatus(driverDetails.getStatus());

        return driverRepository.save(driver);
    }

    public Driver updateDriverStatus(Long id, DriverStatus status, Integer safetyScore) {
        Driver driver = getDriver(id);
        if (status != null) {
            driver.setStatus(status);
        }
        if (safetyScore != null) {
            driver.setSafetyScore(safetyScore);
        }
        return driverRepository.save(driver);
    }
}
