package com.shareit.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserProfileDto {
    private Long id;
    private String fullName;
    private String email;
    private String phone;
    private String neighborhood;
    private String bio;
    private String avatarUrl;
    private String role;
    private LocalDateTime createdAt;
    private String token; // Non-null if email changed requiring new token
}
