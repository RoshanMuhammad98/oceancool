package com.oceancool.dto;

/**
 * Deliberately shaped like a JWT response so swapping the opaque token for a signed
 * one later is a change inside {@code UserService} only. No password field, ever.
 */
public record LoginResponse(
        String token,
        Long userId,
        String username,
        String displayName
) {
}
