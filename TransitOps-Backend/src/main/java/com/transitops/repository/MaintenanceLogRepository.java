package com.transitops.repository;

import com.transitops.entity.MaintenanceLog;
import com.transitops.enums.MaintenanceStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface MaintenanceLogRepository extends JpaRepository<MaintenanceLog, Long> {
    List<MaintenanceLog> findByVehicleId(Long vehicleId);
    List<MaintenanceLog> findByStatus(MaintenanceStatus status);
    List<MaintenanceLog> findByVehicleIdAndStatus(Long vehicleId, MaintenanceStatus status);
}
