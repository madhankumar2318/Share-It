package com.shareit.security;

import org.springframework.stereotype.Service;

/**
 * Service for tracking login attempts (lockouts disabled per user request).
 */
@Service
public class LoginAttemptService {

    public void checkLoginAllowed(String email) {
        // No-op: Lockout feature disabled per user request
    }

    public int recordFailedAttempt(String email) {
        // No-op: Lockout feature disabled per user request
        return 999;
    }

    public void loginSucceeded(String email) {
        // No-op: Lockout feature disabled per user request
    }
}
