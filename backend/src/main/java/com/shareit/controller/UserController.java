package com.shareit.controller;

import com.shareit.dto.ChangePasswordRequest;
import com.shareit.dto.DeleteAccountRequest;
import com.shareit.dto.UpdateProfileRequest;
import com.shareit.dto.UserProfileDto;
import com.shareit.dto.UserTrustDto;
import com.shareit.service.UserService;
import com.shareit.service.UserTrustService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class UserController {

    private final UserService userService;
    private final UserTrustService userTrustService;

    @GetMapping("/profile")
    public ResponseEntity<UserProfileDto> getCurrentUserProfile(Authentication authentication) {
        return ResponseEntity.ok(userService.getUserProfile(authentication.getName()));
    }

    @PutMapping("/profile")
    public ResponseEntity<UserProfileDto> updateProfile(
            Authentication authentication,
            @Valid @RequestBody UpdateProfileRequest request
    ) {
        return ResponseEntity.ok(userService.updateProfile(authentication.getName(), request));
    }

    @PutMapping("/change-password")
    public ResponseEntity<?> changePassword(
            Authentication authentication,
            @Valid @RequestBody ChangePasswordRequest request
    ) {
        userService.changePassword(authentication.getName(), request);
        return ResponseEntity.ok(Map.of("message", "Password changed successfully! 🔒"));
    }

    @DeleteMapping("/account")
    public ResponseEntity<?> deactivateAccount(
            Authentication authentication,
            @Valid @RequestBody DeleteAccountRequest request
    ) {
        userService.deactivateAccount(authentication.getName(), request);
        return ResponseEntity.ok(Map.of("message", "Account has been deactivated successfully."));
    }

    @GetMapping("/{userId}/public-profile")
    public ResponseEntity<UserProfileDto> getPublicProfile(@PathVariable Long userId) {
        return ResponseEntity.ok(userService.getPublicProfile(userId));
    }

    @GetMapping("/{userId}/trust-score")
    public ResponseEntity<UserTrustDto> getUserTrustScore(@PathVariable Long userId) {
        return ResponseEntity.ok(userTrustService.getTrustScore(userId));
    }
}
