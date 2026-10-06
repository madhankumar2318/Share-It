package com.shareit.service;

import com.shareit.dto.ChangePasswordRequest;
import com.shareit.dto.DeleteAccountRequest;
import com.shareit.dto.UpdateProfileRequest;
import com.shareit.dto.UserProfileDto;
import com.shareit.model.Item;
import com.shareit.model.ItemStatus;
import com.shareit.model.User;
import com.shareit.repository.BorrowRequestRepository;
import com.shareit.repository.ItemRepository;
import com.shareit.repository.UserRepository;
import com.shareit.security.CustomUserDetails;
import com.shareit.security.JwtService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final JwtService jwtService;
    private final AuditLogService auditLogService;
    private final PasswordEncoder passwordEncoder;
    private final BorrowRequestRepository borrowRequestRepository;
    private final ItemRepository itemRepository;

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

    @Transactional
    public void changePassword(String email, ChangePasswordRequest request) {
        User user = userRepository.findByEmail(email.toLowerCase().trim())
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + email));

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new IllegalArgumentException("Current password is incorrect. Please try again.");
        }

        if (passwordEncoder.matches(request.getNewPassword(), user.getPassword())) {
            throw new IllegalArgumentException("New password cannot be the same as your current password.");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        auditLogService.log(
                "USER_PASSWORD_CHANGED",
                "USER",
                user.getId(),
                email,
                "Password successfully updated for user: " + user.getFullName()
        );
    }

    @Transactional
    public void deactivateAccount(String email, DeleteAccountRequest request) {
        User user = userRepository.findByEmail(email.toLowerCase().trim())
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + email));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new IllegalArgumentException("Incorrect password. Account deactivation cancelled.");
        }

        // Verify user has no active ongoing borrows or lends
        if (borrowRequestRepository.hasActiveBorrowedItems(user.getId())) {
            throw new IllegalStateException("Cannot deactivate account while you have active items currently borrowed or on loan. Please complete all returns first.");
        }

        // Mark all owner's items as UNAVAILABLE so other neighbors don't see them
        List<Item> userItems = itemRepository.findByOwnerId(user.getId());
        for (Item item : userItems) {
            item.setStatus(ItemStatus.UNAVAILABLE);
        }
        itemRepository.saveAll(userItems);

        // Deactivate account
        user.setActive(false);
        userRepository.save(user);

        auditLogService.log(
                "USER_ACCOUNT_DEACTIVATED",
                "USER",
                user.getId(),
                email,
                "User account deactivated. Reason: " + (request.getReason() != null ? request.getReason() : "User requested")
        );
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
