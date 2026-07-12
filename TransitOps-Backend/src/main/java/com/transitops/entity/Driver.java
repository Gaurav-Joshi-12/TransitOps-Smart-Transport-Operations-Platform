package com.transitops.entity;

import com.transitops.enums.DriverStatus;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;

@Entity
@Table(name = "drivers")
@Data
@NoArgsConstructor
public class Driver {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    @Column(unique = true, nullable = false)
    private String licenseNo;

    private String licenseCategory;
    private LocalDate licenseExpiry;
    private String contact;
    private Integer safetyScore;

    @Enumerated(EnumType.STRING)
    private DriverStatus status;
}
