package com.oceancool.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Collecting money against a job that was done earlier — the "service in September,
 * cash in October" case. {@code paidAmount} is the running total received for the
 * record, not an instalment, so re-sending it is safe.
 */
public record ServicePaymentRequest(
        @NotNull(message = "Paid amount is required")
        @DecimalMin(value = "0.00", message = "Paid amount cannot be negative")
        @Digits(integer = 10, fraction = 2, message = "Paid amount is not a valid figure")
        BigDecimal paidAmount,

        LocalDate paymentDate
) {
}
