package com.transitops.repository;

import com.transitops.entity.Trip;
import com.transitops.enums.TripStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface TripRepository extends JpaRepository<Trip, Long> {
    List<Trip> findByStatus(TripStatus status);
}
