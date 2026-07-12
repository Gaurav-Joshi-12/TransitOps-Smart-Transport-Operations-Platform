package com.transitops.controller;

import com.transitops.dto.DashboardKpis;
import com.transitops.enums.VehicleStatus;
import com.transitops.service.ReportService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class ReportController {

    private final ReportService reportService;

    public ReportController(ReportService reportService) {
        this.reportService = reportService;
    }

    @GetMapping("/dashboard/kpis")
    public ResponseEntity<DashboardKpis> getDashboardKpis(
            @RequestParam(required = false) String type,
            @RequestParam(required = false) VehicleStatus status,
            @RequestParam(required = false) String region) {
        return ResponseEntity.ok(reportService.getDashboardKpis(type, status, region));
    }

    @GetMapping("/reports/fuel-efficiency")
    public ResponseEntity<List<Map<String, Object>>> getFuelEfficiency() {
        return ResponseEntity.ok(reportService.getFuelEfficiency());
    }

    @GetMapping("/reports/fleet-utilization")
    public ResponseEntity<List<Map<String, Object>>> getFleetUtilization() {
        return ResponseEntity.ok(reportService.getFleetUtilization());
    }

    @GetMapping("/reports/operational-cost")
    public ResponseEntity<List<Map<String, Object>>> getOperationalCost() {
        return ResponseEntity.ok(reportService.getOperationalCost());
    }

    @GetMapping("/reports/vehicle-roi")
    public ResponseEntity<List<Map<String, Object>>> getVehicleRoi() {
        return ResponseEntity.ok(reportService.getVehicleRoi());
    }

    @GetMapping("/reports/export/csv")
    public ResponseEntity<String> exportCsv(@RequestParam String type) {
        String csv = reportService.exportCsv(type);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + type + "-export.csv\"")
                .header(HttpHeaders.CONTENT_TYPE, "text/csv")
                .body(csv);
    }
}
