package com.shareit.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {
    private String token;
    private String refreshToken;
    private Long id;
    private String fullName;
    private String email;
    private String role;
    private String phone;
    private String neighborhood;
    private String bio;
    private String avatarUrl;
}
