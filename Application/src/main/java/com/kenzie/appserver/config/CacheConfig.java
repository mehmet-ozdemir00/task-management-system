package com.kenzie.appserver.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.cache.annotation.EnableCaching;

import java.util.concurrent.TimeUnit;

/**
 * Configuration class for setting up caching in the application.
 * This class enables caching and provides a {@link CacheStore} bean with
 * a default expiration time of 120 seconds. The CacheStore can be used to
 * store and manage cached data efficiently.
 */
@Configuration
@EnableCaching
public class CacheConfig {
    @Bean
    public CacheStore cacheStore() {
        return new CacheStore(120, TimeUnit.SECONDS);
    }
}
