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

            // 1. Users table migrations (ensure active column exists and defaults to true)
            try {
                jdbcTemplate.execute("ALTER TABLE users DROP COLUMN IF EXISTS state;");
                jdbcTemplate.execute("ALTER TABLE users DROP COLUMN IF EXISTS district;");
                jdbcTemplate.execute("ALTER TABLE users DROP COLUMN IF EXISTS city;");
                jdbcTemplate.execute("ALTER TABLE users DROP COLUMN IF EXISTS pincode;");
                jdbcTemplate.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT TRUE;");
                jdbcTemplate.execute("UPDATE users SET active = TRUE WHERE active IS NULL;");
                log.info("Users table schema verified successfully (active=true).");
            } catch (Exception e) {
                log.warn("Notice during users migration: {}", e.getMessage());
            }

            // 2. Items table migrations
            try {
                jdbcTemplate.execute("ALTER TABLE items ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION;");
                jdbcTemplate.execute("ALTER TABLE items ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;");
                jdbcTemplate.execute("ALTER TABLE items ADD COLUMN IF NOT EXISTS daily_rate DOUBLE PRECISION DEFAULT 0.0;");
                jdbcTemplate.execute("UPDATE items SET daily_rate = 0.0 WHERE daily_rate IS NULL;");
                jdbcTemplate.execute("UPDATE items SET security_deposit = 0.0 WHERE security_deposit IS NULL;");

                // Toy & Book Rotate, Seasonal Vault, and Voice Note Care Guide migrations
                jdbcTemplate.execute("ALTER TABLE items ADD COLUMN IF NOT EXISTS age_group VARCHAR(30);");
                jdbcTemplate.execute("ALTER TABLE items ADD COLUMN IF NOT EXISTS is_cleaned_sanitized BOOLEAN DEFAULT FALSE;");
                jdbcTemplate.execute("ALTER TABLE items ADD COLUMN IF NOT EXISTS seasonal_tag VARCHAR(50) DEFAULT 'NONE';");
                jdbcTemplate.execute("ALTER TABLE items ADD COLUMN IF NOT EXISTS seasonal_active BOOLEAN DEFAULT TRUE;");
                jdbcTemplate.execute("ALTER TABLE items ADD COLUMN IF NOT EXISTS voice_note_url VARCHAR(500);");
                jdbcTemplate.execute("ALTER TABLE items ADD COLUMN IF NOT EXISTS voice_note_duration INTEGER;");
                log.info("Items table schema verified successfully (daily_rate, security_deposit, coordinates, age_group, seasonal_tag, voice_note_url).");
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

            log.info("All database migration checks completed successfully.");
        } catch (Exception e) {
            log.warn("Migration warning: {}", e.getMessage());
        }
    }
}
