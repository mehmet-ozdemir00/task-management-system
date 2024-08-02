package com.kenzie.capstone.service.util;

import com.amazonaws.services.dynamodbv2.datamodeling.DynamoDBTypeConverter;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeFormatterBuilder;
import java.time.format.DateTimeParseException;
import java.time.temporal.ChronoField;

/**
 * Handles conversion between LocalDateTime and String.
 */
public class LocalDateTimeConverter implements DynamoDBTypeConverter<String, LocalDateTime> {

    private static final DateTimeFormatter DATE_TIME_FORMATTER = new DateTimeFormatterBuilder()
            .appendPattern("yyyy-MM-dd'T'HH:mm:ss.SSS")
            .optionalStart()
            .appendFraction(ChronoField.NANO_OF_SECOND, 1, 3, true)
            .optionalEnd()
            .toFormatter();

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
