package com.oceancool.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record CustomerResponse(
        Long id,
        String name,
        String phoneNumber,
        String address,
        long totalServices,
        BigDecimal totalAmount,
        BigDecimal paidAmount,
        BigDecimal pendingAmount,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
