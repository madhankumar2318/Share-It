package com.shareit;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.ApplicationContext;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;

import static org.junit.jupiter.api.Assertions.assertNotNull;

@SpringBootTest
@TestPropertySource(locations = "classpath:application-test.properties")
class SmokeTest {

    @Autowired
    private ApplicationContext applicationContext;

    @Autowired
    private SecurityFilterChain securityFilterChain;

    @Autowired
    private com.shareit.service.AuthService authService;

    @Test
    void contextLoadsSuccessfully() {
        assertNotNull(applicationContext, "ApplicationContext must load without errors");
        assertNotNull(securityFilterChain, "SecurityFilterChain must initialize with all filters in valid orders");
    }

    @Test
    void registerAndLoginWorkSuccessfully() {
        com.shareit.dto.RegisterRequest req = com.shareit.dto.RegisterRequest.builder()
                .fullName("Madhan")
                .email("testuser_local_1@example.com")
                .password("Password123@")
                .phone("+91 9876543210")
                .build();

        com.shareit.dto.AuthResponse res = authService.register(req);
        assertNotNull(res);
        assertNotNull(res.getToken());
        assertNotNull(res.getRefreshToken());

        com.shareit.dto.LoginRequest loginReq = com.shareit.dto.LoginRequest.builder()
                .email("testuser_local_1@example.com")
                .password("Password123@")
                .build();
        com.shareit.dto.AuthResponse loginRes = authService.login(loginReq);
        assertNotNull(loginRes);
        assertNotNull(loginRes.getToken());
    }
}
