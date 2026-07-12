package com.transitops.repository;

import com.transitops.entity.FuelLog;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface FuelLogRepository extends JpaRepository<FuelLog, Long> {
    List<FuelLog> findByVehicleId(Long vehicleId);
}
