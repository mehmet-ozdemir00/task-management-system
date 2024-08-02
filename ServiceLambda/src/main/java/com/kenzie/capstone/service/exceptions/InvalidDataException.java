package com.kenzie.capstone.service.exceptions;

import java.util.HashMap;
import java.util.Map;

/**
 * Custom exception class to represent errors related to invalid data.
 * This exception extends {@link RuntimeException} and includes a method
 * to generate a detailed error payload. The payload contains information
 * about the error type and the error message.
 */
public class InvalidDataException extends RuntimeException {

    public InvalidDataException(String msg) {
        super(msg);
    }

    public Map<String, Object> errorPayload() {
        Map<String, Object> errorPayload = new HashMap<>();
        errorPayload.put("errorType", "invalid_data");
        errorPayload.put("message", this.getMessage());
        return errorPayload;
    }
}