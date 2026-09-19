package com.oceancool.dto;

import com.oceancool.entity.PaymentStatus;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;

public record ServiceRequest(
        @NotNull(message = "Choose a customer")
        Long customerId,

        @NotBlank(message = "Service name is required")
        @Size(max = 120, message = "Service name is too long")
        String serviceName,

        @NotNull(message = "Amount is required")
        @DecimalMin(value = "0.00", message = "Amount cannot be negative")
        @Digits(integer = 10, fraction = 2, message = "Amount is not a valid figure")
        BigDecimal amount,

        @NotNull(message = "Service date is required")
        LocalDate serviceDate,

        @NotNull(message = "Payment status is required")
        PaymentStatus paymentStatus,

        /**
         * Only read when {@code paymentStatus} is PARTIAL — PAID fills it with the full
         * amount and PENDING with zero. Must be greater than 0 and below the amount.
         */
        @DecimalMin(value = "0.00", message = "Paid amount cannot be negative")
        @Digits(integer = 10, fraction = 2, message = "Paid amount is not a valid figure")
        BigDecimal paidAmount,

        LocalDate paymentDate,

        @Size(max = 500, message = "Remarks are too long")
        String remarks
) {
}
