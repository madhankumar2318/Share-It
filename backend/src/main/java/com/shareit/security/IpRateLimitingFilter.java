package com.shareit.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.lang.NonNull;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * IP-Based Rate Limiting Filter.
 * Protects public endpoints from automated scrapers, denial-of-service floods,
 * and registration spam by capping requests per client IP address.
 */
@Slf4j
@Component
public class IpRateLimitingFilter extends OncePerRequestFilter {

    private final int maxRequestsPerMinute;
    private final int maxRegistrationsPerWindow;
    private static final long WINDOW_MS = 60_000L; // 1 minute sliding window for general requests
    private static final long REGISTER_WINDOW_MS = 15 * 60_000L; // 15 minutes window for account registration

    private static class IpRequestTracker {
        final AtomicInteger count = new AtomicInteger(1);
        final long windowStartMs;

        IpRequestTracker(long windowStartMs) {
            this.windowStartMs = windowStartMs;
        }
    }

    private final ConcurrentHashMap<String, IpRequestTracker> ipTrackerCache = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, IpRequestTracker> registerTrackerCache = new ConcurrentHashMap<>();

    public IpRateLimitingFilter(
            @Value("${app.rate-limit.max-per-minute:100}") int maxRequestsPerMinute,
            @Value("${app.rate-limit.register-max:10}") int maxRegistrationsPerWindow
    ) {
        this.maxRequestsPerMinute = maxRequestsPerMinute;
        this.maxRegistrationsPerWindow = maxRegistrationsPerWindow;
    }

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {

        // 1. Always bypass CORS preflight OPTIONS requests
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            filterChain.doFilter(request, response);
            return;
        }

        // 2. Bypass internal Render container health checks
        String path = request.getRequestURI();
        if ("/api/health".equals(path) || "/".equals(path)) {
            filterChain.doFilter(request, response);
            return;
        }

        String clientIp = extractClientIp(request);
        long now = System.currentTimeMillis();

        // 3. Stricter Sub-Bucket: Account Registration Abuse & Sybil/Bot Attack Prevention
        if ("POST".equalsIgnoreCase(request.getMethod()) && "/api/auth/register".equals(path)) {
            IpRequestTracker regTracker = registerTrackerCache.compute(clientIp, (ip, existing) -> {
                if (existing == null || (now - existing.windowStartMs) >= REGISTER_WINDOW_MS) {
                    return new IpRequestTracker(now);
                }
                existing.count.incrementAndGet();
                return existing;
            });

            if (regTracker.count.get() > maxRegistrationsPerWindow) {
                log.warn("🚨 Registration rate limit exceeded for client IP: {} ({} registrations in current 15m window)",
                        clientIp, regTracker.count.get());

                response.setStatus(429);
                response.setContentType("application/json");
                response.setCharacterEncoding("UTF-8");
                response.setHeader("Retry-After", "900");
                response.getWriter().write(
                        "{\"status\":429,\"error\":\"Too Many Requests\",\"message\":\"🚨 Too many registration attempts from your IP address. For security and spam prevention, please wait 15 minutes before registering another account.\"}"
                );
                return;
            }
        }

        // 4. Global Sliding Window Rate Limiting (100 req/min)
        IpRequestTracker tracker = ipTrackerCache.compute(clientIp, (ip, existing) -> {
            if (existing == null || (now - existing.windowStartMs) >= WINDOW_MS) {
                return new IpRequestTracker(now);
            }
            existing.count.incrementAndGet();
            return existing;
        });

        if (tracker.count.get() > maxRequestsPerMinute) {
            log.warn("🚨 Rate limit exceeded for client IP: {} on URI: {} ({} requests in current minute)",
                    clientIp, path, tracker.count.get());

            response.setStatus(429); // HTTP 429 Too Many Requests
            response.setContentType("application/json");
            response.setCharacterEncoding("UTF-8");
            response.setHeader("Retry-After", "60");
            response.getWriter().write(
                    "{\"status\":429,\"error\":\"Too Many Requests\",\"message\":\"🚨 Rate limit exceeded. Too many requests from your IP. Please wait a moment and try again.\"}"
            );
            return;
        }

        filterChain.doFilter(request, response);
    }

    /**
     * Resolves the real client IP address through cloud proxies, reverse proxies, and load balancers.
     */
    private String extractClientIp(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.trim().isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }

        String xRealIp = request.getHeader("X-Real-IP");
        if (xRealIp != null && !xRealIp.trim().isEmpty()) {
            return xRealIp.trim();
        }

        return request.getRemoteAddr();
    }

    /**
     * Periodic cleanup running every 5 minutes to evict stale IP counters and keep memory constant.
     */
    @Scheduled(fixedRate = 300000)
    public void cleanupOldEntries() {
        long now = System.currentTimeMillis();
        long generalThreshold = now - (2 * WINDOW_MS);
        ipTrackerCache.entrySet().removeIf(entry -> entry.getValue().windowStartMs < generalThreshold);

        long registerThreshold = now - (2 * REGISTER_WINDOW_MS);
        registerTrackerCache.entrySet().removeIf(entry -> entry.getValue().windowStartMs < registerThreshold);
    }
}
