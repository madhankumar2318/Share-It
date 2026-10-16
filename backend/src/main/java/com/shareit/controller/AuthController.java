package com.shareit.controller;

import com.shareit.dto.AuthResponse;
import com.shareit.dto.LoginRequest;
import com.shareit.dto.RegisterRequest;
import com.shareit.service.AuthService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private static final long REFRESH_COOKIE_MAX_AGE_SECONDS = 7 * 24 * 60 * 60; // 7 days

    @org.springframework.beans.factory.annotation.Value("${app.cors.allowed-origins:https://share-it-ashen.vercel.app,https://*.vercel.app,http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173,http://localhost:4173}")
    private String allowedOrigins;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        AuthResponse response = authService.register(request);
        ResponseCookie cookie = createRefreshTokenCookie(response.getRefreshToken(), REFRESH_COOKIE_MAX_AGE_SECONDS);
        return ResponseEntity.status(HttpStatus.CREATED)
                .header(HttpHeaders.SET_COOKIE, cookie.toString())
                .body(response);
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        ResponseCookie cookie = createRefreshTokenCookie(response.getRefreshToken(), REFRESH_COOKIE_MAX_AGE_SECONDS);
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, cookie.toString())
                .body(response);
    }

    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refresh(
            HttpServletRequest request,
            @RequestBody(required = false) Map<String, String> body
    ) {
        // CSRF / Cross-Origin Protection for SameSite=None cookie requests
        validateOriginOrReferer(request);

        String refreshToken = extractRefreshToken(request, body);
        if (refreshToken == null || refreshToken.trim().isEmpty()) {
            throw new BadCredentialsException("Refresh token is required to issue a new access token.");
        }

        AuthResponse response = authService.refreshAccessToken(refreshToken);
        ResponseCookie cookie = createRefreshTokenCookie(response.getRefreshToken(), REFRESH_COOKIE_MAX_AGE_SECONDS);
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, cookie.toString())
                .body(response);
    }

    @PostMapping("/logout")
    public ResponseEntity<Map<String, String>> logout(
            HttpServletRequest request,
            @RequestBody(required = false) Map<String, String> body
    ) {
        String authHeader = request.getHeader("Authorization");
        String accessToken = (authHeader != null && authHeader.startsWith("Bearer "))
                ? authHeader.substring(7)
                : null;

        String refreshToken = extractRefreshToken(request, body);
        authService.logout(accessToken, refreshToken);

        ResponseCookie deleteCookie = createRefreshTokenCookie("", 0);
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, deleteCookie.toString())
                .body(Map.of("message", "Logged out successfully 🚪"));
    }

    private ResponseCookie createRefreshTokenCookie(String token, long maxAgeSeconds) {
        return ResponseCookie.from("refreshToken", token)
                .httpOnly(true)
                .secure(true)
                .path("/api/auth")
                .maxAge(maxAgeSeconds)
                .sameSite("None")
                .build();
    }

    private String extractRefreshToken(HttpServletRequest request, Map<String, String> body) {
        // 1. Try reading from HttpOnly Cookie first
        if (request.getCookies() != null) {
            for (Cookie cookie : request.getCookies()) {
                if ("refreshToken".equals(cookie.getName()) && cookie.getValue() != null && !cookie.getValue().isBlank()) {
                    return cookie.getValue().trim();
                }
            }
        }
        // 2. Fallback to JSON request body for clients with strict third-party cookie blocking
        if (body != null && body.containsKey("refreshToken") && body.get("refreshToken") != null) {
            return body.get("refreshToken").trim();
        }
        return null;
    }

    private void validateOriginOrReferer(HttpServletRequest request) {
        String origin = request.getHeader("Origin");
        String referer = request.getHeader("Referer");

        // Native apps or tools without browser Origin/Referer headers (like Postman or curl with manual tokens)
        if (origin == null && referer == null) {
            return;
        }

        String[] allowedList = allowedOrigins.split(",");
        String source = origin != null ? origin.trim() : referer.trim();

        boolean isAllowed = false;
        for (String allowed : allowedList) {
            String trimmed = allowed.trim();
            if (trimmed.contains("*.vercel.app") && source.contains("vercel.app")) {
                isAllowed = true;
                break;
            }
            if (!trimmed.isEmpty() && source.startsWith(trimmed)) {
                isAllowed = true;
                break;
            }
        }

        if (!isAllowed) {
            throw new BadCredentialsException("Cross-Origin request blocked. Untrusted Origin: " + source);
        }
    }
}
