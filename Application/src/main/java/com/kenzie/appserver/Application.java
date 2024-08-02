package com.kenzie.appserver;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * Main entry point for the Spring Boot application.
 * This class is annotated with {@link SpringBootApplication} to enable
 * component scanning, autoconfiguration, and property support.
 * It also enables caching and scheduling features through {@link EnableCaching}
 * and {@link EnableScheduling} annotations.
 */
@EnableCaching
@EnableScheduling
@SpringBootApplication
public class Application {
    public static void main(String[] args) {
        SpringApplication.run(Application.class, args);
    }
}