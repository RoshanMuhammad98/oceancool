package com.oceancool.exception;

/** Maps to HTTP 404. */
public class NotFoundException extends RuntimeException {

    public NotFoundException(String message) {
        super(message);
    }

    public static NotFoundException of(String what, Long id) {
        return new NotFoundException(what + " " + id + " was not found");
    }
}
