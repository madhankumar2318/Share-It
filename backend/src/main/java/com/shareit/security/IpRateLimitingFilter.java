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
    private static final long WINDOW_MS = 60_000L; // 1 minute sliding window

    private static class IpRequestTracker {
        final AtomicInteger count = new AtomicInteger(1);
        final long windowStartMs;

        IpRequestTracker(long windowStartMs) {
            this.windowStartMs = windowStartMs;
        }
    }

    private final ConcurrentHashMap<String, IpRequestTracker> ipTrackerCache = new ConcurrentHashMap<>();

    public IpRateLimitingFilter(@Value("${app.rate-limit.max-per-minute:100}") int maxRequestsPerMinute) {
        this.maxRequestsPerMinute = maxRequestsPerMinute;
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
        long threshold = System.currentTimeMillis() - (2 * WINDOW_MS);
        ipTrackerCache.entrySet().removeIf(entry -> entry.getValue().windowStartMs < threshold);
    }
}
