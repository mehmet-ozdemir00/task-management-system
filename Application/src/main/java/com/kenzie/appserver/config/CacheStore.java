package com.kenzie.appserver.config;

import com.google.common.cache.Cache;
import com.google.common.cache.CacheBuilder;
import com.kenzie.appserver.repositories.model.TaskRecord;
import java.util.concurrent.TimeUnit;

/**
 * A class that provides a cache store for {@link TaskRecord} objects.
 * This cache allows for storing, retrieving, and evicting task records
 * with a specified expiry time.
 */
public class CacheStore {

    private final Cache<String, TaskRecord> cache ;

    public CacheStore(int expiry, TimeUnit timeUnit) {
        // Initializing the cache with a default expiry time of 120 seconds
        this.cache = CacheBuilder.newBuilder()
                .expireAfterWrite(expiry, timeUnit)
                .concurrencyLevel(Runtime.getRuntime().availableProcessors())
                .build();
    }

    public TaskRecord get(String key) {
        return cache.getIfPresent(key);
    }

    public void evict(String key) {
        cache.invalidate(key);
    }

    public void add(String key, TaskRecord value) {
        cache.put(key, value);
    }
}