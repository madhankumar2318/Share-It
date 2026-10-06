package com.shareit.service;

import com.shareit.dto.UpdateProfileRequest;
import com.shareit.dto.UserProfileDto;
import com.shareit.model.User;
import com.shareit.repository.UserRepository;
import com.shareit.security.CustomUserDetails;
import com.shareit.security.JwtService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final JwtService jwtService;
    private final AuditLogService auditLogService;

    @Transactional(readOnly = true)
    public UserProfileDto getUserProfile(String email) {
        User user = userRepository.findByEmail(email.toLowerCase().trim())
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + email));
        return mapToDto(user, null);
    }

    @Transactional
    public UserProfileDto updateProfile(String currentEmail, UpdateProfileRequest request) {
        User user = userRepository.findByEmail(currentEmail.toLowerCase().trim())
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + currentEmail));

        String newEmail = request.getEmail().toLowerCase().trim();
        String newToken = null;

        // If email is changing, ensure uniqueness and issue new JWT
        if (!newEmail.equalsIgnoreCase(user.getEmail())) {
            if (userRepository.existsByEmail(newEmail)) {
                throw new IllegalArgumentException("Email address " + newEmail + " is already in use by another neighbor.");
            }
            user.setEmail(newEmail);
            CustomUserDetails updatedUserDetails = new CustomUserDetails(user);
            newToken = jwtService.generateToken(updatedUserDetails);
        }

        user.setFullName(request.getFullName().trim());
        user.setPhone(request.getPhone() != null ? request.getPhone().trim() : null);
        user.setNeighborhood(request.getNeighborhood() != null ? request.getNeighborhood().trim() : null);
        user.setBio(request.getBio() != null ? request.getBio().trim() : null);
        user.setAvatarUrl(request.getAvatarUrl() != null && !request.getAvatarUrl().isBlank() ? request.getAvatarUrl().trim() : null);

        User savedUser = userRepository.save(user);

        auditLogService.log(
                "USER_PROFILE_UPDATED",
                "USER",
                savedUser.getId(),
                currentEmail,
                "Profile updated for user: " + savedUser.getFullName()
        );

        return mapToDto(savedUser, newToken);
    }

    @Transactional(readOnly = true)
    public UserProfileDto getPublicProfile(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Neighbor profile not found with ID: " + userId));

        return UserProfileDto.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .neighborhood(user.getNeighborhood())
                .bio(user.getBio())
                .avatarUrl(user.getAvatarUrl())
                .createdAt(user.getCreatedAt())
                .build();
    }

    private UserProfileDto mapToDto(User user, String token) {
        return UserProfileDto.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .neighborhood(user.getNeighborhood())
                .bio(user.getBio())
                .avatarUrl(user.getAvatarUrl())
                .role(user.getRole().name())
                .createdAt(user.getCreatedAt())
                .token(token)
                .build();
    }
}
