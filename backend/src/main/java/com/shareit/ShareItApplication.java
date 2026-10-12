package com.shareit;

import io.github.cdimascio.dotenv.Dotenv;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

import java.net.URI;

@SpringBootApplication
@EnableScheduling
public class ShareItApplication {

    public static void main(String[] args) {
        // 1. Load .env variables into System properties if .env exists
        try {
            Dotenv dotenv = Dotenv.configure().ignoreIfMissing().load();
            dotenv.entries().forEach(entry -> {
                if (System.getProperty(entry.getKey()) == null) {
                    System.setProperty(entry.getKey(), entry.getValue());
                }
            });
        } catch (Exception ignored) {
        }

        // 2. Enforce secure SSL connection (sslmode=require) on remote/cloud PostgreSQL connections
        enforcePostgresSslMode();

        SpringApplication.run(ShareItApplication.class, args);
    }

    /**
     * Inspects the database URL from System properties or Environment variables.
     * If pointing to a remote PostgreSQL host (Render, Neon, Supabase, AWS RDS, etc.)
     * and sslmode is not explicitly specified, automatically appends sslmode=require
     * to guarantee end-to-end TLS encryption in transit.
     */
    private static void enforcePostgresSslMode() {
        String dbUrl = System.getProperty("DB_URL");
        if (dbUrl == null || dbUrl.isBlank()) {
            dbUrl = System.getenv("DB_URL");
        }
        if (dbUrl == null || dbUrl.isBlank()) {
            dbUrl = System.getenv("DATABASE_URL");
        }

        if (dbUrl == null || dbUrl.isBlank()) {
            return;
        }

        String trimmed = dbUrl.trim();

        // Convert standard postgres URI (e.g. postgres://user:pass@host/db) to JDBC format if needed
        if (trimmed.startsWith("postgres://") || trimmed.startsWith("postgresql://")) {
            try {
                URI uri = URI.create(trimmed);
                String userInfo = uri.getUserInfo();
                String host = uri.getHost();
                int port = uri.getPort() != -1 ? uri.getPort() : 5432;
                String path = uri.getPath();

                if (userInfo != null && userInfo.contains(":")) {
                    String[] creds = userInfo.split(":", 2);
                    if (System.getProperty("DB_USERNAME") == null && System.getenv("DB_USERNAME") == null) {
                        System.setProperty("DB_USERNAME", creds[0]);
                    }
                    if (System.getProperty("DB_PASSWORD") == null && System.getenv("DB_PASSWORD") == null) {
                        System.setProperty("DB_PASSWORD", creds[1]);
                    }
                }

                trimmed = "jdbc:postgresql://" + host + ":" + port + path;
            } catch (Exception ignored) {
            }
        }

        // Only enforce on remote PostgreSQL connections (skip localhost, 127.0.0.1, and in-memory H2)
        boolean isPostgres = trimmed.startsWith("jdbc:postgresql:");
        boolean isLocal = trimmed.contains("localhost") || trimmed.contains("127.0.0.1") || trimmed.contains("[::1]");
        boolean isH2 = trimmed.contains(":h2:");

        if (isPostgres && !isLocal && !isH2) {
            if (!trimmed.toLowerCase().contains("sslmode=")) {
                String separator = trimmed.contains("?") ? "&" : "?";
                trimmed = trimmed + separator + "sslmode=require";
                System.out.println("🔒 Enforcing PostgreSQL SSL encryption in transit: sslmode=require appended to DB_URL");
            }
            System.setProperty("DB_URL", trimmed);
            System.setProperty("spring.datasource.url", trimmed);
        } else if (trimmed.startsWith("jdbc:postgresql:")) {
            System.setProperty("DB_URL", trimmed);
            System.setProperty("spring.datasource.url", trimmed);
        }
    }
}
