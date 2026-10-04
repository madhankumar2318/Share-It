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
            jdbcTemplate.execute("ALTER TABLE users DROP COLUMN IF EXISTS address;");
            log.info("Unused columns successfully dropped from users table in database.");
        } catch (Exception e) {
            log.warn("Migration warning: {}", e.getMessage());
        }
    }
}
