package com.transitops.enums;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum MaintenanceStatus {
    OPEN("Open"),
    CLOSED("Closed");

    private final String label;

    MaintenanceStatus(String label) {
        this.label = label;
    }

    @JsonValue
    public String getLabel() {
        return label;
    }

    @JsonCreator
    public static MaintenanceStatus from(String value) {
        for (MaintenanceStatus s : values()) {
            if (s.label.equalsIgnoreCase(value) || s.name().equalsIgnoreCase(value)) {
                return s;
            }
        }
        throw new IllegalArgumentException("Unknown MaintenanceStatus: " + value);
    }
}
