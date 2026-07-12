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
import java.util.List;

@Component
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final VehicleRepository vehicleRepository;
    private final DriverRepository driverRepository;
    private final TripRepository tripRepository;
    private final MaintenanceLogRepository maintenanceLogRepository;
    private final FuelLogRepository fuelLogRepository;
    private final ExpenseRepository expenseRepository;
    private final PasswordEncoder passwordEncoder;

    public DataSeeder(UserRepository userRepository, VehicleRepository vehicleRepository,
                      DriverRepository driverRepository, TripRepository tripRepository,
                      MaintenanceLogRepository maintenanceLogRepository, FuelLogRepository fuelLogRepository,
                      ExpenseRepository expenseRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.vehicleRepository = vehicleRepository;
        this.driverRepository = driverRepository;
        this.tripRepository = tripRepository;
        this.maintenanceLogRepository = maintenanceLogRepository;
        this.fuelLogRepository = fuelLogRepository;
        this.expenseRepository = expenseRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) throws Exception {
        seedUsers();
        seedVehicles();
        seedDrivers();
        seedTrips();
        seedMaintenance();
        seedFuelLogs();
        seedExpenses();
    }

    private void seedUsers() {
        if (userRepository.count() > 0) return;
        String pw = passwordEncoder.encode("password");

        userRepository.saveAll(Arrays.asList(
            user("Alex Kumar",        "driver@transitops.com",       pw, Role.DRIVER),
            user("Rohan Mehta",       "fleetmanager@transitops.com", pw, Role.FLEET_MANAGER),
            user("Priya Sharma",      "safety@transitops.com",       pw, Role.SAFETY_OFFICER),
            user("Vikram Nair",       "finance@transitops.com",      pw, Role.FINANCIAL_ANALYST)
        ));
    }

    private void seedVehicles() {
        if (vehicleRepository.count() > 0) return;

        vehicleRepository.saveAll(Arrays.asList(
            vehicle("VAN-05", "Delivery Van 5",    "Van",    500.0,   12500.0, "350000", "North", "95000",  VehicleStatus.AVAILABLE),
            vehicle("VAN-07", "Delivery Van 7",    "Van",    600.0,   8200.0,  "380000", "East",  "72000",  VehicleStatus.AVAILABLE),
            vehicle("TRK-01", "Heavy Truck 1",     "Truck",  8000.0,  45000.0, "850000", "South", "210000", VehicleStatus.IN_SHOP),
            vehicle("TRK-03", "Heavy Truck 3",     "Truck",  10000.0, 62000.0, "920000", "West",  "280000", VehicleStatus.AVAILABLE),
            vehicle("TMP-02", "Tempo Express 2",   "Tempo",  2000.0,  22000.0, "480000", "North", "130000", VehicleStatus.ON_TRIP),
            vehicle("TMP-04", "Tempo Express 4",   "Tempo",  1800.0,  18500.0, "460000", "South", "115000", VehicleStatus.AVAILABLE),
            vehicle("VAN-01", "Old Van 1",         "Van",    500.0,  250000.0, "180000", "East",  "310000", VehicleStatus.RETIRED)
        ));
    }

    private void seedDrivers() {
        if (driverRepository.count() > 0) return;

        driverRepository.saveAll(Arrays.asList(
            driver("Alex Kumar",          "LIC-AK-001", "HMV", LocalDate.now().plusYears(2),   "9810001234", 95, DriverStatus.AVAILABLE),
            driver("Ravi Singh",          "LIC-RS-002", "HMV", LocalDate.now().plusYears(1),   "9820002345", 88, DriverStatus.ON_TRIP),
            driver("Mohan Das",           "LIC-MD-003", "LMV", LocalDate.now().plusMonths(3),  "9830003456", 76, DriverStatus.AVAILABLE),
            driver("Deepak Yadav",        "LIC-DY-004", "HMV", LocalDate.now().plusYears(3),   "9840004567", 91, DriverStatus.AVAILABLE),
            driver("Sunita Joshi (Exp.)", "LIC-SJ-005", "LMV", LocalDate.now().minusDays(15), "9850005678", 70, DriverStatus.AVAILABLE),
            driver("Ramesh (Suspended)",  "LIC-RP-006", "LMV", LocalDate.now().plusYears(1),   "9860006789", 35, DriverStatus.SUSPENDED)
        ));
    }

    private void seedTrips() {
        if (tripRepository.count() > 0) return;

        List<Vehicle> vehicles = vehicleRepository.findAll();
        List<Driver> drivers = driverRepository.findAll();

        Vehicle van05  = find(vehicles, "VAN-05");
        Vehicle van07  = find(vehicles, "VAN-07");
        Vehicle trk03  = find(vehicles, "TRK-03");
        Vehicle tmp02  = find(vehicles, "TMP-02");
        Vehicle tmp04  = find(vehicles, "TMP-04");

        Driver alex    = findDriver(drivers, "Alex Kumar");
        Driver ravi    = findDriver(drivers, "Ravi Singh");
        Driver mohan   = findDriver(drivers, "Mohan Das");
        Driver deepak  = findDriver(drivers, "Deepak Yadav");

        // Completed trips (historical data for reports)
        if (van05 != null && alex != null) {
            tripRepository.save(completedTrip(van05, alex, "Warehouse A", "Store B",   450.0, 52.0, 12552.0, 14.5));
            tripRepository.save(completedTrip(van05, alex, "Store B",     "Hub C",     380.0, 38.0, 12590.0, 10.8));
        }
        if (van07 != null && mohan != null) {
            tripRepository.save(completedTrip(van07, mohan, "Depot North", "Mall East",  550.0, 65.0, 8265.0, 18.2));
        }
        if (trk03 != null && deepak != null) {
            tripRepository.save(completedTrip(trk03, deepak, "Factory West", "Port South", 7500.0, 120.0, 62120.0, 48.0));
        }

        // Active / dispatched trip (ravi + tmp02 already set ON_TRIP)
        if (tmp02 != null && ravi != null) {
            tripRepository.save(dispatchedTrip(tmp02, ravi, "Depot South", "Warehouse B", 1800.0, 85.0));
        }

        // Draft trips waiting to be dispatched
        if (tmp04 != null && alex != null) {
            tripRepository.save(draftTrip(tmp04, alex, "Hub C", "Store D", 1200.0, 45.0));
        }
        if (van07 != null && deepak != null) {
            tripRepository.save(draftTrip(van07, deepak, "Airport Cargo", "Client X", 400.0, 30.0));
        }
    }

    private void seedMaintenance() {
        if (maintenanceLogRepository.count() > 0) return;

        List<Vehicle> vehicles = vehicleRepository.findAll();
        Vehicle trk01 = find(vehicles, "TRK-01");
        Vehicle van05 = find(vehicles, "VAN-05");
        Vehicle tmp02 = find(vehicles, "TMP-02");

        if (trk01 != null) {
            // Open — vehicle already IN_SHOP
            MaintenanceLog ml1 = new MaintenanceLog();
            ml1.setVehicle(trk01);
            ml1.setDescription("Engine overhaul — scheduled major service");
            ml1.setCost(new BigDecimal("18000.00"));
            ml1.setStatus(MaintenanceStatus.OPEN);
            ml1.setOpenedAt(Instant.now().minusSeconds(3 * 86400));
            maintenanceLogRepository.save(ml1);
        }

        if (van05 != null) {
            // Closed (historical)
            MaintenanceLog ml2 = new MaintenanceLog();
            ml2.setVehicle(van05);
            ml2.setDescription("Tyre replacement — all 4 tyres");
            ml2.setCost(new BigDecimal("8500.00"));
            ml2.setStatus(MaintenanceStatus.CLOSED);
            ml2.setOpenedAt(Instant.now().minusSeconds(10 * 86400));
            ml2.setClosedAt(Instant.now().minusSeconds(8 * 86400));
            maintenanceLogRepository.save(ml2);

            // Another closed
            MaintenanceLog ml3 = new MaintenanceLog();
            ml3.setVehicle(van05);
            ml3.setDescription("Brake pad replacement");
            ml3.setCost(new BigDecimal("3200.00"));
            ml3.setStatus(MaintenanceStatus.CLOSED);
            ml3.setOpenedAt(Instant.now().minusSeconds(30 * 86400));
            ml3.setClosedAt(Instant.now().minusSeconds(29 * 86400));
            maintenanceLogRepository.save(ml3);
        }

        if (tmp02 != null) {
            // Open on a vehicle that is ON_TRIP — won't change status (already ON_TRIP)
            MaintenanceLog ml4 = new MaintenanceLog();
            ml4.setVehicle(tmp02);
            ml4.setDescription("Air filter replacement (scheduled)");
            ml4.setCost(new BigDecimal("1200.00"));
            ml4.setStatus(MaintenanceStatus.CLOSED);
            ml4.setOpenedAt(Instant.now().minusSeconds(20 * 86400));
            ml4.setClosedAt(Instant.now().minusSeconds(19 * 86400));
            maintenanceLogRepository.save(ml4);
        }
    }

    private void seedFuelLogs() {
        if (fuelLogRepository.count() > 0) return;

        List<Vehicle> vehicles = vehicleRepository.findAll();
        Vehicle van05 = find(vehicles, "VAN-05");
        Vehicle van07 = find(vehicles, "VAN-07");
        Vehicle trk03 = find(vehicles, "TRK-03");
        Vehicle tmp02 = find(vehicles, "TMP-02");
        Vehicle tmp04 = find(vehicles, "TMP-04");

        if (van05 != null) {
            fuelLogRepository.save(fuelLog(van05, 45.0, "1350.00", LocalDate.now().minusDays(3)));
            fuelLogRepository.save(fuelLog(van05, 40.0, "1200.00", LocalDate.now().minusDays(12)));
        }
        if (van07 != null) {
            fuelLogRepository.save(fuelLog(van07, 50.0, "1500.00", LocalDate.now().minusDays(5)));
        }
        if (trk03 != null) {
            fuelLogRepository.save(fuelLog(trk03, 120.0, "3600.00", LocalDate.now().minusDays(2)));
            fuelLogRepository.save(fuelLog(trk03, 100.0, "3000.00", LocalDate.now().minusDays(8)));
        }
        if (tmp02 != null) {
            fuelLogRepository.save(fuelLog(tmp02, 60.0, "1800.00", LocalDate.now().minusDays(1)));
        }
        if (tmp04 != null) {
            fuelLogRepository.save(fuelLog(tmp04, 55.0, "1650.00", LocalDate.now().minusDays(4)));
        }
    }

    private void seedExpenses() {
        if (expenseRepository.count() > 0) return;

        List<Vehicle> vehicles = vehicleRepository.findAll();
        Vehicle van05 = find(vehicles, "VAN-05");
        Vehicle trk03 = find(vehicles, "TRK-03");
        Vehicle tmp02 = find(vehicles, "TMP-02");

        if (van05 != null) {
            expenseRepository.save(expense(van05, "Toll",      "850.00",  LocalDate.now().minusDays(3)));
            expenseRepository.save(expense(van05, "Insurance", "12000.00",LocalDate.now().minusDays(15)));
        }
        if (trk03 != null) {
            expenseRepository.save(expense(trk03, "Toll",     "2200.00", LocalDate.now().minusDays(2)));
            expenseRepository.save(expense(trk03, "Parts",    "4500.00", LocalDate.now().minusDays(7)));
        }
        if (tmp02 != null) {
            expenseRepository.save(expense(tmp02, "Fine",     "1500.00", LocalDate.now().minusDays(6)));
        }
    }

    // ─── helpers ──────────────────────────────────────────────────────────────

    private User user(String name, String email, String pw, Role role) {
        User u = new User();
        u.setName(name); u.setEmail(email); u.setPassword(pw); u.setRole(role);
        return u;
    }

    private Vehicle vehicle(String regNo, String name, String type, Double maxKg,
                            Double odometer, String acquisition, String region,
                            String revenue, VehicleStatus status) {
        Vehicle v = new Vehicle();
        v.setRegNo(regNo); v.setName(name); v.setType(type);
        v.setMaxLoadKg(maxKg); v.setOdometer(odometer);
        v.setAcquisitionCost(new BigDecimal(acquisition));
        v.setRegion(region);
        v.setRevenue(new BigDecimal(revenue));
        v.setStatus(status);
        return v;
    }

    private Driver driver(String name, String licNo, String cat,
                          LocalDate expiry, String contact, int score, DriverStatus status) {
        Driver d = new Driver();
        d.setName(name); d.setLicenseNo(licNo); d.setLicenseCategory(cat);
        d.setLicenseExpiry(expiry); d.setContact(contact);
        d.setSafetyScore(score); d.setStatus(status);
        return d;
    }

    private Trip completedTrip(Vehicle v, Driver d, String src, String dst,
                               double cargo, double dist, double finalOdo, double fuel) {
        Trip t = new Trip();
        t.setVehicle(v); t.setDriver(d);
        t.setSource(src); t.setDestination(dst);
        t.setCargoWeightKg(cargo); t.setPlannedDistance(dist);
        t.setStatus(TripStatus.COMPLETED);
        t.setFinalOdometer(finalOdo);
        t.setFuelConsumed(fuel);
        return t;
    }

    private Trip dispatchedTrip(Vehicle v, Driver d, String src, String dst, double cargo, double dist) {
        Trip t = new Trip();
        t.setVehicle(v); t.setDriver(d);
        t.setSource(src); t.setDestination(dst);
        t.setCargoWeightKg(cargo); t.setPlannedDistance(dist);
        t.setStatus(TripStatus.DISPATCHED);
        return t;
    }

    private Trip draftTrip(Vehicle v, Driver d, String src, String dst, double cargo, double dist) {
        Trip t = new Trip();
        t.setVehicle(v); t.setDriver(d);
        t.setSource(src); t.setDestination(dst);
        t.setCargoWeightKg(cargo); t.setPlannedDistance(dist);
        t.setStatus(TripStatus.DRAFT);
        return t;
    }

    private FuelLog fuelLog(Vehicle v, double liters, String cost, LocalDate date) {
        FuelLog f = new FuelLog();
        f.setVehicle(v); f.setLiters(liters);
        f.setCost(new BigDecimal(cost)); f.setDate(date);
        return f;
    }

    private Expense expense(Vehicle v, String type, String amount, LocalDate date) {
        Expense e = new Expense();
        e.setVehicle(v); e.setType(type);
        e.setAmount(new BigDecimal(amount)); e.setDate(date);
        return e;
    }

    private Vehicle find(List<Vehicle> list, String regNo) {
        return list.stream().filter(v -> v.getRegNo().equals(regNo)).findFirst().orElse(null);
    }

    private Driver findDriver(List<Driver> list, String name) {
        return list.stream().filter(d -> d.getName().equals(name)).findFirst().orElse(null);
    }
}
