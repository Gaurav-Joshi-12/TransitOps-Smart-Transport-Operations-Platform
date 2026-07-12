package com.transitops.service;

import com.transitops.dto.LoginRequest;
import com.transitops.dto.LoginResponse;
import com.transitops.dto.UserDto;
import com.transitops.entity.User;
import com.transitops.repository.UserRepository;
import com.transitops.security.JwtUtil;
import com.transitops.security.UserDetailsImpl;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final JwtUtil jwtUtil;
    private final UserRepository userRepository;

    public AuthService(AuthenticationManager authenticationManager, JwtUtil jwtUtil, UserRepository userRepository) {
        this.authenticationManager = authenticationManager;
        this.jwtUtil = jwtUtil;
        this.userRepository = userRepository;
    }

    public LoginResponse login(LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        String jwt = jwtUtil.generateToken(userDetails);
        User user = userDetails.getUser();

        UserDto userDto = new UserDto(user.getId(), user.getName(), user.getEmail(), user.getRole());

        return new LoginResponse(jwt, userDto);
    }
}
