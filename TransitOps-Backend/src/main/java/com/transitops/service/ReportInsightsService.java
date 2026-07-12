package com.transitops.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.transitops.enums.VehicleStatus;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;
import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class ReportInsightsService {

    private final ReportService reportService;
    private final ObjectMapper objectMapper;
    private final RestTemplate restTemplate;
    private final String apiKey;

    public ReportInsightsService(ReportService reportService, 
                                 ObjectMapper objectMapper, 
                                 RestTemplateBuilder restTemplateBuilder,
                                 @Value("${mistral.api-key}") String apiKey) {
        this.reportService = reportService;
        this.objectMapper = objectMapper;
        this.apiKey = apiKey;
        this.restTemplate = restTemplateBuilder
                .setConnectTimeout(Duration.ofSeconds(3))
                .setReadTimeout(Duration.ofSeconds(8))
                .build();
    }

    public Map<String, Object> generateInsights(String type, VehicleStatus status, String region) {
        Map<String, Object> response = new HashMap<>();
        response.put("generatedAt", Instant.now().toString());

        try {
            // 1. Gather Data
            Map<String, Object> reportData = new HashMap<>();
            reportData.put("dashboard", reportService.getDashboardKpis(type, status, region));
            reportData.put("fuelEfficiency", reportService.getFuelEfficiency());
            reportData.put("fleetUtilization", reportService.getFleetUtilization());
            reportData.put("operationalCost", reportService.getOperationalCost());
            reportData.put("vehicleRoi", reportService.getVehicleRoi());

            String jsonData = objectMapper.writeValueAsString(reportData);

            // 2. Prepare Prompt
            String systemPrompt = "You are a fleet operations analyst. Given this JSON fleet report data, "
                    + "write a 3-5 sentence plain-language summary highlighting the most notable trend or outlier "
                    + "(e.g., vehicles with unusually low fuel efficiency, high operational costs, or negative ROI). "
                    + "NOTE: All monetary values in the data are in Indian Rupees (INR), so use the '₹' symbol for any currency values. "
                    + "No markdown, no headers, no bullet points \u2014 plain prose only.";

            Map<String, Object> systemMessage = Map.of("role", "system", "content", systemPrompt);
            Map<String, Object> userMessage = Map.of("role", "user", "content", jsonData);

            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("model", "mistral-small-latest");
            requestBody.put("messages", List.of(systemMessage, userMessage));

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(apiKey);

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);

            // 3. Call Mistral
            ResponseEntity<Map> mistralResponse = restTemplate.postForEntity(
                    "https://api.mistral.ai/v1/chat/completions",
                    request,
                    Map.class
            );

            // 4. Parse Response
            if (mistralResponse.getStatusCode().is2xxSuccessful() && mistralResponse.getBody() != null) {
                List<Map<String, Object>> choices = (List<Map<String, Object>>) mistralResponse.getBody().get("choices");
                if (choices != null && !choices.isEmpty()) {
                    Map<String, Object> message = (Map<String, Object>) choices.get(0).get("message");
                    response.put("insights", message.get("content"));
                    return response;
                }
            }
            throw new RuntimeException("Invalid response from Mistral API");
        } catch (Exception e) {
            System.err.println("Mistral API Error: " + e.getMessage());
            response.put("insights", "Insights are temporarily unavailable \u2014 showing raw data below.");
        }
        return response;
    }
}
