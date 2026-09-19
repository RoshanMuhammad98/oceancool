package com.oceancool.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record ReportResponse(
        LocalDate from,
        LocalDate to,
        String groupBy,
        long totalServices,
        BigDecimal totalAmount,
        BigDecimal collectedAmount,
        BigDecimal pendingAmount,
        List<ReportBucket> buckets
) {
    /** One row of the report — a day, week, month or year within the filter range. */
    public record ReportBucket(
            String label,
            LocalDate from,
            LocalDate to,
            long services,
            BigDecimal amount,
            BigDecimal collected,
            BigDecimal pending
    ) {
    }
}
