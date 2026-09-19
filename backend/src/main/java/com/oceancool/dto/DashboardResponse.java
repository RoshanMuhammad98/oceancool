package com.oceancool.dto;

import java.math.BigDecimal;
import java.util.List;

public record DashboardResponse(
        long todayServices,
        /** Billed today. */
        BigDecimal todayRevenue,
        /** Of what was billed today, how much has been received. Never exceeds it. */
        BigDecimal todayCollected,
        BigDecimal monthRevenue,
        BigDecimal monthCollected,
        BigDecimal totalPending,
        long totalCustomers,
        List<ServiceResponse> recentServices
) {
}
