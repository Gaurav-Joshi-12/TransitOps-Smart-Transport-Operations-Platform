package com.transitops.dto;

import lombok.Data;

@Data
public class TripCompleteRequest {
    private Double finalOdometer;
    private Double fuelConsumed;
}
