package com.shareit.security;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Date;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Thread-safe token invalidation service.
 * Tracks JWT signatures revoked upon user logout and rejects any subsequent access.
 * Automatically evicts naturally expired tokens via periodic scheduling to maintain bounded memory.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class TokenBlacklistService {

    private final JwtService jwtService;

    // Thread-safe map holding: token -> natural expiration Instant
    private final ConcurrentHashMap<String, Instant> blacklist = new ConcurrentHashMap<>();

    /**
     * Invalidate and blacklist an active JWT token until its expiration timestamp.
     *
     * @param token Bearer JWT token string
     */
    public void blacklistToken(String token) {
        if (token == null || token.trim().isEmpty()) {
            return;
        }

        String cleanToken = token.trim();
        try {
            Date expirationDate = jwtService.extractExpiration(cleanToken);
            Instant expiresAt = expirationDate != null ? expirationDate.toInstant() : Instant.now().plusSeconds(86400);

            // Only track if not already expired
            if (Instant.now().isBefore(expiresAt)) {
                blacklist.put(cleanToken, expiresAt);
                log.info("Token successfully revoked on logout and blacklisted until {}", expiresAt);
            }
        } catch (Exception e) {
            // If token parsing fails, fallback to 24-hour safeguard invalidation
            blacklist.put(cleanToken, Instant.now().plusSeconds(86400));
            log.warn("Revoked token could not be parsed for expiration; blacklisted with 24h safeguard duration");
        }
    }

    /**
     * Checks if a token has been revoked on logout.
     *
     * @param token Bearer JWT token string
     * @return true if token is currently blacklisted, false otherwise
     */
    public boolean isBlacklisted(String token) {
        if (token == null || token.trim().isEmpty()) {
            return false;
        }

        String cleanToken = token.trim();
        Instant expiresAt = blacklist.get(cleanToken);
        if (expiresAt == null) {
            return false;
        }

        // If the token has naturally expired, remove it and consider expired
        if (Instant.now().isAfter(expiresAt)) {
            blacklist.remove(cleanToken);
            return false;
        }

        return true;
    }

    /**
     * Scheduled cleanup every 10 minutes to evict naturally expired tokens from the cache.
     */
    @Scheduled(fixedRate = 600000)
    public void cleanupExpiredTokens() {
        Instant now = Instant.now();
        int initialSize = blacklist.size();
        blacklist.entrySet().removeIf(entry -> now.isAfter(entry.getValue()));
        int removedCount = initialSize - blacklist.size();
        if (removedCount > 0) {
            log.info("Evicted {} expired tokens from logout blacklist cache", removedCount);
        }
    }
}
