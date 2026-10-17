package com.shareit.config;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component("databaseMigrationRunner")
@RequiredArgsConstructor
@Slf4j
public class DatabaseMigrationRunner implements CommandLineRunner {

    private final JdbcTemplate jdbcTemplate;

    @PostConstruct
    public void init() {
        migrate();
    }

    @Override
    public void run(String... args) {
        migrate();
    }

    public synchronized void migrate() {
        try {
            log.info("Running schema migration checks...");

            // 1. Users table migrations (ensure all columns exist and active defaults to true)
            try {
                jdbcTemplate.execute("ALTER TABLE users DROP COLUMN IF EXISTS state;");
                jdbcTemplate.execute("ALTER TABLE users DROP COLUMN IF EXISTS district;");
                jdbcTemplate.execute("ALTER TABLE users DROP COLUMN IF EXISTS city;");
                jdbcTemplate.execute("ALTER TABLE users DROP COLUMN IF EXISTS pincode;");
                jdbcTemplate.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(50);");
                jdbcTemplate.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS neighborhood VARCHAR(150);");
                jdbcTemplate.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS bio VARCHAR(1000);");
                jdbcTemplate.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(500);");
                jdbcTemplate.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'USER';");
                jdbcTemplate.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT TRUE;");
                jdbcTemplate.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;");
                jdbcTemplate.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;");
                jdbcTemplate.execute("UPDATE users SET active = TRUE WHERE active IS NULL;");
                jdbcTemplate.execute("UPDATE users SET role = 'USER' WHERE role IS NULL;");
                log.info("Users table schema verified successfully (active=true, role, profile fields).");
            } catch (Exception e) {
                log.warn("Notice during users migration: {}", e.getMessage());
            }

            // 2. Items table migrations
            try {
                jdbcTemplate.execute("ALTER TABLE items ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION;");
                jdbcTemplate.execute("ALTER TABLE items ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;");
                jdbcTemplate.execute("ALTER TABLE items ADD COLUMN IF NOT EXISTS daily_rate DOUBLE PRECISION DEFAULT 0.0;");
                jdbcTemplate.execute("ALTER TABLE items ADD COLUMN IF NOT EXISTS security_deposit DOUBLE PRECISION DEFAULT 0.0;");
                jdbcTemplate.execute("UPDATE items SET daily_rate = 0.0 WHERE daily_rate IS NULL;");
                jdbcTemplate.execute("UPDATE items SET security_deposit = 0.0 WHERE security_deposit IS NULL;");
                // Repair coordinates for any items where location is in Musiri or PIN 621211 but coordinates were set to default Bangalore or null
                jdbcTemplate.execute("UPDATE items SET latitude = 10.9387, longitude = 78.4418 WHERE (LOWER(location) LIKE '%musiri%' OR location LIKE '%621211%') AND (latitude > 12.0 OR latitude IS NULL);");
                jdbcTemplate.execute("UPDATE items SET latitude = 10.7905, longitude = 78.7047 WHERE (LOWER(location) LIKE '%tiruchirappalli%' OR LOWER(location) LIKE '%trichy%') AND LOWER(location) NOT LIKE '%musiri%' AND (latitude > 12.0 OR latitude IS NULL);");
                log.info("Items table schema verified successfully (daily_rate, security_deposit, coordinates).");
            } catch (Exception e) {
                log.warn("Notice during items migration: {}", e.getMessage());
            }

            // 3. Borrow Requests table migrations
            try {
                jdbcTemplate.execute("ALTER TABLE borrow_requests ADD COLUMN IF NOT EXISTS pickup_otp VARCHAR(10);");
                jdbcTemplate.execute("ALTER TABLE borrow_requests ADD COLUMN IF NOT EXISTS return_otp VARCHAR(10);");
                jdbcTemplate.execute("ALTER TABLE borrow_requests ADD COLUMN IF NOT EXISTS handover_at TIMESTAMP;");
                jdbcTemplate.execute("ALTER TABLE borrow_requests ADD COLUMN IF NOT EXISTS returned_at TIMESTAMP;");
                jdbcTemplate.execute("ALTER TABLE borrow_requests ADD COLUMN IF NOT EXISTS pickup_photo_url VARCHAR(500);");
                jdbcTemplate.execute("ALTER TABLE borrow_requests ADD COLUMN IF NOT EXISTS pickup_condition_note VARCHAR(500);");
                jdbcTemplate.execute("ALTER TABLE borrow_requests ADD COLUMN IF NOT EXISTS return_photo_url VARCHAR(500);");
                jdbcTemplate.execute("ALTER TABLE borrow_requests ADD COLUMN IF NOT EXISTS return_condition_note VARCHAR(500);");

                jdbcTemplate.execute("ALTER TABLE borrow_requests ADD COLUMN IF NOT EXISTS extension_proposed_end_date DATE;");
                jdbcTemplate.execute("ALTER TABLE borrow_requests ADD COLUMN IF NOT EXISTS extension_status VARCHAR(50);");
                jdbcTemplate.execute("ALTER TABLE borrow_requests ADD COLUMN IF NOT EXISTS extension_reason VARCHAR(500);");

                jdbcTemplate.execute("ALTER TABLE borrow_requests ADD COLUMN IF NOT EXISTS pickup_attempts INTEGER DEFAULT 0;");
                jdbcTemplate.execute("ALTER TABLE borrow_requests ADD COLUMN IF NOT EXISTS pickup_lockout_until TIMESTAMP;");
                jdbcTemplate.execute("ALTER TABLE borrow_requests ADD COLUMN IF NOT EXISTS return_attempts INTEGER DEFAULT 0;");
                jdbcTemplate.execute("ALTER TABLE borrow_requests ADD COLUMN IF NOT EXISTS return_lockout_until TIMESTAMP;");
                jdbcTemplate.execute("ALTER TABLE borrow_requests ADD COLUMN IF NOT EXISTS last_reminder_sent_at TIMESTAMP;");

                // Contactless Porch & Security Guard Drop-off/Collection
                jdbcTemplate.execute("ALTER TABLE borrow_requests ADD COLUMN IF NOT EXISTS dropoff_status VARCHAR(30);");
                jdbcTemplate.execute("ALTER TABLE borrow_requests ADD COLUMN IF NOT EXISTS dropoff_location VARCHAR(255);");
                jdbcTemplate.execute("ALTER TABLE borrow_requests ADD COLUMN IF NOT EXISTS dropoff_passcode VARCHAR(20);");
                jdbcTemplate.execute("ALTER TABLE borrow_requests ADD COLUMN IF NOT EXISTS dropoff_photo_url VARCHAR(500);");
                jdbcTemplate.execute("ALTER TABLE borrow_requests ADD COLUMN IF NOT EXISTS dropoff_note VARCHAR(500);");
                jdbcTemplate.execute("ALTER TABLE borrow_requests ADD COLUMN IF NOT EXISTS dropped_off_at TIMESTAMP;");
                jdbcTemplate.execute("ALTER TABLE borrow_requests ADD COLUMN IF NOT EXISTS collected_at TIMESTAMP;");

                jdbcTemplate.execute("ALTER TABLE borrow_requests ADD COLUMN IF NOT EXISTS return_dropoff_status VARCHAR(30);");
                jdbcTemplate.execute("ALTER TABLE borrow_requests ADD COLUMN IF NOT EXISTS return_dropoff_location VARCHAR(255);");
                jdbcTemplate.execute("ALTER TABLE borrow_requests ADD COLUMN IF NOT EXISTS return_dropoff_passcode VARCHAR(20);");
                jdbcTemplate.execute("ALTER TABLE borrow_requests ADD COLUMN IF NOT EXISTS return_dropoff_photo_url VARCHAR(500);");
                jdbcTemplate.execute("ALTER TABLE borrow_requests ADD COLUMN IF NOT EXISTS return_dropoff_note VARCHAR(500);");
                jdbcTemplate.execute("ALTER TABLE borrow_requests ADD COLUMN IF NOT EXISTS return_dropped_off_at TIMESTAMP;");
                jdbcTemplate.execute("ALTER TABLE borrow_requests ADD COLUMN IF NOT EXISTS return_collected_at TIMESTAMP;");

                // Rental pricing, caution deposit and net refund settlement
                jdbcTemplate.execute("ALTER TABLE borrow_requests ADD COLUMN IF NOT EXISTS daily_rate DOUBLE PRECISION DEFAULT 0.0;");
                jdbcTemplate.execute("ALTER TABLE borrow_requests ADD COLUMN IF NOT EXISTS security_deposit DOUBLE PRECISION DEFAULT 0.0;");
                jdbcTemplate.execute("ALTER TABLE borrow_requests ADD COLUMN IF NOT EXISTS total_days INTEGER DEFAULT 1;");
                jdbcTemplate.execute("ALTER TABLE borrow_requests ADD COLUMN IF NOT EXISTS total_rental_fee DOUBLE PRECISION DEFAULT 0.0;");
                jdbcTemplate.execute("ALTER TABLE borrow_requests ADD COLUMN IF NOT EXISTS refund_amount DOUBLE PRECISION DEFAULT 0.0;");
                jdbcTemplate.execute("ALTER TABLE borrow_requests ADD COLUMN IF NOT EXISTS payment_status VARCHAR(30) DEFAULT 'FREE';");
                jdbcTemplate.execute("ALTER TABLE borrow_requests ADD COLUMN IF NOT EXISTS advance_paid_at TIMESTAMP;");
                jdbcTemplate.execute("ALTER TABLE borrow_requests ADD COLUMN IF NOT EXISTS refund_settled_at TIMESTAMP;");

                log.info("Borrow requests schema verified successfully.");
            } catch (Exception e) {
                log.warn("Notice during borrow_requests migration: {}", e.getMessage());
            }

            // 4. Refresh Tokens table migration (critical for authentication & session rotation)
            try {
                jdbcTemplate.execute(
                    "CREATE TABLE IF NOT EXISTS refresh_tokens (" +
                    "  id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY," +
                    "  token VARCHAR(128) NOT NULL UNIQUE," +
                    "  user_id BIGINT NOT NULL," +
                    "  expiry_date TIMESTAMP NOT NULL," +
                    "  revoked BOOLEAN NOT NULL DEFAULT FALSE," +
                    "  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP" +
                    ");"
                );
                try {
                    jdbcTemplate.execute("CREATE INDEX IF NOT EXISTS idx_refresh_token_token ON refresh_tokens(token);");
                    jdbcTemplate.execute("CREATE INDEX IF NOT EXISTS idx_refresh_token_user_id ON refresh_tokens(user_id);");
                } catch (Exception ignored) {
                    // Index already exists or handled by DB
                }
                log.info("Refresh tokens table schema verified successfully.");
            } catch (Exception e) {
                log.warn("Notice during refresh_tokens migration: {}", e.getMessage());
            }

            // 5. Stored files table migration (for permanent image storage in PostgreSQL)
            try {
                jdbcTemplate.execute(
                    "CREATE TABLE IF NOT EXISTS stored_files (" +
                    "  id VARCHAR(150) PRIMARY KEY," +
                    "  original_name VARCHAR(255)," +
                    "  content_type VARCHAR(100)," +
                    "  data BYTEA," +
                    "  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP" +
                    ");"
                );
                log.info("Stored files table schema verified successfully.");
            } catch (Exception e) {
                log.warn("Notice during stored_files migration: {}", e.getMessage());
            }

            log.info("All database migration checks completed successfully.");
        } catch (Exception e) {
            log.warn("Migration warning: {}", e.getMessage());
        }
    }
}
