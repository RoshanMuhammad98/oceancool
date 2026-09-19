package com.oceancool.exception;

/** Maps to HTTP 400 — a business rule was broken, not a bean-validation failure. */
public class BadRequestException extends RuntimeException {

    public BadRequestException(String message) {
        super(message);
    }
}
