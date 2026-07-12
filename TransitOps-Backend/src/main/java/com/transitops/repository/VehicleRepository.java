package com.transitops.repository;

import com.transitops.entity.Vehicle;
import com.transitops.enums.VehicleStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface VehicleRepository extends JpaRepository<Vehicle, Long> {
    boolean existsByRegNo(String regNo);
    List<Vehicle> findByType(String type);
    List<Vehicle> findByStatus(VehicleStatus status);
    List<Vehicle> findByRegion(String region);
    List<Vehicle> findByTypeAndStatus(String type, VehicleStatus status);
    long countByStatus(VehicleStatus status);
}
