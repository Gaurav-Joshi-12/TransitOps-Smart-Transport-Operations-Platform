package com.transitops.dto;

import com.transitops.enums.DriverStatus;
import lombok.Data;

@Data
public class DriverStatusUpdateRequest {
    private DriverStatus status;
    private Integer safetyScore;
}
