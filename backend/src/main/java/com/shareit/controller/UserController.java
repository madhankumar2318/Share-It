package com.shareit.controller;

import com.shareit.dto.UserTrustDto;
import com.shareit.service.UserTrustService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class UserController {

    private final UserTrustService userTrustService;

    @GetMapping("/{userId}/trust-score")
    public ResponseEntity<UserTrustDto> getUserTrustScore(@PathVariable Long userId) {
        return ResponseEntity.ok(userTrustService.getTrustScore(userId));
    }
}
