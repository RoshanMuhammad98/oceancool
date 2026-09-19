package com.oceancool.repository;

import java.math.BigDecimal;

/**
 * Per-customer money rollup, aggregated in one query so the customer list does not
 * fan out into a query per row.
 */
public interface CustomerTotalsView {

    Long getCustomerId();

    long getTotalServices();

    BigDecimal getTotalAmount();

    BigDecimal getPaidAmount();
}
