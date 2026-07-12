package com.transitops.enums;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum TripStatus {
    DRAFT("Draft"),
    DISPATCHED("Dispatched"),
    COMPLETED("Completed"),
    CANCELLED("Cancelled");

    private final String label;

    TripStatus(String label) {
        this.label = label;
    }

    @JsonValue
    public String getLabel() {
        return label;
    }

    @JsonCreator
    public static TripStatus from(String value) {
        for (TripStatus s : values()) {
            if (s.label.equalsIgnoreCase(value) || s.name().equalsIgnoreCase(value)) {
                return s;
            }
        }
        throw new IllegalArgumentException("Unknown TripStatus: " + value);
    }
}
