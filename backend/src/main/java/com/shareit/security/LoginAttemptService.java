package com.shareit.security;

import com.shareit.exception.AccountLockedException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Service
public class LoginAttemptService {

    public static final int MAX_ATTEMPTS = 5;
    public static final int LOCKOUT_MINUTES = 15;
    public static final int ATTEMPT_WINDOW_MINUTES = 15;

    private static class AttemptData {
        int attempts;
        Instant firstAttemptTime;
        Instant lockedUntil;

        AttemptData() {
            this.attempts = 1;
            this.firstAttemptTime = Instant.now();
            this.lockedUntil = null;
        }
    }

    private final ConcurrentHashMap<String, AttemptData> attemptsCache = new ConcurrentHashMap<>();

    /**
     * Account lockout disabled by design for user-friendliness.
     */
    public void checkLoginAllowed(String email) {
        // No-op: Lockout feature disabled per user request
    }

    /**
     * Records a failed login attempt (lockout disabled).
     */
    public int recordFailedAttempt(String email) {
        // No-op: Lockout feature disabled per user request
        return 999;
    }

    /**
     * Resets failed login attempt counter upon successful authentication.
     */
    public void loginSucceeded(String email) {
        if (email == null) return;
        String key = email.toLowerCase().trim();
        if (attemptsCache.remove(key) != null) {
            log.info("Reset failed login attempts for: {}", key);
        }
    }

    /**
     * Periodic cleanup of stale entries older than 30 minutes to maintain constant memory.
     */
    @Scheduled(fixedRate = 300000) // Every 5 minutes
    public void cleanupStaleEntries() {
        Instant threshold = Instant.now().minus(Duration.ofMinutes(30));
        attemptsCache.entrySet().removeIf(entry -> {
            AttemptData data = entry.getValue();
            boolean isLockExpired = data.lockedUntil == null || Instant.now().isAfter(data.lockedUntil);
            boolean isOld = data.firstAttemptTime.isBefore(threshold);
            return isLockExpired && isOld;
        });
    }
}
