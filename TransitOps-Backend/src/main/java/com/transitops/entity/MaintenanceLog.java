package com.transitops.entity;

import com.transitops.enums.MaintenanceStatus;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.Instant;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@Entity
@Table(name = "maintenance_logs")
@Data
@NoArgsConstructor
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class MaintenanceLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vehicle_id")
    private Vehicle vehicle;

    private String description;
    private BigDecimal cost;

    @Enumerated(EnumType.STRING)
    private MaintenanceStatus status;

    private Instant openedAt;
    private Instant closedAt;

    @PrePersist
    protected void onCreate() {
        if (openedAt == null) openedAt = Instant.now();
    }
}
