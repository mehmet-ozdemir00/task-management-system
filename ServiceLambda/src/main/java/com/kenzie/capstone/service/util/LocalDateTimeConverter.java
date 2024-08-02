package com.kenzie.capstone.service.util;

import com.amazonaws.services.dynamodbv2.datamodeling.DynamoDBTypeConverter;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

/**
 * Handles conversion between LocalDateTime and String.
 */
public class LocalDateTimeConverter implements DynamoDBTypeConverter<String, LocalDateTime> {

    private static final DateTimeFormatter DATE_TIME_FORMATTER = DateTimeFormatter.ISO_LOCAL_DATE_TIME;
    @Override
    public String convert(LocalDateTime dateTime) {
        return dateTime.format(DATE_TIME_FORMATTER);
    }

    @Override
    public LocalDateTime unconvert(String dateTimeRepresentation) {
        return LocalDateTime.parse(dateTimeRepresentation, DATE_TIME_FORMATTER);
    }
}
