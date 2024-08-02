package com.kenzie.appserver.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.task.TaskExecutor;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.util.concurrent.ConcurrentLinkedQueue;

/**
 * Configuration class for setting up a custom {@link TaskExecutor}.
 * This configuration defines a thread pool with a core and maximum
 * pool size of 4 threads and initializes it with a specific thread name prefix.
 */
@Configuration
public class ExecutorServiceConfig {

    @Bean
    public TaskExecutor executorService() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(4);
        executor.setMaxPoolSize(4);
        executor.setThreadNamePrefix("default_task_executor_thread");
        executor.initialize();
        return executor;
    }
}