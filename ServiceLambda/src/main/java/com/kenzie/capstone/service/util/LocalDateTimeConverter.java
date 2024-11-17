package com.kenzie.capstone.service.util;

import com.amazonaws.services.dynamodbv2.datamodeling.DynamoDBTypeConverter;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;

/**
 * Handles conversion between LocalDateTime and String.
 */
public class LocalDateTimeConverter implements DynamoDBTypeConverter<String, LocalDateTime> {

    private static final DateTimeFormatter DATE_TIME_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss");

    @Override
    public String convert(LocalDateTime dateTime) {
        if (dateTime == null) {
            return null;
        }
        return dateTime.format(DATE_TIME_FORMATTER);
    }

    @Override
    public LocalDateTime unconvert(String dateTimeRepresentation) {
        if (dateTimeRepresentation == null || dateTimeRepresentation.trim().isEmpty()) {
            return null;
        }
        try {
            return LocalDateTime.parse(dateTimeRepresentation, DATE_TIME_FORMATTER);
        } catch (DateTimeParseException e) {
            throw new IllegalArgumentException("Invalid date-time format: " + dateTimeRepresentation, e);
        }
    }
}
