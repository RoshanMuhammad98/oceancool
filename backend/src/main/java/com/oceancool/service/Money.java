package com.oceancool.service;

import java.math.BigDecimal;
import java.math.RoundingMode;

/**
 * Every rupee figure in this app is a BigDecimal at scale 2 (business rule 10).
 * Normalising in one place keeps {@code compareTo} and {@code equals} honest and stops
 * 2500 and 2500.00 from looking like different numbers on the wire.
 */
public final class Money {

    private Money() {
    }

    public static BigDecimal zero() {
        return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
    }

    public static BigDecimal scale(BigDecimal value) {
        return value == null ? zero() : value.setScale(2, RoundingMode.HALF_UP);
    }

    public static boolean isZero(BigDecimal value) {
        return value == null || value.compareTo(BigDecimal.ZERO) == 0;
    }

    public static boolean isNegative(BigDecimal value) {
        return value != null && value.compareTo(BigDecimal.ZERO) < 0;
    }

    public static BigDecimal sum(BigDecimal a, BigDecimal b) {
        return scale(scale(a).add(scale(b)));
    }
}
