package com.shareit.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class DatabaseMigrationRunner implements CommandLineRunner {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) {
        try {
            log.info("Running schema migration to drop unused columns from users table...");
            jdbcTemplate.execute("ALTER TABLE users DROP COLUMN IF EXISTS state;");
            jdbcTemplate.execute("ALTER TABLE users DROP COLUMN IF EXISTS district;");
            jdbcTemplate.execute("ALTER TABLE users DROP COLUMN IF EXISTS city;");
            jdbcTemplate.execute("ALTER TABLE users DROP COLUMN IF EXISTS pincode;");
            log.info("Unused columns successfully dropped from users table in database.");

            log.info("Ensuring borrow_requests OTP verification columns exist...");
            jdbcTemplate.execute("ALTER TABLE borrow_requests ADD COLUMN IF NOT EXISTS pickup_otp VARCHAR(10);");
            jdbcTemplate.execute("ALTER TABLE borrow_requests ADD COLUMN IF NOT EXISTS return_otp VARCHAR(10);");
            jdbcTemplate.execute("ALTER TABLE borrow_requests ADD COLUMN IF NOT EXISTS handover_at TIMESTAMP;");
            jdbcTemplate.execute("ALTER TABLE borrow_requests ADD COLUMN IF NOT EXISTS returned_at TIMESTAMP;");
            jdbcTemplate.execute("ALTER TABLE borrow_requests ADD COLUMN IF NOT EXISTS pickup_photo_url VARCHAR(500);");
            jdbcTemplate.execute("ALTER TABLE borrow_requests ADD COLUMN IF NOT EXISTS pickup_condition_note VARCHAR(500);");
            jdbcTemplate.execute("ALTER TABLE borrow_requests ADD COLUMN IF NOT EXISTS return_photo_url VARCHAR(500);");
            jdbcTemplate.execute("ALTER TABLE borrow_requests ADD COLUMN IF NOT EXISTS return_condition_note VARCHAR(500);");
            log.info("borrow_requests schema verified successfully.");
        } catch (Exception e) {
            log.warn("Migration warning: {}", e.getMessage());
        }
    }
}
