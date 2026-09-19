package com.oceancool.dto;

import java.math.BigDecimal;
import java.util.List;

public record DashboardResponse(
        long todayServices,
        /** Billed today. */
        BigDecimal todayRevenue,
        /** Cash actually received today, whenever the job was done. */
        BigDecimal todayCollected,
        BigDecimal monthRevenue,
        BigDecimal monthCollected,
        BigDecimal totalPending,
        long totalCustomers,
        List<ServiceResponse> recentServices
) {
}
