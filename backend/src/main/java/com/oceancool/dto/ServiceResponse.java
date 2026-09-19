package com.oceancool.dto;

import com.oceancool.entity.PaymentStatus;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public record ServiceResponse(
        Long id,
        Long customerId,
        String customerName,
        String customerPhone,
        String serviceName,
        BigDecimal amount,
        BigDecimal paidAmount,
        BigDecimal pendingAmount,
        LocalDate serviceDate,
        PaymentStatus paymentStatus,
        LocalDate paymentDate,
        String remarks,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
