package com.shareit.service;

import com.shareit.model.RefreshToken;
import com.shareit.model.User;
import com.shareit.repository.RefreshTokenRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;

@Slf4j
@Service
public class RefreshTokenService {

    private final RefreshTokenRepository refreshTokenRepository;
    private final long refreshExpirationMs;
    private final SecureRandom secureRandom = new SecureRandom();

    public RefreshTokenService(
            RefreshTokenRepository refreshTokenRepository,
            @Value("${jwt.refresh-expiration-ms:604800000}") long refreshExpirationMs
    ) {
        this.refreshTokenRepository = refreshTokenRepository;
        this.refreshExpirationMs = refreshExpirationMs;
    }

    @Transactional
    public RefreshToken createRefreshToken(User user) {
        // Generate a 48-byte cryptographically random token string
        byte[] randomBytes = new byte[48];
        secureRandom.nextBytes(randomBytes);
        String tokenString = Base64.getUrlEncoder().withoutPadding().encodeToString(randomBytes);

        RefreshToken refreshToken = RefreshToken.builder()
                .user(user)
                .token(tokenString)
                .expiryDate(Instant.now().plusMillis(refreshExpirationMs))
                .revoked(false)
                .build();

        return refreshTokenRepository.save(refreshToken);
    }

    @Transactional
    public RefreshToken rotateRefreshToken(String tokenString) {
        RefreshToken existingToken = refreshTokenRepository.findByToken(tokenString)
                .orElseThrow(() -> new BadCredentialsException("Invalid refresh token. Please sign in again."));

        if (existingToken.isRevoked()) {
            // Check for concurrent rotation grace window (60 seconds)
            // Allows concurrent requests from the same user session during page load or network reconnect
            if (existingToken.getRevokedAt() != null &&
                    existingToken.getRevokedAt().isAfter(Instant.now().minusSeconds(60))) {
                java.util.Optional<RefreshToken> activeToken = refreshTokenRepository
                        .findTopByUserAndRevokedFalseOrderByCreatedAtDesc(existingToken.getUser());
                if (activeToken.isPresent() && activeToken.get().getExpiryDate().isAfter(Instant.now())) {
                    log.info("Concurrent refresh token request within 60s grace window handled smoothly for user: {}", existingToken.getUser().getEmail());
                    return activeToken.get();
                }
            }

            // Security: If a revoked token is used AFTER the grace period, an attacker might be trying to reuse an intercepted token.
            log.warn("🚨 Suspicious token reuse attempt detected for user: {}", existingToken.getUser().getEmail());
            refreshTokenRepository.deleteByUser(existingToken.getUser());
            throw new BadCredentialsException("Refresh token was previously revoked. All sessions invalidated for safety.");
        }

        if (existingToken.getExpiryDate().isBefore(Instant.now())) {
            refreshTokenRepository.delete(existingToken);
            throw new BadCredentialsException("Refresh token has expired. Please sign in again.");
        }

        // Revoke the old refresh token with timestamp
        existingToken.setRevoked(true);
        existingToken.setRevokedAt(Instant.now());
        refreshTokenRepository.save(existingToken);

        // Issue a brand-new rotated refresh token
        return createRefreshToken(existingToken.getUser());
    }

    @Transactional
    public void revokeToken(String tokenString) {
        if (tokenString != null && !tokenString.trim().isEmpty()) {
            refreshTokenRepository.findByToken(tokenString.trim())
                    .ifPresent(token -> {
                        token.setRevoked(true);
                        token.setRevokedAt(Instant.now());
                        refreshTokenRepository.save(token);
                    });
        }
    }

    /**
     * Daily background cron job running at 03:00 AM to purge expired or revoked refresh tokens from PostgreSQL.
     */
    @Scheduled(cron = "${app.refresh-token.cleanup-cron:0 0 3 * * *}")
    @Transactional
    public void purgeExpiredTokens() {
        try {
            log.info("🧹 Starting scheduled cleanup of expired and revoked refresh tokens...");
            refreshTokenRepository.deleteAllExpiredOrRevoked(Instant.now());
            log.info("✅ Refresh token database cleanup completed successfully.");
        } catch (Exception e) {
            log.error("❌ Failed to purge expired refresh tokens from database: {}", e.getMessage(), e);
        }
    }
}
