package com.shareit.config;

import org.springframework.boot.autoconfigure.orm.jpa.EntityManagerFactoryDependsOnPostProcessor;
import org.springframework.stereotype.Component;

/**
 * Ensures DatabaseMigrationRunner executes its schema migrations before
 * Hibernate's EntityManagerFactory initializes, preventing missing column errors.
 */
@Component
public class DatabaseMigrationDependsOnPostProcessor extends EntityManagerFactoryDependsOnPostProcessor {

    public DatabaseMigrationDependsOnPostProcessor() {
        super("databaseMigrationRunner");
    }
}
