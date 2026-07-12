package com.transitops.entity;

import com.transitops.enums.TripStatus;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.Instant;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@Entity
@Table(name = "trips")
@Data
@NoArgsConstructor
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Trip {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String source;
    private String destination;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vehicle_id")
    private Vehicle vehicle;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "driver_id")
    private Driver driver;

    private Double cargoWeightKg;
    private Double plannedDistance;

    @Enumerated(EnumType.STRING)
    private TripStatus status;

    private Double finalOdometer;
    private Double fuelConsumed;

    private Instant createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = Instant.now();
    }
}
