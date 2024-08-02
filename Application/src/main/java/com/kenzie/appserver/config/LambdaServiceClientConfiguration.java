package com.kenzie.appserver.config;

import com.kenzie.capstone.service.client.LambdaServiceClient;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Configuration class for creating and managing a {@link LambdaServiceClient} bean.
 * This class provides the necessary configuration to instantiate and configure
 * the LambdaServiceClient, which can be used for interacting with AWS Lambda services.
 */
@Configuration
public class LambdaServiceClientConfiguration {

    @Bean
    public LambdaServiceClient lambdaServiceClient() {
        return new LambdaServiceClient();
    }
}