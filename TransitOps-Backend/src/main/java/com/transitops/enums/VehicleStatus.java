package com.transitops.enums;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum VehicleStatus {
    AVAILABLE("Available"),
    ON_TRIP("On Trip"),
    IN_SHOP("In Shop"),
    RETIRED("Retired");

    private final String label;

    VehicleStatus(String label) {
        this.label = label;
    }

    @JsonValue
    public String getLabel() {
        return label;
    }

    @JsonCreator
    public static VehicleStatus from(String value) {
        for (VehicleStatus s : values()) {
            if (s.label.equalsIgnoreCase(value) || s.name().equalsIgnoreCase(value)) {
                return s;
            }
        }
        throw new IllegalArgumentException("Unknown VehicleStatus: " + value);
    }
}
