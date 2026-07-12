package com.transitops.config;

import com.transitops.entity.*;
import com.transitops.enums.*;
import com.transitops.repository.*;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Arrays;

@Component
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final VehicleRepository vehicleRepository;
    private final DriverRepository driverRepository;
    private final TripRepository tripRepository;
    private final MaintenanceLogRepository maintenanceLogRepository;
    private final FuelLogRepository fuelLogRepository;
    private final PasswordEncoder passwordEncoder;

    public DataSeeder(UserRepository userRepository, VehicleRepository vehicleRepository, DriverRepository driverRepository, TripRepository tripRepository, MaintenanceLogRepository maintenanceLogRepository, FuelLogRepository fuelLogRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.vehicleRepository = vehicleRepository;
        this.driverRepository = driverRepository;
        this.tripRepository = tripRepository;
        this.maintenanceLogRepository = maintenanceLogRepository;
        this.fuelLogRepository = fuelLogRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) throws Exception {
        if (userRepository.count() == 0) {
            String encodedPassword = passwordEncoder.encode("password");

            User fleetManager = new User();
            fleetManager.setName("Fleet Manager");
            fleetManager.setEmail("fleetmanager@transitops.com");
            fleetManager.setPassword(encodedPassword);
            fleetManager.setRole(Role.FLEET_MANAGER);

            User driverUser = new User();
            driverUser.setName("Driver User");
            driverUser.setEmail("driver@transitops.com");
            driverUser.setPassword(encodedPassword);
            driverUser.setRole(Role.DRIVER);

            User safetyOfficer = new User();
            safetyOfficer.setName("Safety Officer");
            safetyOfficer.setEmail("safety@transitops.com");
            safetyOfficer.setPassword(encodedPassword);
            safetyOfficer.setRole(Role.SAFETY_OFFICER);

            User financeAnalyst = new User();
            financeAnalyst.setName("Finance Analyst");
            financeAnalyst.setEmail("finance@transitops.com");
            financeAnalyst.setPassword(encodedPassword);
            financeAnalyst.setRole(Role.FINANCIAL_ANALYST);

            userRepository.saveAll(Arrays.asList(fleetManager, driverUser, safetyOfficer, financeAnalyst));
        }

        if (vehicleRepository.count() == 0) {
            Vehicle van05 = new Vehicle();
            van05.setRegNo("VAN-05");
            van05.setName("Delivery Van 5");
            van05.setType("Van");
            van05.setMaxLoadKg(500.0);
            van05.setOdometer(12500.0);
            van05.setAcquisitionCost(new BigDecimal("35000.00"));
            van05.setRegion("North");
            van05.setRevenue(new BigDecimal("5000.00"));
            van05.setStatus(VehicleStatus.AVAILABLE);

            Vehicle truck01 = new Vehicle();
            truck01.setRegNo("TRK-01");
            truck01.setName("Heavy Truck 1");
            truck01.setType("Truck");
            truck01.setMaxLoadKg(2000.0);
            truck01.setOdometer(45000.0);
            truck01.setAcquisitionCost(new BigDecimal("85000.00"));
            truck01.setRegion("South");
            truck01.setRevenue(new BigDecimal("12000.00"));
            truck01.setStatus(VehicleStatus.IN_SHOP);

            Vehicle retiredVan = new Vehicle();
            retiredVan.setRegNo("VAN-01");
            retiredVan.setName("Old Van 1");
            retiredVan.setType("Van");
            retiredVan.setMaxLoadKg(500.0);
            retiredVan.setOdometer(250000.0);
            retiredVan.setAcquisitionCost(new BigDecimal("25000.00"));
            retiredVan.setRegion("East");
            retiredVan.setRevenue(new BigDecimal("15000.00"));
            retiredVan.setStatus(VehicleStatus.RETIRED);

            vehicleRepository.saveAll(Arrays.asList(van05, truck01, retiredVan));
        }

        if (driverRepository.count() == 0) {
            Driver alex = new Driver();
            alex.setName("Alex");
            alex.setLicenseNo("LIC-ALEX-001");
            alex.setLicenseCategory("C");
            alex.setLicenseExpiry(LocalDate.now().plusYears(1));
            alex.setContact("123-456-7890");
            alex.setSafetyScore(95);
            alex.setStatus(DriverStatus.AVAILABLE);

            Driver bobExpired = new Driver();
            bobExpired.setName("Bob (Expired)");
            bobExpired.setLicenseNo("LIC-BOB-002");
            bobExpired.setLicenseCategory("C");
            bobExpired.setLicenseExpiry(LocalDate.now().minusDays(10));
            bobExpired.setContact("123-456-7891");
            bobExpired.setSafetyScore(80);
            bobExpired.setStatus(DriverStatus.AVAILABLE);

            Driver charlieSuspended = new Driver();
            charlieSuspended.setName("Charlie (Suspended)");
            charlieSuspended.setLicenseNo("LIC-CHA-003");
            charlieSuspended.setLicenseCategory("D");
            charlieSuspended.setLicenseExpiry(LocalDate.now().plusYears(2));
            charlieSuspended.setContact("123-456-7892");
            charlieSuspended.setSafetyScore(40);
            charlieSuspended.setStatus(DriverStatus.SUSPENDED);

            driverRepository.saveAll(Arrays.asList(alex, bobExpired, charlieSuspended));
        }

        if (tripRepository.count() == 0) {
            Vehicle van05 = vehicleRepository.findAll().stream().filter(v -> v.getRegNo().equals("VAN-05")).findFirst().orElse(null);
            Driver alex = driverRepository.findAll().stream().filter(d -> d.getName().equals("Alex")).findFirst().orElse(null);

            if (van05 != null && alex != null) {
                Trip pastTrip = new Trip();
                pastTrip.setVehicle(van05);
                pastTrip.setDriver(alex);
                pastTrip.setSource("Warehouse A");
                pastTrip.setDestination("Store B");
                pastTrip.setCargoWeightKg(400.0);
                pastTrip.setPlannedDistance(50.0);
                pastTrip.setStatus(TripStatus.COMPLETED);
                pastTrip.setFinalOdometer(van05.getOdometer() + 52.0);
                pastTrip.setFuelConsumed(15.0);
                tripRepository.save(pastTrip);
            }
        }
        
        if (maintenanceLogRepository.count() == 0) {
            Vehicle truck01 = vehicleRepository.findAll().stream().filter(v -> v.getRegNo().equals("TRK-01")).findFirst().orElse(null);
            if (truck01 != null) {
                MaintenanceLog log = new MaintenanceLog();
                log.setVehicle(truck01);
                log.setDescription("Routine Engine Check");
                log.setCost(new BigDecimal("250.00"));
                log.setStatus(MaintenanceStatus.OPEN);
                log.setOpenedAt(Instant.now().minusSeconds(86400)); // 1 day ago
                maintenanceLogRepository.save(log);
            }
        }

        if (fuelLogRepository.count() == 0) {
            Vehicle van05 = vehicleRepository.findAll().stream().filter(v -> v.getRegNo().equals("VAN-05")).findFirst().orElse(null);
            if (van05 != null) {
                FuelLog log = new FuelLog();
                log.setVehicle(van05);
                log.setLiters(40.0);
                log.setCost(new BigDecimal("120.00"));
                log.setDate(LocalDate.now().minusDays(2));
                fuelLogRepository.save(log);
            }
        }
    }
}
