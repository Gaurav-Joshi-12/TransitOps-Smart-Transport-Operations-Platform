package com.transitops.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.transitops.dto.ChatRequest;
import com.transitops.dto.ChatResponse;
import com.transitops.enums.DriverStatus;
import com.transitops.enums.VehicleStatus;
import com.transitops.repository.DriverRepository;
import com.transitops.repository.VehicleRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class ChatService {

    private final DriverRepository driverRepository;
    private final VehicleRepository vehicleRepository;
    private final ReportService reportService;
    private final DriverService driverService;
    private final ObjectMapper objectMapper;
    private final RestTemplate restTemplate;
    private final String apiKey;

    public ChatService(DriverRepository driverRepository,
                       VehicleRepository vehicleRepository,
                       ReportService reportService,
                       DriverService driverService,
                       ObjectMapper objectMapper,
                       RestTemplateBuilder restTemplateBuilder,
                       @Value("${mistral.api-key:}") String apiKey) {
        this.driverRepository = driverRepository;
        this.vehicleRepository = vehicleRepository;
        this.reportService = reportService;
        this.driverService = driverService;
        this.objectMapper = objectMapper;
        this.apiKey = apiKey;
        this.restTemplate = restTemplateBuilder
                .setConnectTimeout(Duration.ofSeconds(5))
                .setReadTimeout(Duration.ofSeconds(8))
                .build();
    }

    public ChatResponse processMessage(ChatRequest request) {
        try {
            // STEP 1: Intent Classification
            String systemPrompt1 = "Classify the user's question into exactly one of these intents:\n" +
                    "- license_expiry_check: params { withinDays?: number (default 30) }\n" +
                    "- fuel_cost_by_region: params { region: string }\n" +
                    "- vehicle_status_count: params { status: \"Available\" | \"On Trip\" | \"In Shop\" | \"Retired\" }\n" +
                    "- driver_availability: params { }\n" +
                    "- vehicle_roi_lookup: params { vehicleRegNo?: string, vehicleName?: string }\n" +
                    "- unknown: params { }\n\n" +
                    "Return ONLY valid JSON in the form {\"intent\": \"...\", \"params\": {...}}. No other text. " +
                    "If the question doesn't clearly match an intent, return {\"intent\": \"unknown\", \"params\": {}}.";

            String json1 = callMistral(systemPrompt1, request.getMessage());
            Map<String, Object> classification = parseJson(json1);
            if (classification == null) {
                return new ChatResponse(getFallbackMessage(), "unknown");
            }

            String intent = (String) classification.get("intent");
            Map<String, Object> params = (Map<String, Object>) classification.getOrDefault("params", new HashMap<>());

            if (intent == null || intent.equals("unknown")) {
                return new ChatResponse(getFallbackMessage(), "unknown");
            }

            // STEP 2: Routing
            Object data = null;
            try {
                switch (intent) {
                    case "license_expiry_check":
                        int days = params.containsKey("withinDays") ? ((Number) params.get("withinDays")).intValue() : 30;
                        data = driverRepository.findByLicenseExpiryBefore(LocalDate.now().plusDays(days));
                        break;
                    case "fuel_cost_by_region":
                        String region = (String) params.get("region");
                        data = reportService.getOperationalCostByRegion(region);
                        break;
                    case "vehicle_status_count":
                        String statusStr = (String) params.get("status");
                        VehicleStatus vs = statusStr != null ? VehicleStatus.valueOf(statusStr.toUpperCase().replace(" ", "_")) : null;
                        if (vs != null) {
                            data = vehicleRepository.countByStatus(vs);
                        } else {
                            data = "Status parameter missing or invalid";
                        }
                        break;
                    case "driver_availability":
                        data = driverService.getDrivers(DriverStatus.AVAILABLE);
                        break;
                    case "vehicle_roi_lookup":
                        String regNo = (String) params.get("vehicleRegNo");
                        if (regNo != null) {
                            data = reportService.getVehicleRoiByRegNo(regNo);
                        } else {
                            data = "Vehicle registration number not provided";
                        }
                        break;
                    default:
                        return new ChatResponse(getFallbackMessage(), "unknown");
                }
            } catch (Exception ex) {
                System.err.println("Error fetching data for intent " + intent + ": " + ex.getMessage());
                data = "Could not fetch data for this request.";
            }

            // STEP 3: Answer Phrasing
            String dataJson = objectMapper.writeValueAsString(data);
            String systemPrompt2 = "Given this JSON data fetched from the database, answer the user's original question in 1-3 sentences of plain, natural language. No markdown, no bullet points. Data:\n" + dataJson;
            
            String answer = callMistral(systemPrompt2, request.getMessage());
            return new ChatResponse(answer, intent);

        } catch (Exception e) {
            System.err.println("Mistral API Chat Error: " + e.getMessage());
            return new ChatResponse("Something went wrong answering that \u2014 try again in a moment.", "error");
        }
    }

    private String getFallbackMessage() {
        return "I can help with driver license expiry, fuel costs by region, vehicle status counts, driver availability, and vehicle ROI. Try rephrasing your question around one of those.";
    }

    private Map<String, Object> parseJson(String text) {
        try {
            // Strip markdown formatting if the model accidentally returns it (e.g. ```json ... ```)
            text = text.trim();
            if (text.startsWith("```json")) text = text.substring(7);
            else if (text.startsWith("```")) text = text.substring(3);
            if (text.endsWith("```")) text = text.substring(0, text.length() - 3);
            return objectMapper.readValue(text.trim(), new TypeReference<Map<String, Object>>() {});
        } catch (JsonProcessingException e) {
            System.err.println("Failed to parse Mistral JSON response: " + text);
            return null;
        }
    }

    private String callMistral(String systemContent, String userContent) {
        if (apiKey == null || apiKey.isEmpty()) {
            throw new RuntimeException("Mistral API key is not configured.");
        }
        Map<String, Object> systemMessage = Map.of("role", "system", "content", systemContent);
        Map<String, Object> userMessage = Map.of("role", "user", "content", userContent);

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("model", "mistral-small-latest");
        requestBody.put("messages", List.of(systemMessage, userMessage));
        requestBody.put("temperature", 0.1);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(apiKey);

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);

        ResponseEntity<Map> mistralResponse = restTemplate.postForEntity(
                "https://api.mistral.ai/v1/chat/completions",
                request,
                Map.class
        );

        if (mistralResponse.getStatusCode().is2xxSuccessful() && mistralResponse.getBody() != null) {
            List<Map<String, Object>> choices = (List<Map<String, Object>>) mistralResponse.getBody().get("choices");
            if (choices != null && !choices.isEmpty()) {
                Map<String, Object> message = (Map<String, Object>) choices.get(0).get("message");
                return (String) message.get("content");
            }
        }
        throw new RuntimeException("Invalid response from Mistral API");
    }
}
