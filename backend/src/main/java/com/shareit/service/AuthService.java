package com.shareit.service;

import com.shareit.dto.AuthResponse;
import com.shareit.dto.LoginRequest;
import com.shareit.dto.RegisterRequest;
import com.shareit.model.Role;
import com.shareit.model.User;
import com.shareit.repository.UserRepository;
import com.shareit.security.CustomUserDetails;
import com.shareit.security.HtmlSanitizer;
import com.shareit.security.JwtService;
import com.shareit.security.TokenBlacklistService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final TokenBlacklistService tokenBlacklistService;
    private final RefreshTokenService refreshTokenService;
    private final AuthenticationManager authenticationManager;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String cleanEmail = request.getEmail().toLowerCase().trim();
        if (userRepository.existsByEmail(cleanEmail)) {
            throw new IllegalArgumentException("Email is already registered. Please log in or use another email.");
        }

        // Extract exact last 10 digits regardless of spaces, dashes, or +91 prefix
        String rawPhone = request.getPhone() != null ? request.getPhone().replaceAll("[^0-9]", "") : "";
        String tenDigitPhone = rawPhone.length() >= 10 ? rawPhone.substring(rawPhone.length() - 10) : rawPhone;

        if (!tenDigitPhone.isEmpty()) {
            if (userRepository.existsByNormalizedPhone(tenDigitPhone)) {
                throw new IllegalArgumentException("Mobile number is already registered with another account. Please use a different number.");
            }
        }

        // Canonical format stored in DB: +91 XXXXXXXXXX
        String formattedPhone = !tenDigitPhone.isEmpty() ? ("+91 " + tenDigitPhone) : null;

        User user = User.builder()
                .fullName(HtmlSanitizer.sanitize(request.getFullName()))
                .email(cleanEmail)
                .password(passwordEncoder.encode(request.getPassword()))
                .phone(formattedPhone)
                .role(Role.USER)
                .build();

        User savedUser = userRepository.save(user);
        CustomUserDetails userDetails = new CustomUserDetails(savedUser);
        String jwtToken = jwtService.generateToken(userDetails);
        com.shareit.model.RefreshToken refreshToken = refreshTokenService.createRefreshToken(savedUser);

        return AuthResponse.builder()
                .token(jwtToken)
                .refreshToken(refreshToken.getToken())
                .id(savedUser.getId())
                .fullName(savedUser.getFullName())
                .email(savedUser.getEmail())
                .role(savedUser.getRole().name())
                .phone(savedUser.getPhone())
                .neighborhood(savedUser.getNeighborhood())
                .bio(savedUser.getBio())
                .avatarUrl(savedUser.getAvatarUrl())
                .build();
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        String email = request.getEmail().toLowerCase().trim();

        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            email,
                            request.getPassword()
                    )
            );
        } catch (Exception e) {
            throw new BadCredentialsException("Invalid email or password. Please check your credentials and try again.");
        }

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        CustomUserDetails userDetails = new CustomUserDetails(user);
        String jwtToken = jwtService.generateToken(userDetails);
        com.shareit.model.RefreshToken refreshToken = refreshTokenService.createRefreshToken(user);

        return AuthResponse.builder()
                .token(jwtToken)
                .refreshToken(refreshToken.getToken())
                .id(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .role(user.getRole().name())
                .phone(user.getPhone())
                .neighborhood(user.getNeighborhood())
                .bio(user.getBio())
                .avatarUrl(user.getAvatarUrl())
                .build();
    }

    @Transactional
    public AuthResponse refreshAccessToken(String refreshTokenString) {
        com.shareit.model.RefreshToken newRefreshToken = refreshTokenService.rotateRefreshToken(refreshTokenString);
        User user = newRefreshToken.getUser();
        CustomUserDetails userDetails = new CustomUserDetails(user);
        String newAccessToken = jwtService.generateToken(userDetails);

        return AuthResponse.builder()
                .token(newAccessToken)
                .refreshToken(newRefreshToken.getToken())
                .id(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .role(user.getRole().name())
                .phone(user.getPhone())
                .neighborhood(user.getNeighborhood())
                .bio(user.getBio())
                .avatarUrl(user.getAvatarUrl())
                .build();
    }

    @Transactional
    public void logout(String accessToken, String refreshTokenString) {
        if (accessToken != null && !accessToken.trim().isEmpty()) {
            tokenBlacklistService.blacklistToken(accessToken);
        }
        if (refreshTokenString != null && !refreshTokenString.trim().isEmpty()) {
            refreshTokenService.revokeToken(refreshTokenString);
        }
    }
}
