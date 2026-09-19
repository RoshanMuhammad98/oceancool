package com.oceancool.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * One job done for one customer.
 *
 * <p>Money lives on this row: {@code amount} is billed, {@code paidAmount} is received
 * so far, and pending is the difference. {@code paymentStatus} is always derived from
 * those two numbers, never set by hand — see {@code ServiceRecordService.applyMoney}.
 *
 * <p>When per-instalment history is needed later, a {@code payments} child table can be
 * added and {@code paidAmount} becomes its SUM; nothing else in the API has to change.
 */
@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "service_records", indexes = {
        @Index(name = "idx_service_customer", columnList = "customer_id"),
        @Index(name = "idx_service_date", columnList = "service_date"),
        @Index(name = "idx_service_status", columnList = "payment_status")
})
public class ServiceRecord extends Auditable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    @Column(name = "service_name", nullable = false, length = 120)
    private String serviceName;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal amount = BigDecimal.ZERO;

    @Column(name = "paid_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal paidAmount = BigDecimal.ZERO;

    @Column(name = "service_date", nullable = false)
    private LocalDate serviceDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_status", nullable = false, length = 10)
    private PaymentStatus paymentStatus = PaymentStatus.PENDING;

    /** Date the money was last received. Null while nothing has been collected. */
    @Column(name = "payment_date")
    private LocalDate paymentDate;

    @Column(length = 500)
    private String remarks;

    public BigDecimal getPendingAmount() {
        return amount.subtract(paidAmount);
    }
}
