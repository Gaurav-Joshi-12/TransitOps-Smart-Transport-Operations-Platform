package com.transitops.entity;

import com.transitops.enums.VehicleStatus;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;

@Entity
@Table(name = "vehicles", indexes = {
    @Index(name = "idx_vehicle_reg_no", columnList = "regNo", unique = true)
})
@Data
@NoArgsConstructor
public class Vehicle {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String regNo;

    private String name;
    private String type;
    private Double maxLoadKg;
    private Double odometer;
    private BigDecimal acquisitionCost;
    private String region;

    @Column
    private BigDecimal revenue = BigDecimal.ZERO;

    @Enumerated(EnumType.STRING)
    private VehicleStatus status;
}
