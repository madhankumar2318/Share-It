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
     * Checks whether login is permitted for the given email.
     * Throws AccountLockedException if the account is currently in lockout.
     */
    public void checkLoginAllowed(String email) {
        if (email == null) return;
        String key = email.toLowerCase().trim();
        AttemptData data = attemptsCache.get(key);

        if (data != null && data.lockedUntil != null) {
            Instant now = Instant.now();
            if (now.isBefore(data.lockedUntil)) {
                long minutesRemaining = Duration.between(now, data.lockedUntil).toMinutes() + 1;
                log.warn("Blocked login attempt for locked account: {}. Lockout remaining: {} minute(s)", key, minutesRemaining);
                throw new AccountLockedException("🚨 Account temporarily locked! Too many failed password attempts. Please try again in " + minutesRemaining + " minute(s).");
            } else {
                // Lockout has expired -> reset
                attemptsCache.remove(key);
                log.info("Account lockout expired and cleared for: {}", key);
            }
        }
    }

    /**
     * Records a failed login attempt for the given email.
     * If failed attempts reach MAX_ATTEMPTS, locks the account for LOCKOUT_MINUTES
     * and throws AccountLockedException. Otherwise returns the remaining attempts.
     */
    public int recordFailedAttempt(String email) {
        if (email == null) return MAX_ATTEMPTS;
        String key = email.toLowerCase().trim();
        Instant now = Instant.now();

        AttemptData data = attemptsCache.compute(key, (k, existing) -> {
            if (existing == null) {
                return new AttemptData();
            }

            // If existing window expired without lockout, reset to fresh attempt
            if (existing.lockedUntil == null && Duration.between(existing.firstAttemptTime, now).toMinutes() >= ATTEMPT_WINDOW_MINUTES) {
                return new AttemptData();
            }

            existing.attempts++;
            if (existing.attempts >= MAX_ATTEMPTS) {
                existing.lockedUntil = now.plus(Duration.ofMinutes(LOCKOUT_MINUTES));
            }
            return existing;
        });

        if (data.attempts >= MAX_ATTEMPTS) {
            log.warn("🚨 Account locked for {}: reached {} consecutive failed login attempts.", key, MAX_ATTEMPTS);
            throw new AccountLockedException("🚨 Account temporarily locked for " + LOCKOUT_MINUTES + " minutes due to too many failed password attempts.");
        }

        int remaining = MAX_ATTEMPTS - data.attempts;
        log.info("Failed login attempt {}/{} for {}. Remaining attempts: {}", data.attempts, MAX_ATTEMPTS, key, remaining);
        return remaining;
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
