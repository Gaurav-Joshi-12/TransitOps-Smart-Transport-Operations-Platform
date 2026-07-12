package com.transitops.repository;

import com.transitops.entity.Driver;
import com.transitops.enums.DriverStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface DriverRepository extends JpaRepository<Driver, Long> {
    boolean existsByLicenseNo(String licenseNo);
    List<Driver> findByStatus(DriverStatus status);
}
