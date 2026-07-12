package com.transitops.controller;

import com.transitops.dto.LoginRequest;
import com.transitops.dto.LoginResponse;
import com.transitops.service.AuthService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/register")
    public ResponseEntity<LoginResponse> register(@RequestBody com.transitops.dto.RegisterRequest request) {
        return ResponseEntity.ok(authService.register(request));
    }
}
